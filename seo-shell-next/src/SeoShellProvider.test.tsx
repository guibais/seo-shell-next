import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { SeoShellProvider } from "./SeoShellProvider";

vi.mock("./CdnAppBootstrap", () => ({
  CdnAppBootstrap: ({
    assets,
    seo,
    injectStyles,
    children,
  }: {
    assets: { cssHrefs: string[] };
    seo?: { noIndex?: boolean; title?: string };
    injectStyles?: boolean;
    children?: React.ReactNode;
  }) => (
    <div
      data-testid="cdn-app-bootstrap"
      data-noindex={seo?.noIndex}
      data-title={seo?.title}
      data-inject-styles={injectStyles}
      data-css-count={assets?.cssHrefs?.length ?? 0}
    >
      {children}
    </div>
  ),
}));

describe("SeoShellProvider", () => {
  const defaultAssets = {
    cssHrefs: ["/styles.css"],
    jsSrcs: ["/app.js"],
    faviconHref: "/favicon.ico",
  };

  it("renders CdnAppBootstrap with assets", () => {
    const { container } = render(
      <SeoShellProvider assets={defaultAssets} noIndex={false}>
        <div>Content</div>
      </SeoShellProvider>
    );
    const bootstrap = container.querySelector(
      '[data-testid="cdn-app-bootstrap"]'
    );
    expect(bootstrap).not.toBeNull();
  });

  it("passes noIndex to seo prop", () => {
    const { container } = render(
      <SeoShellProvider assets={defaultAssets} noIndex>
        <div>Content</div>
      </SeoShellProvider>
    );
    const bootstrap = container.querySelector(
      '[data-testid="cdn-app-bootstrap"]'
    );
    expect(bootstrap?.getAttribute("data-noindex")).toBe("true");
  });

  it("merges seo props with noIndex", () => {
    const { container } = render(
      <SeoShellProvider
        assets={defaultAssets}
        noIndex
        seo={{ title: "Test Title" }}
      >
        <div>Content</div>
      </SeoShellProvider>
    );
    const bootstrap = container.querySelector(
      '[data-testid="cdn-app-bootstrap"]'
    );
    expect(bootstrap?.getAttribute("data-noindex")).toBe("true");
    expect(bootstrap?.getAttribute("data-title")).toBe("Test Title");
  });

  it("defaults injectStyles to true", () => {
    const { container } = render(
      <SeoShellProvider assets={defaultAssets} noIndex={false}>
        <div>Content</div>
      </SeoShellProvider>
    );
    const bootstrap = container.querySelector(
      '[data-testid="cdn-app-bootstrap"]'
    );
    expect(bootstrap?.getAttribute("data-inject-styles")).toBe("true");
  });

  it("respects injectStyles false", () => {
    const { container } = render(
      <SeoShellProvider
        assets={defaultAssets}
        noIndex={false}
        injectStyles={false}
      >
        <div>Content</div>
      </SeoShellProvider>
    );
    const bootstrap = container.querySelector(
      '[data-testid="cdn-app-bootstrap"]'
    );
    expect(bootstrap?.getAttribute("data-inject-styles")).toBe("false");
  });

  it("renders children", () => {
    const { container } = render(
      <SeoShellProvider assets={defaultAssets} noIndex={false}>
        <div data-testid="child">Child Content</div>
      </SeoShellProvider>
    );
    const child = container.querySelector('[data-testid="child"]');
    expect(child).not.toBeNull();
  });
});
