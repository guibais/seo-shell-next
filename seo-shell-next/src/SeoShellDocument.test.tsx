import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { SeoShellDocument, createSeoShellDocument } from "./SeoShellDocument";

vi.mock("next/document", () => ({
  Html: ({ children, lang }: { children: React.ReactNode; lang?: string }) => (
    <html lang={lang}>{children}</html>
  ),
  Head: ({ children }: { children: React.ReactNode }) => (
    <head>{children}</head>
  ),
  Main: () => <main data-testid="main" />,
  NextScript: () => <script data-testid="next-script" />,
}));

describe("SeoShellDocument", () => {
  it("renders html with default lang", () => {
    const { container } = render(<SeoShellDocument />);
    const html = container.querySelector("html");
    expect(html?.getAttribute("lang")).toBe("en");
  });

  it("renders html with custom lang", () => {
    const { container } = render(<SeoShellDocument lang="pt-BR" />);
    const html = container.querySelector("html");
    expect(html?.getAttribute("lang")).toBe("pt-BR");
  });

  it("renders favicon link when provided", () => {
    const { container } = render(
      <SeoShellDocument faviconHref="/favicon.ico" />
    );
    const link = container.querySelector('link[rel="icon"]');
    expect(link?.getAttribute("href")).toBe("/favicon.ico");
  });

  it("does not render favicon link when not provided", () => {
    const { container } = render(<SeoShellDocument />);
    const link = container.querySelector('link[rel="icon"]');
    expect(link).toBeNull();
  });

  it("renders css links", () => {
    const { container } = render(
      <SeoShellDocument cssHrefs={["/styles1.css", "/styles2.css"]} />
    );
    const links = container.querySelectorAll('link[rel="stylesheet"]');
    expect(links.length).toBe(2);
  });

  it("renders expo-reset style", () => {
    const { container } = render(<SeoShellDocument />);
    const style = container.querySelector("#expo-reset");
    expect(style).not.toBeNull();
  });

  it("renders ssr-shell-hide style", () => {
    const { container } = render(<SeoShellDocument />);
    const style = container.querySelector("#ssr-shell-hide");
    expect(style).not.toBeNull();
  });

  it("renders Main component", () => {
    const { container } = render(<SeoShellDocument />);
    const main = container.querySelector('[data-testid="main"]');
    expect(main).not.toBeNull();
  });

  it("renders NextScript component", () => {
    const { container } = render(<SeoShellDocument />);
    const script = container.querySelector('[data-testid="next-script"]');
    expect(script).not.toBeNull();
  });

  it("renders children in head", () => {
    const { container } = render(
      <SeoShellDocument>
        <meta name="custom" content="value" />
      </SeoShellDocument>
    );
    const meta = container.querySelector('meta[name="custom"]');
    expect(meta?.getAttribute("content")).toBe("value");
  });
});

describe("createSeoShellDocument", () => {
  it("creates a document component with props", () => {
    const Document = createSeoShellDocument({
      lang: "es",
      cssHrefs: ["/styles.css"],
      faviconHref: "/favicon.ico",
    });

    const { container } = render(<Document />);

    expect(container.querySelector("html")?.getAttribute("lang")).toBe("es");
    expect(container.querySelector('link[rel="stylesheet"]')).not.toBeNull();
    expect(container.querySelector('link[rel="icon"]')).not.toBeNull();
  });

  it("creates a document component with default props", () => {
    const Document = createSeoShellDocument({});

    const { container } = render(<Document />);

    expect(container.querySelector("html")?.getAttribute("lang")).toBe("en");
  });
});
