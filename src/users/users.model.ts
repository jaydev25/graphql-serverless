// src/users/user.model.ts
import {
  Field,
  ObjectType,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { UserStatus } from './enums';

registerEnumType(UserStatus, { name: 'UserStatus' });

@ObjectType()
export class UserType {
  @Field()
  readonly id: string;

  @Field()
  readonly mobileNo: string;

  // @Field()
  // readonly password: string;

  @Field({
    defaultValue: false,
  })
  readonly verified: boolean;

  @Field(() => UserStatus, {
    defaultValue: UserStatus.CREATED,
  })
  readonly status: UserStatus;
}

@InputType()
export class CreateUserInput {
  @Field()
  readonly mobileNo: string;

  @Field()
  readonly password: string;
}

@InputType()
export class ValidateOTPInput {
  @Field()
  readonly mobileNo: string;

  @Field()
  readonly otp: string;
}

@ObjectType()
export class TokenType extends UserType {
  @Field()
  readonly token: string;

  @Field()
  readonly success: boolean;

  @Field()
  readonly message: string;
}
