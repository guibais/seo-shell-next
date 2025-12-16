import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { CdnAppShellPage } from "./CdnAppShellPage";

vi.mock("./CdnAppBootstrap", () => ({
  CdnAppBootstrap: ({
    assets,
    seo,
    children,
  }: {
    assets: { cssHrefs: string[] };
    seo?: { noIndex?: boolean };
    children?: React.ReactNode;
  }) => (
    <div
      data-testid="cdn-app-bootstrap"
      data-noindex={seo?.noIndex}
      data-css-count={assets?.cssHrefs?.length ?? 0}
    >
      {children}
    </div>
  ),
}));

describe("CdnAppShellPage", () => {
  const defaultAssets = {
    cssHrefs: ["/styles.css"],
    jsSrcs: ["/app.js"],
    faviconHref: "/favicon.ico",
  };

  it("renders CdnAppBootstrap with assets", () => {
    const { container } = render(<CdnAppShellPage assets={defaultAssets} />);
    const bootstrap = container.querySelector(
      '[data-testid="cdn-app-bootstrap"]'
    );
    expect(bootstrap).not.toBeNull();
    expect(bootstrap?.getAttribute("data-css-count")).toBe("1");
  });

  it("passes noIndex false by default", () => {
    const { container } = render(<CdnAppShellPage assets={defaultAssets} />);
    const bootstrap = container.querySelector(
      '[data-testid="cdn-app-bootstrap"]'
    );
    expect(bootstrap?.getAttribute("data-noindex")).toBe("false");
  });

  it("passes noIndex true when specified", () => {
    const { container } = render(
      <CdnAppShellPage assets={defaultAssets} noIndex />
    );
    const bootstrap = container.querySelector(
      '[data-testid="cdn-app-bootstrap"]'
    );
    expect(bootstrap?.getAttribute("data-noindex")).toBe("true");
  });

  it("renders children", () => {
    const { container } = render(
      <CdnAppShellPage assets={defaultAssets}>
        <div data-testid="child">Child Content</div>
      </CdnAppShellPage>
    );
    const child = container.querySelector('[data-testid="child"]');
    expect(child).not.toBeNull();
  });
});
