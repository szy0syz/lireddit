import { Cache, QueryInput } from "@urql/exchange-graphcache";

//* 遇到typescr解析不理想的情况下：包个函数，好好解析这些参数，全写在形参里太难看了
export function betterUpdateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) {
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
