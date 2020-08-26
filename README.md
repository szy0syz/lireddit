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
