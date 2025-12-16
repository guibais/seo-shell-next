import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  extractExpoWebAssetsManifestFromHtml,
  generateExpoWebAssetsManifestFromBuild,
  generateWebAssetsManifestFromBuild,
  writeExpoWebAssetsManifest,
  writeExpoWebAssetsManifestFromBuild,
  writeWebAssetsManifestFromBuild,
} from "./expoWebAssetsManifest";

vi.mock("fs");
vi.mock("path", async () => {
  const actual = await vi.importActual<typeof path>("path");
  return {
    ...actual,
    resolve: (...args: string[]) => args.join("/"),
    join: (...args: string[]) => args.join("/"),
  };
});
vi.mock("./distDetector", () => ({
  detectDistDirectory: vi.fn(),
}));

const mockFs = vi.mocked(fs);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("extractExpoWebAssetsManifestFromHtml", () => {
  it("extracts css hrefs", () => {
    const html = `
      <link rel="stylesheet" href="/styles.css">
      <link rel="stylesheet" href="/other.css">
    `;

    const result = extractExpoWebAssetsManifestFromHtml(html);

    expect(result.cssHrefs).toEqual(["/styles.css", "/other.css"]);
  });

  it("extracts js srcs", () => {
    const html = `
      <script src="/app.js"></script>
      <script src="/vendor.js"></script>
    `;

    const result = extractExpoWebAssetsManifestFromHtml(html);

    expect(result.jsSrcs).toEqual(["/app.js", "/vendor.js"]);
  });

  it("extracts favicon href", () => {
    const html = `<link rel="icon" href="/favicon.ico">`;

    const result = extractExpoWebAssetsManifestFromHtml(html);

    expect(result.faviconHref).toBe("/favicon.ico");
  });

  it("returns null favicon when not found", () => {
    const html = `<html><body></body></html>`;

    const result = extractExpoWebAssetsManifestFromHtml(html);

    expect(result.faviconHref).toBeNull();
  });

  it("removes duplicate css hrefs", () => {
    const html = `
      <link rel="stylesheet" href="/styles.css">
      <link rel="stylesheet" href="/styles.css">
    `;

    const result = extractExpoWebAssetsManifestFromHtml(html);

    expect(result.cssHrefs).toEqual(["/styles.css"]);
  });

  it("removes duplicate js srcs", () => {
    const html = `
      <script src="/app.js"></script>
      <script src="/app.js"></script>
    `;

    const result = extractExpoWebAssetsManifestFromHtml(html);

    expect(result.jsSrcs).toEqual(["/app.js"]);
  });

  it("handles empty html", () => {
    const result = extractExpoWebAssetsManifestFromHtml("");

    expect(result.cssHrefs).toEqual([]);
    expect(result.jsSrcs).toEqual([]);
    expect(result.faviconHref).toBeNull();
  });
});

describe("generateWebAssetsManifestFromBuild", () => {
  it("generates manifest from build", async () => {
    const { detectDistDirectory } = await import("./distDetector");
    vi.mocked(detectDistDirectory).mockReturnValue({
      distPath: "/project/dist",
      framework: "vite",
      indexPath: "/project/dist/index.html",
      hasHashedAssets: true,
    });
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(`
      <link rel="stylesheet" href="/styles.css">
      <script src="/app.js"></script>
      <link rel="icon" href="/favicon.ico">
    `);

    const result = generateWebAssetsManifestFromBuild({});

    expect(result.manifest.cssHrefs).toEqual(["/styles.css"]);
    expect(result.manifest.jsSrcs).toEqual(["/app.js"]);
    expect(result.manifest.faviconHref).toBe("/favicon.ico");
    expect(result.detection.framework).toBe("vite");
  });

  it("throws when dist directory not found", async () => {
    const { detectDistDirectory } = await import("./distDetector");
    vi.mocked(detectDistDirectory).mockReturnValue(null);

    expect(() => generateWebAssetsManifestFromBuild({})).toThrow(
      "Dist directory not found"
    );
  });

  it("throws when index.html not found", async () => {
    const { detectDistDirectory } = await import("./distDetector");
    vi.mocked(detectDistDirectory).mockReturnValue({
      distPath: "/project/dist",
      framework: "vite",
      indexPath: "/project/dist/index.html",
      hasHashedAssets: true,
    });
    mockFs.existsSync.mockReturnValue(false);

    expect(() => generateWebAssetsManifestFromBuild({})).toThrow(
      "index.html not found"
    );
  });

  it("uses custom index filename", async () => {
    const { detectDistDirectory } = await import("./distDetector");
    vi.mocked(detectDistDirectory).mockReturnValue({
      distPath: "/project/dist",
      framework: "vite",
      indexPath: "/project/dist/index.html",
      hasHashedAssets: true,
    });
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("<html></html>");

    generateWebAssetsManifestFromBuild({ indexFileName: "app.html" });

    expect(mockFs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("app.html"),
      "utf8"
    );
  });
});

