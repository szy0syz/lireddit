import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from './../constants';
import { Query } from 'type-graphql';
import { MyContext } from './../types';
import { User } from './../entities/User';
import { Resolver, Mutation, Field, Arg, Ctx, ObjectType } from 'type-graphql';
import argon2 from 'argon2';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/snedEmail';
import { v4 } from 'uuid';
import { getConnection } from 'typeorm';

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 3) {
      return {
        errors: [
          { field: 'newPassword', message: 'length must be greater than 3' },
        ],
      };
    }
    const key = FORGOT_PASSWORD_PREFIX;
    let userId = await redis.get(key + token);
    if (!userId) {
      return {
        errors: [{ field: 'token', message: 'token expired' }],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne();
    if (!user) {
      return {
        errors: [{ field: 'token', message: 'user no longer exists' }],
      };
    }
    const hashedPassword = await argon2.hash(newPassword);

    await User.update({ id: userIdNum }, { password: hashedPassword });

    // remove this token, avoid reuse
    await redis.del(key + token);

    // log in user after change password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) return true; // the email is not in the db

    const token = v4();

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24
    );
    console.log(`http://localhost:3000/change-password/${token}`);
    sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );

    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // not logged in
    if (!req.session.userId) return null;

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);

    if (errors) return { errors };

    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      // User.create({}).save();
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          email: options.email,
          username: options.username,
          password: hashedPassword,
        })
        .returning('*')
        .execute();
      user = result.raw[0];
      console.log('result:', result);
    } catch (err) {
      // duplication username error
      // || err.detail.includes("already exists")
      if (err.code === '23505') {
        return {
          errors: [{ field: 'username', message: 'username already taken' }],
        };
      }
    }

    // 当注册成功后就存储 userid 到 session 里
    req.session!.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (!usernameOrEmail)
      return {
        errors: [
          { field: 'usernameOrEmail', message: 'username or email is empty' },
        ],
      };

    if (!password)
      return {
        errors: [{ field: 'password', message: 'password is empty' }],
      };

    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!user) {
      return {
        errors: [
          { field: 'usernameOrEmail', message: "that username doesn't esist" },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [{ field: 'password', message: 'incorrect password' }],
      };
    }

    req.session!.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
