import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { CdnAppBootstrap } from "./CdnAppBootstrap";

vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/script", () => ({
  default: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    id?: string;
    src?: string;
  }) => <script {...props}>{children}</script>,
}));

vi.mock("./seo/SeoHead", () => ({
  SeoHead: ({ title }: { title?: string }) => (
    <div data-testid="seo-head" data-title={title} />
  ),
}));

describe("CdnAppBootstrap", () => {
  const defaultAssets = {
    cssHrefs: ["/styles.css"],
    jsSrcs: ["/app.js"],
    faviconHref: "/favicon.ico",
  };

  it("renders favicon link", () => {
    const { container } = render(<CdnAppBootstrap assets={defaultAssets} />);
    const link = container.querySelector('link[rel="icon"]');
    expect(link?.getAttribute("href")).toBe("/favicon.ico");
  });

  it("renders css links when injectStyles is true", () => {
    const { container } = render(
      <CdnAppBootstrap assets={defaultAssets} injectStyles />
    );
    const link = container.querySelector('link[rel="stylesheet"]');
    expect(link?.getAttribute("href")).toBe("/styles.css");
  });

  it("does not render css links when injectStyles is false", () => {
    const { container } = render(
      <CdnAppBootstrap assets={defaultAssets} injectStyles={false} />
    );
    const link = container.querySelector('link[rel="stylesheet"]');
    expect(link).toBeNull();
  });

  it("renders SeoHead when seo prop provided", () => {
    const { container } = render(
      <CdnAppBootstrap assets={defaultAssets} seo={{ title: "Test Title" }} />
    );
    const seoHead = container.querySelector('[data-testid="seo-head"]');
    expect(seoHead).not.toBeNull();
  });

  it("does not render SeoHead when seo prop not provided", () => {
    const { container } = render(<CdnAppBootstrap assets={defaultAssets} />);
    const seoHead = container.querySelector('[data-testid="seo-head"]');
    expect(seoHead).toBeNull();
  });

  it("renders ssr-shell div", () => {
    const { container } = render(<CdnAppBootstrap assets={defaultAssets} />);
    const ssrShell = container.querySelector("#ssr-shell");
    expect(ssrShell).not.toBeNull();
  });

  it("renders root div", () => {
    const { container } = render(<CdnAppBootstrap assets={defaultAssets} />);
    const root = container.querySelector("#root");
    expect(root).not.toBeNull();
  });

  it("renders children inside ssr-shell", () => {
    const { container } = render(
      <CdnAppBootstrap assets={defaultAssets}>
        <div data-testid="child">Child Content</div>
      </CdnAppBootstrap>
    );
    const ssrShell = container.querySelector("#ssr-shell");
    const child = ssrShell?.querySelector('[data-testid="child"]');
    expect(child).not.toBeNull();
  });

  it("renders seo-shell-ready script", () => {
    const { container } = render(<CdnAppBootstrap assets={defaultAssets} />);
    const script = container.querySelector("#seo-shell-ready");
    expect(script).not.toBeNull();
  });

  it("renders remove-ssr-shell script", () => {
    const { container } = render(<CdnAppBootstrap assets={defaultAssets} />);
    const script = container.querySelector("#remove-ssr-shell");
    expect(script).not.toBeNull();
  });

  it("renders js scripts", () => {
    const { container } = render(<CdnAppBootstrap assets={defaultAssets} />);
    const script = container.querySelector('script[src="/app.js"]');
    expect(script).not.toBeNull();
  });

  it("handles empty assets", () => {
    const emptyAssets = {
      cssHrefs: [],
      jsSrcs: [],
      faviconHref: null,
    };
    const { container } = render(<CdnAppBootstrap assets={emptyAssets} />);
    expect(container.querySelector("#ssr-shell")).not.toBeNull();
    expect(container.querySelector("#root")).not.toBeNull();
  });

  it("handles undefined assets properties", () => {
    const partialAssets = {} as {
      cssHrefs: string[];
      jsSrcs: string[];
      faviconHref: string | null;
    };
    const { container } = render(<CdnAppBootstrap assets={partialAssets} />);
    expect(container.querySelector("#ssr-shell")).not.toBeNull();
  });

  it("renders multiple css links", () => {
    const assets = {
      cssHrefs: ["/styles1.css", "/styles2.css"],
      jsSrcs: [],
      faviconHref: null,
    };
    const { container } = render(
      <CdnAppBootstrap assets={assets} injectStyles />
    );
    const links = container.querySelectorAll('link[rel="stylesheet"]');
    expect(links.length).toBe(2);
  });

  it("renders multiple js scripts", () => {
    const assets = {
      cssHrefs: [],
      jsSrcs: ["/app1.js", "/app2.js"],
      faviconHref: null,
    };
    const { container } = render(<CdnAppBootstrap assets={assets} />);
    const scripts = container.querySelectorAll("script[src]");
    expect(scripts.length).toBe(2);
  });
});
