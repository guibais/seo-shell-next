import { describe, it, expect } from "vitest";
import { compactKeywords, inferOgImageType, buildOgImage } from "./seoHelpers";

describe("compactKeywords", () => {
  it("removes duplicates", () => {
    const result = compactKeywords(["foo", "bar", "foo"]);
    expect(result).toEqual(["foo", "bar"]);
  });

  it("removes null and undefined values", () => {
    const result = compactKeywords(["foo", null, "bar", undefined]);
    expect(result).toEqual(["foo", "bar"]);
  });

  it("removes empty strings", () => {
    const result = compactKeywords(["foo", "", "bar", "   "]);
    expect(result).toEqual(["foo", "bar"]);
  });

  it("trims whitespace", () => {
    const result = compactKeywords(["  foo  ", "bar  ", "  baz"]);
    expect(result).toEqual(["foo", "bar", "baz"]);
  });

  it("returns empty array for empty input", () => {
    const result = compactKeywords([]);
    expect(result).toEqual([]);
  });

  it("returns empty array for all invalid values", () => {
    const result = compactKeywords([null, undefined, "", "   "]);
    expect(result).toEqual([]);
  });
});

describe("inferOgImageType", () => {
  it("returns image/jpeg for .jpg", () => {
    expect(inferOgImageType("https://example.com/image.jpg")).toBe(
      "image/jpeg"
    );
  });

  it("returns image/jpeg for .jpeg", () => {
    expect(inferOgImageType("https://example.com/image.jpeg")).toBe(
      "image/jpeg"
    );
  });

  it("returns image/jpeg for uppercase .JPG", () => {
    expect(inferOgImageType("https://example.com/image.JPG")).toBe(
      "image/jpeg"
    );
  });

  it("returns image/webp for .webp", () => {
    expect(inferOgImageType("https://example.com/image.webp")).toBe(
      "image/webp"
    );
  });

  it("returns image/png for .png", () => {
    expect(inferOgImageType("https://example.com/image.png")).toBe("image/png");
  });

  it("returns undefined for unknown extension", () => {
    expect(inferOgImageType("https://example.com/image.gif")).toBeUndefined();
  });

  it("returns undefined for no extension", () => {
    expect(inferOgImageType("https://example.com/image")).toBeUndefined();
  });
});

describe("buildOgImage", () => {
  it("builds og image with minimal input", () => {
    const result = buildOgImage({ url: "https://example.com/image.jpg" });

    expect(result).toEqual({
      url: "https://example.com/image.jpg",
      alt: undefined,
      width: undefined,
      height: undefined,
      type: "image/jpeg",
    });
  });

  it("builds og image with all fields", () => {
    const result = buildOgImage({
      url: "https://example.com/image.png",
      alt: "My image",
      width: 1200,
      height: 630,
      type: "image/png",
    });

    expect(result).toEqual({
      url: "https://example.com/image.png",
      alt: "My image",
      width: 1200,
      height: 630,
      type: "image/png",
    });
  });

  it("infers type when not provided", () => {
    const result = buildOgImage({ url: "https://example.com/image.webp" });
    expect(result.type).toBe("image/webp");
  });

  it("uses provided type over inferred type", () => {
    const result = buildOgImage({
      url: "https://example.com/image.jpg",
      type: "image/custom",
    });
    expect(result.type).toBe("image/custom");
  });

  it("returns undefined type for unknown extension", () => {
    const result = buildOgImage({ url: "https://example.com/image.gif" });
    expect(result.type).toBeUndefined();
  });
});
