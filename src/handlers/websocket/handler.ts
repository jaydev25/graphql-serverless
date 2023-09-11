import ApiGatewayWebSocketHandler, {
  WebSocketAction,
} from './utils/handlers/ApiGatewayWebSocketHandler';
import AWS from 'aws-sdk';
// import TranslateClient from './utils/TranslateClient';
import { flatMap } from './utils/arrays';

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
});
// const translate = new TranslateClient();

class ConnectionsHandler extends ApiGatewayWebSocketHandler<any, string> {
  async subscribe(channel: string, connectionId: string, meta: any) {
    try {
      const value1 = {
        TableName: 'connections',
        Item: {
          channel: channel,
          connectionId: connectionId,
          meta: meta,
        },
      };
      const value2 = {
        TableName: 'connectionsChannels',
        Item: {
          connectionId: connectionId,
          channel: channel,
        },
      };
      await Promise.all([
        await dynamoDB.put(value1).promise(),
        await dynamoDB.put(value2).promise(),
      ]);
    } catch (error) {
      console.log('subscribe error', error);
    }
  }

  async unsubscribe(connectionId: string) {
    const scan = await dynamoDB
      .scan({
        TableName: 'connectionsChannels',
        FilterExpression: 'connectionId = :this_connection',
        ExpressionAttributeValues: { ':this_connection': connectionId },
      })
      .promise();
    if (scan.Items) {
      const channelsDeletes = flatMap((obj: any) => {
        const value1 = {
          TableName: 'connectionsChannels',
          Key: {
            connectionId: connectionId,
            channel: obj.channel,
          },
        };
        const value2 = {
          TableName: 'connections',
          Key: {
            channel: obj.channel,
            connectionId: connectionId,
          },
        };
        return [
          dynamoDB.delete(value1).promise(),
          dynamoDB.delete(value2).promise(),
        ];
      }, scan.Items);
      await Promise.all(channelsDeletes);
    }
  }
  async process(event: WebSocketAction<any>): Promise<string> {
    switch (event.action) {
      case 'connect':
        await this.subscribe(
          event.meta.channel,
          event.meta.connectionId,
          event.meta,
        );
        break;
      case 'disconnect':
        await this.unsubscribe(event.meta.connectionId);
        break;
    }
    console.log('Event:', JSON.stringify(event));
    return 'OK';
  }
}

class MessageHandler extends ApiGatewayWebSocketHandler<any, string> {
  async getSubscribers(channel: string): Promise<any[]> {
    try {
      const scan = await dynamoDB
        .scan({
          TableName: 'connections',
          FilterExpression: 'channel = :this_channel',
          ExpressionAttributeValues: { ':this_channel': channel },
        })
        .promise();
      return scan.Items as any[];
    } catch (error) {
      console.log('getSubscribers error', error);
    }
  }

  async sendToChannel(event: WebSocketAction<any>, payload: any) {
    try {
      const connections = await this.getSubscribers(event.meta.channel);
      const url = `http://localhost:3001`;
      // const translations = {};
      // const srcConnection = connections.find(
      //   (conn) => conn.connectionId === event.meta.connectionId,
      // );
      const promises = connections.map(async (connection) => {
        if (!connection) {
          return;
        }
        const translatedText = payload.message;
        // if (connection.meta && connection.meta.language) {
        //   translatedText = translations[connection.meta.language];
        //   if (!translatedText) {
        //     translatedText = await translate.translateText(
        //       payload.message,
        //       srcConnection.meta.language,
        //       connection.meta.language,
        //     );
        //   }
        // }
        const id = connection.connectionId;
        payload.message = translatedText;
        return this.sendMessageToClient(url, id, payload);
      });
      await Promise.all(promises);
      return;
    } catch (error) {
      console.log('sendToChannel error', error);
    }
  }

  async process(event: WebSocketAction<any>): Promise<string> {
    switch (event.action) {
      case 'message':
      default:
        await this.sendToChannel(event, {
          from: event.meta.connectionId,
          username: event.data.username,
          message: event.data.message,
        });
        return 'OK';
    }
  }
}

export const connect = new ConnectionsHandler().start();
export const message = new MessageHandler().start();
