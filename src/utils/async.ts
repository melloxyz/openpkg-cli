export const mapWithConcurrency = async <TValue, TResult>(
  values: TValue[],
  concurrency: number,
  mapper: (value: TValue, index: number) => Promise<TResult>,
  options: {
    onResolved?: (result: TResult, index: number) => void | Promise<void>;
  } = {}
): Promise<TResult[]> => {
  const results = new Array<TResult>(values.length);
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < values.length) {
      const index = currentIndex;
      currentIndex += 1;
      results[index] = await mapper(values[index]!, index);
      await options.onResolved?.(results[index], index);
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, values.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
};
