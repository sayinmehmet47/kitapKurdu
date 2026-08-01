import Bottleneck from 'bottleneck';
import { TooManyRequestsError } from '../../errors/too-many-requests-error';

export interface UploadWorkLimiterOptions {
  googleMaxConcurrent?: number;
  googleMinTime?: number;
  googleHighWater?: number;
  userMaxConcurrent?: number;
  userMinTime?: number;
  userHighWater?: number;
  userIdleTimeout?: number;
}

export interface UploadWorkLimiters {
  scheduleGoogle<T>(task: () => Promise<T>): Promise<T>;
  scheduleUser<T>(userId: string, task: () => Promise<T>): Promise<T>;
  dispose(): Promise<void>;
}

const isDroppedJobError = (error: unknown): boolean => error instanceof Bottleneck.BottleneckError;

export const createUploadWorkLimiters = (
  options: UploadWorkLimiterOptions = {}
): UploadWorkLimiters => {
  const googleLimiter = new Bottleneck({
    maxConcurrent: options.googleMaxConcurrent ?? 2,
    minTime: options.googleMinTime ?? 200,
    highWater: options.googleHighWater ?? 50,
    strategy: Bottleneck.strategy.OVERFLOW,
  });

  const userGroup = new Bottleneck.Group({
    maxConcurrent: options.userMaxConcurrent ?? 3,
    minTime: options.userMinTime ?? 50,
    highWater: options.userHighWater ?? 20,
    strategy: Bottleneck.strategy.OVERFLOW,
    timeout: options.userIdleTimeout ?? 5 * 60 * 1000,
  });

  const dispose = async (): Promise<void> => {
    await googleLimiter.stop({ dropWaitingJobs: true });
    for (const key of userGroup.keys()) {
      await userGroup.deleteKey(key);
    }
  };

  return {
    scheduleGoogle: <T>(task: () => Promise<T>): Promise<T> => googleLimiter.schedule(task),
    scheduleUser: <T>(userId: string, task: () => Promise<T>): Promise<T> =>
      userGroup
        .key(userId)
        .schedule(task)
        .catch((error: unknown) => {
          if (isDroppedJobError(error)) {
            throw new TooManyRequestsError();
          }
          throw error;
        }),
    dispose,
  };
};

const productionLimiters = createUploadWorkLimiters();

export const scheduleGoogleBooksMetadata = <T>(task: () => Promise<T>): Promise<T> =>
  productionLimiters.scheduleGoogle(task);

export const scheduleUserUpload = <T>(userId: string, task: () => Promise<T>): Promise<T> =>
  productionLimiters.scheduleUser(userId, task);
