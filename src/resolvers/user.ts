import { MyContext } from './../types';
import { User } from './../entities/User';
import {
  Resolver,
  Mutation,
  InputType,
  Field,
  Arg,
  Ctx,
  ObjectType,
} from 'type-graphql';
import argon2 from 'argon2';

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  filed: string;

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
  @Mutation(() => UserReponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserReponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          { filed: 'username', message: 'length must be greater than 2' },
        ],
      };
    }

    if (options.password.length <= 3) {
      return {
        errors: [
          { filed: 'password', message: 'length must be greater than 3' },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
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
          errors: [{ filed: 'username', message: 'username already taken' }],
        };
      }
    }

    return { user };
  }

  @Mutation(() => UserReponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserReponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [{ filed: 'username', message: "that username doesn't esist" }],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [{ filed: 'password', message: 'incorrect password' }],
      };
    }

    return { user };
  }
}