describe("generateExpoWebAssetsManifestFromBuild", () => {
  it("returns just the manifest", async () => {
    const { detectDistDirectory } = await import("./distDetector");
    vi.mocked(detectDistDirectory).mockReturnValue({
      distPath: "/project/dist",
      framework: "expo",
      indexPath: "/project/dist/index.html",
      hasHashedAssets: true,
    });
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("<html></html>");

    const result = generateExpoWebAssetsManifestFromBuild({});

    expect(result).toHaveProperty("cssHrefs");
    expect(result).toHaveProperty("jsSrcs");
    expect(result).toHaveProperty("faviconHref");
    expect(result).not.toHaveProperty("detection");
  });
});

describe("writeExpoWebAssetsManifest", () => {
  it("writes manifest to file", () => {
    mockFs.writeFileSync.mockReturnValue(undefined);

    const result = writeExpoWebAssetsManifest({
      outputDir: "/output",
      manifest: {
        cssHrefs: ["/styles.css"],
        jsSrcs: ["/app.js"],
        faviconHref: "/favicon.ico",
      },
    });

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("web-assets.json"),
      expect.any(String)
    );
    expect(result.outputPath).toContain("web-assets.json");
  });

  it("uses custom manifest filename", () => {
    mockFs.writeFileSync.mockReturnValue(undefined);

    const result = writeExpoWebAssetsManifest({
      outputDir: "/output",
      manifestFileName: "custom.json",
      manifest: {
        cssHrefs: [],
        jsSrcs: [],
        faviconHref: null,
      },
    });

    expect(result.outputPath).toContain("custom.json");
  });
});

describe("writeWebAssetsManifestFromBuild", () => {
  it("generates and writes manifest", async () => {
    const { detectDistDirectory } = await import("./distDetector");
    vi.mocked(detectDistDirectory).mockReturnValue({
      distPath: "/project/dist",
      framework: "vite",
      indexPath: "/project/dist/index.html",
      hasHashedAssets: true,
    });
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("<html></html>");
    mockFs.writeFileSync.mockReturnValue(undefined);

    const result = writeWebAssetsManifestFromBuild({});

    expect(result.outputPath).toContain("web-assets.json");
    expect(result.manifest).toBeDefined();
    expect(result.detection).toBeDefined();
  });

  it("uses custom output dir", async () => {
    const { detectDistDirectory } = await import("./distDetector");
    vi.mocked(detectDistDirectory).mockReturnValue({
      distPath: "/project/dist",
      framework: "vite",
      indexPath: "/project/dist/index.html",
      hasHashedAssets: true,
    });
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("<html></html>");
    mockFs.writeFileSync.mockReturnValue(undefined);

    const result = writeWebAssetsManifestFromBuild({
      outputDir: "/custom-output",
    });

    expect(result.outputPath).toContain("custom-output");
  });
});

describe("writeExpoWebAssetsManifestFromBuild", () => {
  it("returns outputPath and manifest", async () => {
    const { detectDistDirectory } = await import("./distDetector");
    vi.mocked(detectDistDirectory).mockReturnValue({
      distPath: "/project/dist",
      framework: "expo",
      indexPath: "/project/dist/index.html",
      hasHashedAssets: true,
    });
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("<html></html>");
    mockFs.writeFileSync.mockReturnValue(undefined);

    const result = writeExpoWebAssetsManifestFromBuild({});

    expect(result.outputPath).toBeDefined();
    expect(result.manifest).toBeDefined();
    expect(result).not.toHaveProperty("detection");
  });
});
