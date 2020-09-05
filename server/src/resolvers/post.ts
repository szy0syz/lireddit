import { Updoot } from './../entities/Updoot';
import { isAuth } from './../middleware/isAuth';
import { Post } from './../entities/Post';
import { getConnection } from 'typeorm';
import {
  Resolver,
  Query,
  Arg,
  Int,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
  ObjectType,
} from 'type-graphql';
import { MyContext } from 'src/types';

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 60);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('value', () => Int) _value: number,
    @Arg('postId', () => Int) postId: number,
    @Ctx() { req }: MyContext
  ) {
    const userId = req.session.userId;
    const isUpdoot = _value !== -1;
    const value = isUpdoot ? 1 : -1;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // and they are changing their vote
    if (updoot && updoot.value !== value) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3
        `,
          [value, postId, userId]
        );

        // 要抵消原来反方向的产生的作用，所有要乘2
        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2;
        `,
          [2 * value, postId]
        );
      });
    } else if (!updoot) {
      // has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          insert into updoot ("userId", "postId", value)
          values ($1, $2, $3);
        `,
          [userId, postId, value]
        );

        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2;
        `,
          [value, postId]
        );
      });
    }

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    // @Arg("offset", () => Int, { nullable: true }) offset: number | null,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    // 判断 hasMore 的小技巧
    // TODO use [offset]
    // const skip = typeof offset === "number" ? offset : 0;
    const realLimit = Math.min(50, limit);
    const reaLimitPlusOne = realLimit + 1;

    const replacements: any[] = [reaLimitPlusOne];

    if (req.session.userId) {
      replacements.push(req.session.userId);
    }

    let cursorIdx = 3; //* 注意：替换的是replacements的index值

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIdx = replacements.length;
    }

    const posts = await getConnection().query(
      `
    select p.*,
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
      ) creator,
    ${
      req.session.userId
        ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
        : 'null as "voteStatus"'
    }
    from post p
    inner join public.user u on u.id = p."creatorId"
    ${cursor ? `where p."createdAt" < $${cursorIdx}` : ''}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    // ---------------
    // let whereObj = {} as any;
    // if (cursor) whereObj.createdAt = LessThan(new Date(parseInt(cursor)));

    // const posts = await getConnection()
    //   .getRepository(Post)
    //   .find({
    //     relations: ['creator'],
    //     take: reaLimitPlusOne,
    //     where: whereObj,
    //     order: {
    //       createdAt: 'DESC',
    //     },
    //   });
    // ---------------

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === reaLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id, { relations: ['creator'] });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) return null;

    if (typeof title !== 'undefined') {
      await Post.update({ id }, { title });
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg('id') id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
