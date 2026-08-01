import { TooManyRequestsError } from '../../../errors/too-many-requests-error';
import type { UploadWorkLimiterOptions, UploadWorkLimiters } from '../uploadWorkLimiters';
import { createUploadWorkLimiters } from '../uploadWorkLimiters';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const waitUntil = async (predicate: () => boolean, timeoutMs = 2000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};

const createdLimiters: UploadWorkLimiters[] = [];

const makeLimiters = (options?: UploadWorkLimiterOptions): UploadWorkLimiters => {
  const limiters = createUploadWorkLimiters(options);
  createdLimiters.push(limiters);
  return limiters;
};

afterEach(async () => {
  await Promise.all(createdLimiters.splice(0).map((limiters) => limiters.dispose()));
});

it('bounds the google provider to at most two concurrent calls', async () => {
  const limiters = makeLimiters({
    googleMaxConcurrent: 2,
    googleMinTime: 0,
    googleHighWater: 10,
  });

  let running = 0;
  let maxRunning = 0;
  const gates = Array.from({ length: 6 }, () => deferred<void>());

  const jobs = gates.map((gate) =>
    limiters.scheduleGoogle(async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await gate.promise;
      running -= 1;
    })
  );

  await waitUntil(() => running === 2);

  expect(maxRunning).toBe(2);
  expect(running).toBe(2);

  gates.forEach((gate) => {
    gate.resolve();
  });
  await Promise.all(jobs);
  expect(running).toBe(0);
});

it('bounds a single user to at most three concurrent uploads', async () => {
  const limiters = makeLimiters({
    userMinTime: 0,
    userHighWater: 10,
  });

  let running = 0;
  let maxRunning = 0;
  const gates = Array.from({ length: 6 }, () => deferred<void>());

  const jobs = gates.map((gate) =>
    limiters.scheduleUser('user-a', async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await gate.promise;
      running -= 1;
    })
  );

  await waitUntil(() => running === 3);

  expect(maxRunning).toBe(3);
  expect(running).toBe(3);

  gates.forEach((gate) => {
    gate.resolve();
  });
  await Promise.all(jobs);
  expect(running).toBe(0);
});

it('allows two users to run up to six uploads while each key stays bounded at three', async () => {
  const limiters = makeLimiters({
    userMinTime: 0,
    userHighWater: 10,
  });

  let running = 0;
  let maxRunning = 0;
  const perKeyRunning: Record<string, number> = {};
  const perKeyMax: Record<string, number> = {};
  const gates = Array.from({ length: 6 }, () => deferred<void>());

  const jobs = gates.map((gate, index) => {
    const key = index % 2 === 0 ? 'user-a' : 'user-b';
    return limiters.scheduleUser(key, async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      perKeyRunning[key] = (perKeyRunning[key] ?? 0) + 1;
      perKeyMax[key] = Math.max(perKeyMax[key] ?? 0, perKeyRunning[key]);
      await gate.promise;
      perKeyRunning[key] -= 1;
      running -= 1;
    });
  });

  await waitUntil(() => running === 6);

  expect(maxRunning).toBe(6);
  expect(perKeyMax['user-a']).toBe(3);
  expect(perKeyMax['user-b']).toBe(3);

  gates.forEach((gate) => {
    gate.resolve();
  });
  await Promise.all(jobs);
  expect(running).toBe(0);
});

it('rejects overflowed uploads with a 429 TooManyRequestsError', async () => {
  const limiters = makeLimiters({
    userMaxConcurrent: 1,
    userMinTime: 0,
    userHighWater: 0,
  });

  let running = 0;
  const gate = deferred<void>();

  const firstJob = limiters.scheduleUser('overflow-user', async () => {
    running += 1;
    await gate.promise;
    return 'first';
  });

  await waitUntil(() => running === 1);

  const overflowed = limiters.scheduleUser('overflow-user', async () => 'second');
  const error = await overflowed.catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(TooManyRequestsError);
  expect((error as TooManyRequestsError).statusCode).toBe(429);
  expect((error as TooManyRequestsError).serializeErrors()).toEqual([
    { message: 'Too many requests, please try again later' },
  ]);

  gate.resolve();
  await expect(firstJob).resolves.toBe('first');
});

it('passes task errors through unchanged', async () => {
  const limiters = makeLimiters({
    userMinTime: 0,
  });

  const taskError = new Error('task exploded');

  await expect(
    limiters.scheduleUser('task-error-user', async () => {
      throw taskError;
    })
  ).rejects.toBe(taskError);
});
