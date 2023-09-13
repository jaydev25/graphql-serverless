// src/users/users.resolver.ts
import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserType, CreateUserInput, TokenType, Message } from './users.model';
import { PubSub } from 'graphql-subscriptions';
import Publish from './../helpers/pub.sub';

const pubsub = new PubSub();

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserType)
  async user(@Args('mobileNo') mobileNo: string) {
    return this.usersService.findOneByMobileNo(mobileNo);
  }

  @Query(() => [UserType])
  async users() {
    return this.usersService.findAll();
  }

  @Mutation(() => UserType)
  async createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.createUser(input);
  }

  @Query(() => TokenType)
  async login(@Args('input') input: CreateUserInput) {
    try {
      const loggedInUser = await this.usersService.login(input);

      const publish = {
        publishTo: `USER_ACTION_${loggedInUser.mobileNo}`,
        data: {
          type: 'USER_LOGGED_IN',
          payload: loggedInUser,
        },
      };

      Publish(publish);

      return loggedInUser;
    } catch (error) {
      console.log('login error', error);
    }
  }

  @Query(() => TokenType)
  async validateToken(@Args('token') token: string) {
    return this.usersService.validateToken(token);
  }

  @Mutation(() => String)
  async pubSub(@Args('publish') publish: string) {
    const publishObj = JSON.parse(publish);

    pubsub.publish(publishObj.publishTo, {
      userAction: JSON.stringify(publishObj.data),
    });

    return 'Success!';
  }

  @Subscription(() => String)
  async userAction(@Args('mobileNo') mobileNo: string) {
    return pubsub.asyncIterator(`USER_ACTION_${mobileNo}`);
  }

  @Mutation(() => String)
  async sendMessage(@Args('input') input: Message) {
    try {
      const publish = {
        publishTo: `USER_ACTION_${input.mobileNo}`,
        data: { type: 'MESSAGE', payload: input },
      };

      Publish(publish);

      return 'Success!';
    } catch (error) {
      console.log('login error', error);
    }
  }

  @Mutation(() => String)
  async userTyping(@Args('input') input: Message) {
    try {
      const publish = {
        publishTo: `USER_ACTION_${input.mobileNo}`,
        data: { type: 'USER_TYPING ', payload: input },
      };

      Publish(publish);

      return 'Success!';
    } catch (error) {
      console.log('login error', error);
    }
  }

  // @Mutation(() => UserType)
  // async validateOTP(@Args('input') input: ValidateOTPInput) {
  //   return this.usersService.createUser(input);
  // }
}
