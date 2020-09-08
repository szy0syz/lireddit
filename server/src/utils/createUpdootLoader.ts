import { Updoot } from './../entities/Updoot';
import DataLoader from 'dataloader';

// [{postId: 4, userId: 12}, ...]
// [{postId: 4, userId: 12, value: 1}, ... ]
export const createUpdootLoader = () => {
  return new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);
      const updootIdsToUpdoot: Record<string, Updoot> = {};
      updoots.forEach((updoot) => {
        updootIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
      });
      console.log('~~updoots', updoots);
      return keys.map(
        (key) => updootIdsToUpdoot[`${key.userId}|${key.postId}`]
      );
    }
  );
};
