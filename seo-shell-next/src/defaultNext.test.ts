import { describe, it, expect } from "vitest";
import { getBaseUrlFromRequest, getCanonicalUrlFromCtx } from "./defaultNext";
import type { GetServerSidePropsContext } from "next";

const createMockContext = (
  headers: Record<string, string | string[] | undefined>,
  resolvedUrl = "/"
): GetServerSidePropsContext => ({
  req: {
    headers,
  } as GetServerSidePropsContext["req"],
  res: {} as GetServerSidePropsContext["res"],
  query: {},
  resolvedUrl,
});

describe("getBaseUrlFromRequest", () => {
  it("returns base url from host header", () => {
    const ctx = createMockContext({ host: "example.com" });
    const result = getBaseUrlFromRequest(ctx);
    expect(result).toBe("https://example.com");
  });

  it("uses x-forwarded-proto for protocol", () => {
    const ctx = createMockContext({
      host: "example.com",
      "x-forwarded-proto": "http",
    });
    const result = getBaseUrlFromRequest(ctx);
    expect(result).toBe("http://example.com");
  });

  it("uses x-forwarded-host for host", () => {
    const ctx = createMockContext({
      host: "internal.example.com",
      "x-forwarded-host": "public.example.com",
    });
    const result = getBaseUrlFromRequest(ctx);
    expect(result).toBe("https://public.example.com");
  });

  it("handles comma-separated x-forwarded-proto", () => {
    const ctx = createMockContext({
      host: "example.com",
      "x-forwarded-proto": "https, http",
    });
    const result = getBaseUrlFromRequest(ctx);
    expect(result).toBe("https://example.com");
  });

  it("handles comma-separated x-forwarded-host", () => {
    const ctx = createMockContext({
      host: "internal.example.com",
      "x-forwarded-host": "public.example.com, proxy.example.com",
    });
    const result = getBaseUrlFromRequest(ctx);
    expect(result).toBe("https://public.example.com");
  });

  it("handles array headers", () => {
    const ctx = createMockContext({
      host: ["example.com", "other.com"],
      "x-forwarded-proto": ["https", "http"],
    });
    const result = getBaseUrlFromRequest(ctx);
    expect(result).toBe("https://example.com");
  });

  it("returns empty string when no host", () => {
    const ctx = createMockContext({});
    const result = getBaseUrlFromRequest(ctx);
    expect(result).toBe("");
  });

  it("trims whitespace from forwarded headers", () => {
    const ctx = createMockContext({
      host: "example.com",
      "x-forwarded-proto": "  https  , http",
      "x-forwarded-host": "  public.example.com  , proxy",
    });
    const result = getBaseUrlFromRequest(ctx);
    expect(result).toBe("https://public.example.com");
  });
});

describe("getCanonicalUrlFromCtx", () => {
  it("returns full canonical url", () => {
    const ctx = createMockContext({ host: "example.com" }, "/page");
    const result = getCanonicalUrlFromCtx(ctx);
    expect(result).toBe("https://example.com/page");
  });

  it("uses resolvedUrl from context", () => {
    const ctx = createMockContext({ host: "example.com" }, "/products/123");
    const result = getCanonicalUrlFromCtx(ctx);
    expect(result).toBe("https://example.com/products/123");
  });

  it("defaults to root path", () => {
    const ctx = createMockContext({ host: "example.com" });
    ctx.resolvedUrl = "";
    const result = getCanonicalUrlFromCtx(ctx);
    expect(result).toBe("https://example.com/");
  });

  it("trims trailing slashes from base url", () => {
    const ctx = createMockContext({ host: "example.com/" }, "/page");
    const result = getCanonicalUrlFromCtx(ctx);
    expect(result).toBe("https://example.com/page");
  });
});
