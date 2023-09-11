import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';
import { CreateUserInput } from './users.model';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(createUserInput: CreateUserInput): Promise<User> {
    const { mobileNo, password } = createUserInput;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      mobileNo,
      password: hashedPassword,
    });
    return user.save();
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findOneByMobileNo(mobileNo: string): Promise<User | null> {
    return this.userModel.findOne({ mobileNo }).exec();
  }

  async findAll(): Promise<any> {
    return this.userModel.find().exec();
  }

  async login(createUserInput: CreateUserInput): Promise<any> {
    try {
      console.log('11111111111111111111111111111111111');
      const { mobileNo, password } = createUserInput;

      const user = await this.userModel.findOne({ mobileNo }).exec();
      if (!user) throw new GraphQLError('Invalid mobile number');
      console.log('2222222222222222222222222', user);

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new GraphQLError('Password incorrect!');

      const token = jwt.sign({ userId: user.id }, 'your-secret-key', {
        expiresIn: '1h',
      });

      return {
        ...user.toJSON(),
        token,
        message: 'Login successful!',
        success: true,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      const { userId } = jwt.verify(token, 'your-secret-key');

      const user = await this.userModel.findById(userId).exec();
      if (!user) throw new GraphQLError('Invalid user ID!');

      return {
        ...user.toJSON(),
        token,
        message: 'Token validated successfully!',
        success: true,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // async updateUser(createUserInput: CreateUserInput): Promise<User> {
  //   const createdUser = new this.userModel(createUserInput);
  //   return createdUser.save();
  // }
}
