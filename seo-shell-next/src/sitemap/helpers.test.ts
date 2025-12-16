import { describe, it, expect } from "vitest";
import {
  createStaticProvider,
  createAsyncProvider,
  createPaginatedProvider,
  combineUrls,
  slugify,
} from "./helpers";

describe("createStaticProvider", () => {
  it("creates a provider that returns static urls", () => {
    const provider = createStaticProvider("test", [
      "https://example.com/1",
      "https://example.com/2",
    ]);

    const result = provider();

    expect(result).toEqual({
      name: "test",
      urls: ["https://example.com/1", "https://example.com/2"],
    });
  });

  it("creates a provider with empty urls", () => {
    const provider = createStaticProvider("empty", []);
    const result = provider();

    expect(result).toEqual({ name: "empty", urls: [] });
  });
});

describe("createAsyncProvider", () => {
  it("creates an async provider that fetches urls", async () => {
    const fetcher = async () => ["https://example.com/async"];
    const provider = createAsyncProvider("async-test", fetcher);

    const result = await provider();

    expect(result).toEqual({
      name: "async-test",
      urls: ["https://example.com/async"],
    });
  });
});

describe("createPaginatedProvider", () => {
  it("creates a paginated provider that fetches all pages", async () => {
    const pages = [
      { urls: ["url1", "url2"], hasMore: true },
      { urls: ["url3", "url4"], hasMore: true },
      { urls: ["url5"], hasMore: false },
    ];
    let pageIndex = 0;

    const provider = createPaginatedProvider("paginated", {
      fetchPage: async () => pages[pageIndex++],
    });

    const result = await provider();

    expect(result.name).toBe("paginated");
    expect(result.urls).toEqual(["url1", "url2", "url3", "url4", "url5"]);
  });

  it("respects startPage option", async () => {
    const fetchedPages: number[] = [];

    const provider = createPaginatedProvider("paginated", {
      startPage: 5,
      fetchPage: async (page) => {
        fetchedPages.push(page);
        return { urls: [], hasMore: false };
      },
    });

    await provider();

    expect(fetchedPages[0]).toBe(5);
  });

  it("stops when hasMore is false", async () => {
    let callCount = 0;

    const provider = createPaginatedProvider("paginated", {
      fetchPage: async () => {
        callCount++;
        return { urls: ["url"], hasMore: false };
      },
    });

    await provider();

    expect(callCount).toBe(1);
  });
});

describe("combineUrls", () => {
  it("combines base url with paths", () => {
    const result = combineUrls("https://example.com", ["/page1", "/page2"]);

    expect(result).toEqual([
      "https://example.com/page1",
      "https://example.com/page2",
    ]);
  });

  it("handles paths without leading slash", () => {
    const result = combineUrls("https://example.com", ["page1", "page2"]);

    expect(result).toEqual([
      "https://example.com/page1",
      "https://example.com/page2",
    ]);
  });

  it("trims trailing slash from base url", () => {
    const result = combineUrls("https://example.com/", ["/page"]);

    expect(result).toEqual(["https://example.com/page"]);
  });

  it("returns empty array for empty paths", () => {
    const result = combineUrls("https://example.com", []);

    expect(result).toEqual([]);
  });
});

describe("slugify", () => {
  it("converts text to lowercase", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("hello@world!")).toBe("hello-world");
  });

  it("removes accents", () => {
    expect(slugify("café résumé")).toBe("cafe-resume");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles string with only special characters", () => {
    expect(slugify("@#$%")).toBe("");
  });

  it("preserves numbers", () => {
    expect(slugify("hello123world")).toBe("hello123world");
  });
});
