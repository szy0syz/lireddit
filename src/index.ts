import { MikroORM } from '@mikro-orm/core';
import microConfig from './mikro-orm.config';
import { Post } from './entities/Post';
const main = async () => {
  const orm = MikroORM.init(microConfig);

  const post = orm.em.create(Post, { title: 'my first post' });
  await orm.em.persistAndFlush(post);
  console.log('------ sql 2 ------');
  await orm.em.nativeInsert(Post, { title: 'my first post 2' });
};

main();
