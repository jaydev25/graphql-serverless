// src/users/users.resolver.ts
import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserType, CreateUserInput, TokenType } from './users.model';
import { PubSub } from 'graphql-subscriptions';

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
    const loggedInUser = await this.usersService.login(input);
    pubsub.publish('LOGGED_IN', { userLoggedIn: loggedInUser });

    return loggedInUser;
  }

  @Query(() => TokenType)
  async validateToken(@Args('token') token: string) {
    return this.usersService.validateToken(token);
  }

  @Subscription(() => TokenType)
  async userLoggedIn() {
    return pubsub.asyncIterator('LOGGED_IN');
  }

  // @Mutation(() => UserType)
  // async validateOTP(@Args('input') input: ValidateOTPInput) {
  //   return this.usersService.createUser(input);
  // }
}
