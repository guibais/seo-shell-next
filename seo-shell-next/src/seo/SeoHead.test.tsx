import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { SeoHead } from "./SeoHead";

vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("SeoHead", () => {
  it("renders nothing when no props provided", () => {
    const { container } = render(<SeoHead />);
    expect(container.querySelector("title")).toBeNull();
  });

  it("renders title", () => {
    const { container } = render(<SeoHead title="Test Title" />);
    expect(container.querySelector("title")?.textContent).toBe("Test Title");
  });

  it("renders description meta tag", () => {
    const { container } = render(<SeoHead description="Test description" />);
    const meta = container.querySelector('meta[name="description"]');
    expect(meta?.getAttribute("content")).toBe("Test description");
  });

  it("renders keywords meta tag", () => {
    const { container } = render(<SeoHead keywords={["foo", "bar", "baz"]} />);
    const meta = container.querySelector('meta[name="keywords"]');
    expect(meta?.getAttribute("content")).toBe("foo, bar, baz");
  });

  it("filters empty keywords", () => {
    const { container } = render(<SeoHead keywords={["foo", "", "bar"]} />);
    const meta = container.querySelector('meta[name="keywords"]');
    expect(meta?.getAttribute("content")).toBe("foo, bar");
  });

  it("renders noindex meta tag", () => {
    const { container } = render(<SeoHead noIndex />);
    const meta = container.querySelector('meta[name="robots"]');
    expect(meta?.getAttribute("content")).toBe("noindex,nofollow");
  });

  it("renders og:title", () => {
    const { container } = render(<SeoHead title="OG Title" />);
    const meta = container.querySelector('meta[property="og:title"]');
    expect(meta?.getAttribute("content")).toBe("OG Title");
  });

  it("renders og:description", () => {
    const { container } = render(<SeoHead description="OG Description" />);
    const meta = container.querySelector('meta[property="og:description"]');
    expect(meta?.getAttribute("content")).toBe("OG Description");
  });

  it("renders og:type with default website", () => {
    const { container } = render(<SeoHead />);
    const meta = container.querySelector('meta[property="og:type"]');
    expect(meta?.getAttribute("content")).toBe("website");
  });

  it("renders og:type with custom value", () => {
    const { container } = render(<SeoHead ogType="article" />);
    const meta = container.querySelector('meta[property="og:type"]');
    expect(meta?.getAttribute("content")).toBe("article");
  });

  it("renders og:url", () => {
    const { container } = render(
      <SeoHead canonicalUrl="https://example.com" />
    );
    const meta = container.querySelector('meta[property="og:url"]');
    expect(meta?.getAttribute("content")).toBe("https://example.com");
  });

  it("renders og:site_name", () => {
    const { container } = render(<SeoHead ogSiteName="My Site" />);
    const meta = container.querySelector('meta[property="og:site_name"]');
    expect(meta?.getAttribute("content")).toBe("My Site");
  });

  it("renders og:locale", () => {
    const { container } = render(<SeoHead ogLocale="en_US" />);
    const meta = container.querySelector('meta[property="og:locale"]');
    expect(meta?.getAttribute("content")).toBe("en_US");
  });

  it("renders og:image", () => {
    const { container } = render(
      <SeoHead ogImage={{ url: "https://example.com/image.jpg" }} />
    );
    const meta = container.querySelector('meta[property="og:image"]');
    expect(meta?.getAttribute("content")).toBe("https://example.com/image.jpg");
  });

  it("renders og:image:alt", () => {
    const { container } = render(
      <SeoHead
        ogImage={{ url: "https://example.com/image.jpg", alt: "Alt text" }}
      />
    );
    const meta = container.querySelector('meta[property="og:image:alt"]');
    expect(meta?.getAttribute("content")).toBe("Alt text");
  });

  it("renders og:image:width", () => {
    const { container } = render(
      <SeoHead
        ogImage={{ url: "https://example.com/image.jpg", width: 1200 }}
      />
    );
    const meta = container.querySelector('meta[property="og:image:width"]');
    expect(meta?.getAttribute("content")).toBe("1200");
  });

  it("renders og:image:height", () => {
    const { container } = render(
      <SeoHead
        ogImage={{ url: "https://example.com/image.jpg", height: 630 }}
      />
    );
    const meta = container.querySelector('meta[property="og:image:height"]');
    expect(meta?.getAttribute("content")).toBe("630");
  });

  it("renders og:image:type", () => {
    const { container } = render(
      <SeoHead
        ogImage={{ url: "https://example.com/image.jpg", type: "image/jpeg" }}
      />
    );
    const meta = container.querySelector('meta[property="og:image:type"]');
    expect(meta?.getAttribute("content")).toBe("image/jpeg");
  });

  it("renders twitter:card", () => {
    const { container } = render(<SeoHead />);
    const meta = container.querySelector('meta[name="twitter:card"]');
    expect(meta?.getAttribute("content")).toBe("summary_large_image");
  });

  it("renders twitter:title", () => {
    const { container } = render(<SeoHead title="Twitter Title" />);
    const meta = container.querySelector('meta[name="twitter:title"]');
    expect(meta?.getAttribute("content")).toBe("Twitter Title");
  });

  it("renders twitter:description", () => {
    const { container } = render(<SeoHead description="Twitter Desc" />);
    const meta = container.querySelector('meta[name="twitter:description"]');
    expect(meta?.getAttribute("content")).toBe("Twitter Desc");
  });

  it("renders twitter:site", () => {
    const { container } = render(<SeoHead twitterSite="@mysite" />);
    const meta = container.querySelector('meta[name="twitter:site"]');
    expect(meta?.getAttribute("content")).toBe("@mysite");
  });

  it("renders twitter:creator", () => {
    const { container } = render(<SeoHead twitterCreator="@creator" />);
    const meta = container.querySelector('meta[name="twitter:creator"]');
    expect(meta?.getAttribute("content")).toBe("@creator");
  });

  it("renders twitter:image", () => {
    const { container } = render(
      <SeoHead ogImage={{ url: "https://example.com/image.jpg" }} />
    );
    const meta = container.querySelector('meta[name="twitter:image"]');
    expect(meta?.getAttribute("content")).toBe("https://example.com/image.jpg");
  });

  it("renders twitter:image:alt", () => {
    const { container } = render(
      <SeoHead
        ogImage={{ url: "https://example.com/image.jpg", alt: "Alt text" }}
      />
    );
    const meta = container.querySelector('meta[name="twitter:image:alt"]');
    expect(meta?.getAttribute("content")).toBe("Alt text");
  });

  it("renders canonical link", () => {
    const { container } = render(
      <SeoHead canonicalUrl="https://example.com/page" />
    );
    const link = container.querySelector('link[rel="canonical"]');
    expect(link?.getAttribute("href")).toBe("https://example.com/page");
  });

  it("renders jsonLd script", () => {
    const jsonLd = {
      "@context": "https://schema.org" as const,
      "@type": "BreadcrumbList" as const,
      itemListElement: [],
    };
    const { container } = render(<SeoHead jsonLd={jsonLd} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script?.innerHTML).toBe(JSON.stringify(jsonLd));
  });

  it("does not render keywords when empty array", () => {
    const { container } = render(<SeoHead keywords={[]} />);
    const meta = container.querySelector('meta[name="keywords"]');
    expect(meta).toBeNull();
  });

  it("does not render keywords when null", () => {
    const { container } = render(<SeoHead keywords={null} />);
    const meta = container.querySelector('meta[name="keywords"]');
    expect(meta).toBeNull();
  });
});
