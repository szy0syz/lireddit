import { User } from "./../entities/User";
import { Updoot } from "./../entities/Updoot";
import { isAuth } from "./../middleware/isAuth";
import { Post } from "./../entities/Post";
import { getConnection } from "typeorm";
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
} from "type-graphql";
import { MyContext } from "src/types";

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

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(@Root() post: Post, @Ctx() { req, updootLoader }: MyContext) {
    if (!req.session.userId) return null;
    try {
      const updoot = await updootLoader.load({
        postId: post.id,
        userId: req.session.userId,
      });

      return updoot ? updoot.value : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("value", () => Int) _value: number,
    @Arg("postId", () => Int) postId: number,
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
    @Arg("limit", () => Int) limit: number,
    // @Arg("offset", () => Int, { nullable: true }) offset: number | null,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    // @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    // 判断 hasMore 的小技巧
    // TODO use [offset]
    // const skip = typeof offset === "number" ? offset : 0;
    const realLimit = Math.min(50, limit);
    const reaLimitPlusOne = realLimit + 1;

    const replacements: any[] = [reaLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await getConnection().query(
      `
      select p.*
      from post p
      ${cursor ? `where p."createdAt" < $2` : ""}
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
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(@Arg("input") input: PostInput, @Ctx() { req }: MyContext): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(@Arg("id", () => Int) id: number, @Ctx() { req }: MyContext): Promise<boolean> {
    //* 这点逻辑也够绝的
    //! ---- but not cascade way ----
    // const post = await Post.findOne(id);
    // if (!post) return false;
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error('not authorized');
    // }
    // await Updoot.delete({ postId: id });
    // await Post.delete({ id });

    const post = await Post.findOne(id);
    if (!post) return false;
    if (post.creatorId !== req.session.userId) {
      throw new Error("not authorized");
    }

    const creatorId = req.session.userId;
    const response = await Post.delete({ id, creatorId });
    console.log("~~~response:", response);
    return true;
  }
}
