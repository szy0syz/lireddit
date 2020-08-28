import { COOKIE_NAME } from './../constants';
import { Query } from 'type-graphql';
import { MyContext } from './../types';
import { User } from './../entities/User';
import { Resolver, Mutation, Field, Arg, Ctx, ObjectType } from 'type-graphql';
import argon2 from 'argon2';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from '../utils/validateRegister';

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserReponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string, @Ctx() { em }: MyContext) {
    const user = await em.findOne(User, { email });
    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    // not logged in
    if (!req.session.userId) return null;

    const user = await em.findOne(User, { id: req.session.userId });

    return user;
  }

  @Mutation(() => UserReponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserReponse> {
    const errors = validateRegister(options);

    if (errors) return { errors };

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      email: options.email,
      username: options.username,
      password: hashedPassword,
    });

    try {
      await em.persistAndFlush(user);
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

  @Mutation(() => UserReponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserReponse> {
    if (!usernameOrEmail) return {
      errors: [{ field: 'usernameOrEmail', message: "username or email is empty" }],
    }

    if (!password) return {
      errors: [{ field: 'password', message: "password is empty" }],
    }

    const user = await em.findOne(
      User,
      usernameOrEmail.includes('@')
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [{ field: 'usernameOrEmail', message: "that username doesn't esist" }],
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
