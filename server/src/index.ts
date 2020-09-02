import "reflect-metadata";
import { Post } from './entities/Post';
import { User } from './entities/User';
import express from "express";
import { UserResolver } from "./resolvers/user";
import { PostResolver } from "./resolvers/post";
import { __prod__, COOKIE_NAME } from "./constants";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { createConnection } from "typeorm";

const main = async () => {
  // eslint-disable-next-line
  const conn = await createConnection({
    type: 'postgres',
    database: 'lireddit2',
    username: 'postgres',
    password: 'pass123',
    logging: true,
    synchronize: true,
    entities: [User, Post]
  });



  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log("server started on http://localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
