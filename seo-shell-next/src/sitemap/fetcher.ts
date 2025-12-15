export type GraphQLFetcherConfig = {
  url: string;
  headers?: Record<string, string>;
};

export const createGraphQLFetcher = (config: GraphQLFetcherConfig) => {
  return async <T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T | null> => {
    try {
      const res = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
        body: JSON.stringify({ query, variables }),
      });

      const json = await res.json();
      if (!res.ok || json?.errors?.length) {
        return null;
      }

      return json.data as T;
    } catch {
      return null;
    }
  };
};

export type JsonFetcherConfig = {
  headers?: Record<string, string>;
};

export const createJsonFetcher = (config?: JsonFetcherConfig) => {
  return async <T>(url: string): Promise<T | null> => {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...config?.headers,
        },
      });

      if (!res.ok) {
        return null;
      }

      return (await res.json()) as T;
    } catch {
      return null;
    }
  };
};
