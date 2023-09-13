import { gql, request } from 'graphql-request';

export default async (publish) => {
  try {
    const { WEB_SOCKET_URI } = process.env;

    const document = gql`
      mutation {
        pubSub(publish: "${JSON.stringify(publish).replaceAll('"', '\\"')}")
      }
    `;

    await request(WEB_SOCKET_URI, document);
  } catch (error) {
    console.log('publish error', error);
  }
};
