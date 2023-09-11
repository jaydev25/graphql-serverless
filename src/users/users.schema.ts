// src/users/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserStatus } from './enums';

@Schema()
export class User extends Document {
  @Prop({ required: true, index: true, unique: true })
  mobileNo: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  otp: string;

  @Prop({ required: false, default: false })
  verified: boolean;

  @Prop({ required: false, default: UserStatus.CREATED })
  status: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
