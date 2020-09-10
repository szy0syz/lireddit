# LIREDDIT-SERVER

## Notes

- `yarn add -D @types/node typescript ts-node`
- `npx tsconfig.json`
- `npm` 脚本

```json
"scripts": {
  "watch": "tsc -w",
  "dev": "nodemon dist/index.js",
  "start": "node dist/index.js",
  "start2": "ts-node src/index.ts",
  "dev2": "nodemon --exec ts-node src/index.ts"
},
```

- `yarn add @mikro-orm/cli @mikro-orm/core @mikro-orm/migrations @mikro-orm/postgresql pg`

```yml
version: '3.1'

services:

  db:
    image: postgres:12
    restart: always
    environment:
      POSTGRES_PASSWORD: pass123
    volumes:
      - /Users/szy0syz/workspace/postgresSQL:/var/lib/postgresql/data
    ports:
      - 5432:5432

  adminer:
    image: adminer:latest
    restart: always
    ports:
      - 8190:8080
```

- `npx mikro-orm migration:create`
- `yarn add express apollo-server-express graphql type-graphql`
- `yarn add -D @types/express`
- `yarn add argon2`
- `yarn add redis connect-redis express-session`
- `yarn add -D @types/redis @types/express-session @types/connect-redis`
- `yarn create next-app --example with-chakra-ui web`
- `https://graphql-code-generator.com/`
- `yarn add -D @graphql-codegen/cli`

- 关于 typsscript 类型推断优化

```ts
//* 遇到typescr解析不理想的情况下：包个函数，好好解析这些参数，全写在形参里太难看了
function betterUpdateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) {
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
```

- 在 GraphQL 里，重复的类型用 fragments 统一声明一下

```ts
fragment RegularUser on User {
  id
  username
}
```

- 分清业务到底适合在哪个端运行

```ts
const [{ data, fetching }] = useMeQuery({
    pause: isServer(), // 组织服务端渲染阶段执行，因为服务端拿不到客户端 cookie，没必要执行两次
  }); // 待到客服端环境在运行即可
let body = null;
```

- 竟然可以重启 typescript 服务 --> `shift + cmd + p` --> `restart typescript`

### DataLoader

> 如此之美妙

```ts
@FieldResolver(() => User)
creator(@Root() post: Post) {
  return User.findOne(post.creatorId);
}
```

```ts
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
  ${cursor ? `where p."createdAt" < $${cursorIdx}` : ""}
  order by p."createdAt" DESC
  limit $1
`,
  replacements
);
```

```sql
query: SELECT "User"."id" AS "User_id", "User"."email" AS "User_email", "User"."username" AS "User_username", "User"."password" AS "User_password", "User"."createdAt" AS "User_createdAt", "User"."updatedAt" AS "User_updatedAt" FROM "user" "User" WHERE "User"."id" IN ($1) -- PARAMETERS: [2]
query: SELECT "User"."id" AS "User_id", "User"."email" AS "User_email", "User"."username" AS "User_username", "User"."password" AS "User_password", "User"."createdAt" AS "User_createdAt", "User"."updatedAt" AS "User_updatedAt" FROM "user" "User" WHERE "User"."id" IN ($1) -- PARAMETERS: [1]
query: SELECT "User"."id" AS "User_id", "User"."email" AS "User_email", "User"."username" AS "User_username", "User"."password" AS "User_password", "User"."createdAt" AS "User_createdAt", "User"."updatedAt" AS "User_updatedAt" FROM "user" "User" WHERE "User"."id" IN ($1) -- PARAMETERS: [1]
query: SELECT "User"."id" AS "User_id", "User"."email" AS "User_email", "User"."username" AS "User_username", "User"."password" AS "User_password", "User"."createdAt" AS "User_createdAt", "User"."updatedAt" AS "User_updatedAt" FROM "user" "User" WHERE "User"."id" IN ($1) -- PARAMETERS: [1]
query: SELECT "User"."id" AS "User_id", "User"."email" AS "User_email", "User"."username" AS "User_username", "User"."password" AS "User_password", "User"."createdAt" AS "User_createdAt", "User"."updatedAt" AS "User_updatedAt" FROM "user" "User" WHERE "User"."id" IN ($1) -- PARAMETERS: [1]
query: SELECT "User"."id" AS "User_id", "User"."email" AS "User_email", "User"."username" AS "User_username", "User"."password" AS "User_password", "User"."createdAt" AS "User_createdAt", "User"."updatedAt" AS "User_updatedAt" FROM "user" "User" WHERE "User"."id" IN ($1) -- PARAMETERS: [1]
```

```sql
query:
      select p.*,
      (select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"
      from post p
      order by p."createdAt" DESC
      limit $1
     -- PARAMETERS: [16,1]
query: SELECT "User"."id" AS "User_id", "User"."email" AS "User_email", "User"."username" AS "User_username", "User"."password" AS "User_password", "User"."createdAt" AS "User_createdAt", "User"."updatedAt" AS "User_updatedAt" FROM "user" "User" WHERE "User"."id" IN ($1, $2) -- PARAMETERS: [2,1]
query: SELECT "User"."id" AS "User_id", "User"."email" AS "User_email", "User"."username" AS "User_username", "User"."password" AS "User_password", "User"."createdAt" AS "User_createdAt", "User"."updatedAt" AS "User_updatedAt" FROM "user" "User" WHERE "User"."id" IN ($1) -- PARAMETERS: [1]
```

## Depolying

- `dokku apps:create lireddit-api`
- `sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git`
- `dokku postgres:create lireddit`
- `dokku postgres:link lireddit lireddit-api`
- `DATABASE_URL:  postgres://postgres:6eef81e262c735bc6e3512b4b3c1578f@dokku-postgres-lireddit:5432/lireddit`
- `dokku redis:create olive`
- `REDIS_URL:  redis://olive:0662b72c64c205f75fed918376603a8b8f3420aea887ef27d78a7b50bd8017ed@dokku-redis-olive:6379`
- `docker pull szy0syz/lireddit:0.1`
- `docker tag szy0syz/lireddit:0.1 dokku/lireddit-api:0.1`
- `yarn add dotenv-safe`
- `npx gen-env-types .env -o src/env.d.ts -e .`
- `npx typeorm migration:generate -n Initial`
- `docker build -t szy0syz/lireddit:test .`
- `docker build -t szy0syz/lireddit:0.1 .`
- `dokku proxy:ports lireddit-api`

```bash
root@nykj-2c8g5m:~# dokku domains:report
=====> lireddit-api domains information
       Domains app enabled:           true
       Domains app vhosts:            lireddit-api.nykj-2c8g5m
       Domains global enabled:        true
       Domains global vhosts:         jerryshi.com
```

```bash
# 1. 创建 dokku app
dokku apps:create lireddit-serv

# 2. 下载 docker iamge
docker pull szy0syz/some-image:v1.0

# 3. retag image to match the created app
docker tag szy0syz/some-image:v1.0 dokku/test-app:v1.0

# 4. deploy tag
dokku tags:deploy test-app v1.0
```

```bash
# ~~~ new deploy ~~~
dokku apps:create lireddit-api
dokku postgres:create lireddit-db

dokku postgres:link lireddit-db lireddit-api
dokku redis:create lireddit-redis
dokku redis:link lireddit-redis lireddit-api

dokku domains:add lireddit-api
dokku domains:add-global lireddit-api
# domains:remove ...

dokku proxy:ports-add lireddit-api http:80:8080

dokku certs:add lireddit-apiapi < jerryshi-cert-key.tar
```
