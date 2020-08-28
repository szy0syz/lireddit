import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
@Entity()
export class User {
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: 'date' })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  // @Field()  如果这里不注入 Field 则 GraphQL 拿不到该字段
  @Field()
  @Property({ type: 'text', unique: true })
  email!: string;

  @Field()
  @Property({ type: 'text', unique: true })
  username!: string;

  @Property({ type: 'text' })
  password!: string;
}
