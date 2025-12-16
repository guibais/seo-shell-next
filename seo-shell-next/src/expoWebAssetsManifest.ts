import fs from "node:fs";
import path from "node:path";
import {
  detectDistDirectory,
  type DistDetectorOptions,
  type DistDetectorResult,
} from "./distDetector";

export type ExpoWebAssetsManifest = {
  cssHrefs: string[];
  jsSrcs: string[];
  faviconHref: string | null;
};

export type WebAssetsManifest = ExpoWebAssetsManifest;

export type ExpoWebAssetsManifestBuildInput = {
  distPath?: string;
  indexFileName?: string;
  projectPath?: string;
  customDistPath?: string;
  expectHashedAssets?: boolean;
};

export type WebAssetsManifestBuildInput = ExpoWebAssetsManifestBuildInput;

export type WebAssetsManifestBuildResult = {
  manifest: WebAssetsManifest;
  detection: DistDetectorResult;
};

export type ExpoWebAssetsManifestWriteInput = {
  outputDir: string;
  manifestFileName?: string;
  manifest: ExpoWebAssetsManifest;
};

export type ExpoWebAssetsManifestWriteResult = {
  outputPath: string;
};

const uniqueStrings = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

export const extractExpoWebAssetsManifestFromHtml = (
  html: string
): ExpoWebAssetsManifest => {
  const cssHrefs = Array.from(
    html.matchAll(
      /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/g
    )
  ).map((m) => m[1]);

  const jsSrcs = Array.from(
    html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>\s*<\/script>/g)
  ).map((m) => m[1]);

  const faviconHref =
    Array.from(
      html.matchAll(
        /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["'][^>]*>/g
      )
    ).map((m) => m[1])[0] ?? null;

  return {
    cssHrefs: uniqueStrings(cssHrefs),
    jsSrcs: uniqueStrings(jsSrcs),
    faviconHref,
  };
};

export const generateExpoWebAssetsManifestFromBuild = (
  input: ExpoWebAssetsManifestBuildInput
): ExpoWebAssetsManifest => {
  const result = generateWebAssetsManifestFromBuild(input);
  return result.manifest;
};

export const generateWebAssetsManifestFromBuild = (
  input: WebAssetsManifestBuildInput
): WebAssetsManifestBuildResult => {
  const detectorOptions: DistDetectorOptions = {
    projectPath: input.projectPath,
    customDistPath: input.customDistPath ?? input.distPath,
    expectHashedAssets: input.expectHashedAssets,
  };

  const detection = detectDistDirectory(detectorOptions);
  if (!detection) {
    throw new Error(
      `Dist directory not found. Searched common paths like dist, build, out, web-build. ` +
        `Use customDistPath option to specify your dist directory.`
    );
  }

  const indexFileName = input.indexFileName ?? "index.html";
  const indexPath = path.join(detection.distPath, indexFileName.trim());

  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found at: ${indexPath}`);
  }

  const html = fs.readFileSync(indexPath, "utf8");
  const manifest = extractExpoWebAssetsManifestFromHtml(html);

  return {
    manifest,
    detection,
  };
};

export const writeExpoWebAssetsManifest = ({
  outputDir,
  manifestFileName,
  manifest,
}: ExpoWebAssetsManifestWriteInput): ExpoWebAssetsManifestWriteResult => {
  const resolvedOutputDir = path.resolve(outputDir);
  const resolvedManifestFileName = (
    manifestFileName || "web-assets.json"
  ).trim();
  const outputPath = path.join(resolvedOutputDir, resolvedManifestFileName);

  fs.writeFileSync(outputPath, JSON.stringify(manifest));

  return {
    outputPath,
  };
};

export type WriteWebAssetsManifestFromBuildInput =
  WebAssetsManifestBuildInput & {
    outputDir?: string;
    manifestFileName?: string;
  };

export type WriteWebAssetsManifestFromBuildResult = {
  outputPath: string;
  manifest: WebAssetsManifest;
  detection: DistDetectorResult;
};

export const writeExpoWebAssetsManifestFromBuild = (
  input: WriteWebAssetsManifestFromBuildInput
): ExpoWebAssetsManifestWriteResult & {
  manifest: ExpoWebAssetsManifest;
} => {
  const result = writeWebAssetsManifestFromBuild(input);
  return {
    outputPath: result.outputPath,
    manifest: result.manifest,
  };
};

export const writeWebAssetsManifestFromBuild = (
  input: WriteWebAssetsManifestFromBuildInput
): WriteWebAssetsManifestFromBuildResult => {
  const { manifest, detection } = generateWebAssetsManifestFromBuild(input);

  const outputDir = input.outputDir ?? detection.distPath;

  const { outputPath } = writeExpoWebAssetsManifest({
    outputDir,
    manifestFileName: input.manifestFileName,
    manifest,
  });

  return {
    outputPath,
    manifest,
    detection,
  };
};
