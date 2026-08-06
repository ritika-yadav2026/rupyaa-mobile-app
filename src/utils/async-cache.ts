type AsyncCacheOptions<T> = {
  shouldCache?: (value: T) => boolean;
};

type GetOrFetchOptions<T> = {
  forceRefresh?: boolean;
  shouldCache?: (value: T) => boolean;
};

export function createAsyncCache<T>(options: AsyncCacheOptions<T> = {}) {
  let hasValue = false;
  let value: T | undefined;
  let inFlight: Promise<T> | null = null;

  const defaultShouldCache = options.shouldCache ?? (() => true);

  const getCached = () => (hasValue ? value : undefined);

  const set = (next: T) => {
    value = next;
    hasValue = true;
  };

  const clear = () => {
    value = undefined;
    hasValue = false;
  };

  const getOrFetch = async (
    fetcher: () => Promise<T>,
    opts: GetOrFetchOptions<T> = {}
  ): Promise<T> => {
    if (inFlight) return inFlight;
    if (!opts.forceRefresh && hasValue) return value as T;

    const shouldCache = opts.shouldCache ?? defaultShouldCache;

    inFlight = (async () => {
      try {
        const result = await fetcher();
        if (shouldCache(result)) {
          value = result;
          hasValue = true;
        }
        return result;
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  };

  return { getCached, getOrFetch, set, clear };
}
