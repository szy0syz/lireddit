import { Updoot } from "./../entities/Updoot";
import { isAuth } from "./../middleware/isAuth";
import { Post } from "./../entities/Post";
import { getConnection, LessThan } from "typeorm";
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
    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value,
    // });
    await getConnection().query(
      `
    START TRANSACTION;

    insert into updoot ("userId", "postId", value)
    values (${userId},${postId},${value});

    update post
    set points = points + ${value}
    where id = ${postId};

    COMMIT;
    `
    );

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    // @Arg("offset", () => Int, { nullable: true }) offset: number | null,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    // 判断 hasMore 的小技巧
    // TODO use [offset]
    // const skip = typeof offset === "number" ? offset : 0;
    const realLimit = Math.min(50, limit);
    const reaLimitPlusOne = realLimit + 1;
    let whereObj = {} as any;
    if (cursor) whereObj.createdAt = LessThan(new Date(parseInt(cursor)));

    const posts = await getConnection()
      .getRepository(Post)
      .find({
        relations: ["creator"],
        take: reaLimitPlusOne,
        where: whereObj,
        order: {
          createdAt: "DESC",
        },
      });

    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(reaLimitPlusOne);

    // if (cursor) {
    //   qb.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }

    // const posts = await qb.getMany();

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
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) return null;

    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
