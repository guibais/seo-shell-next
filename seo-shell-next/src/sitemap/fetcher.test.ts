import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGraphQLFetcher, createJsonFetcher } from "./fetcher";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("createGraphQLFetcher", () => {
  it("makes POST request with query and variables", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { users: [] } }),
    });

    const fetcher = createGraphQLFetcher({
      url: "https://api.example.com/graphql",
    });
    await fetcher("query { users { id } }", { limit: 10 });

    expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "query { users { id } }",
        variables: { limit: 10 },
      }),
    });
  });

  it("includes custom headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const fetcher = createGraphQLFetcher({
      url: "https://api.example.com/graphql",
      headers: { Authorization: "Bearer token" },
    });
    await fetcher("query { test }");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/graphql",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
      })
    );
  });

  it("returns data on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { users: [{ id: 1 }] } }),
    });

    const fetcher = createGraphQLFetcher({
      url: "https://api.example.com/graphql",
    });
    const result = await fetcher<{ users: { id: number }[] }>(
      "query { users { id } }"
    );

    expect(result).toEqual({ users: [{ id: 1 }] });
  });

  it("returns null on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const fetcher = createGraphQLFetcher({
      url: "https://api.example.com/graphql",
    });
    const result = await fetcher("query { test }");

    expect(result).toBeNull();
  });

  it("returns null on GraphQL errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: "Error" }] }),
    });

    const fetcher = createGraphQLFetcher({
      url: "https://api.example.com/graphql",
    });
    const result = await fetcher("query { test }");

    expect(result).toBeNull();
  });

  it("returns null on fetch exception", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const fetcher = createGraphQLFetcher({
      url: "https://api.example.com/graphql",
    });
    const result = await fetcher("query { test }");

    expect(result).toBeNull();
  });

  it("works without variables", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { test: true } }),
    });

    const fetcher = createGraphQLFetcher({
      url: "https://api.example.com/graphql",
    });
    await fetcher("query { test }");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/graphql",
      expect.objectContaining({
        body: JSON.stringify({ query: "query { test }", variables: undefined }),
      })
    );
  });
});

describe("createJsonFetcher", () => {
  it("makes GET request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    const fetcher = createJsonFetcher();
    await fetcher("https://api.example.com/data.json");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/data.json",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  it("includes custom headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const fetcher = createJsonFetcher({ headers: { "X-Custom": "value" } });
    await fetcher("https://api.example.com/data.json");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/data.json",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          "X-Custom": "value",
        },
      })
    );
  });

  it("returns data on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [1, 2, 3] }),
    });

    const fetcher = createJsonFetcher();
    const result = await fetcher<{ items: number[] }>(
      "https://api.example.com/data.json"
    );

    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it("returns null on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const fetcher = createJsonFetcher();
    const result = await fetcher("https://api.example.com/data.json");

    expect(result).toBeNull();
  });

  it("returns null on fetch exception", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const fetcher = createJsonFetcher();
    const result = await fetcher("https://api.example.com/data.json");

    expect(result).toBeNull();
  });

  it("works without config", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const fetcher = createJsonFetcher();
    await fetcher("https://api.example.com/data.json");

    expect(mockFetch).toHaveBeenCalled();
  });
});
