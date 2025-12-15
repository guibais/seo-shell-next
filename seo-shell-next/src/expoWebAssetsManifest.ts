import fs from "node:fs";
import path from "node:path";

export type ExpoWebAssetsManifest = {
  cssHrefs: string[];
  jsSrcs: string[];
  faviconHref?: string;
};

export type ExpoWebAssetsManifestBuildInput = {
  distPath: string;
  indexFileName?: string;
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
    ).map((m) => m[1])[0] || "/favicon.ico";

  return {
    cssHrefs: uniqueStrings(cssHrefs),
    jsSrcs: uniqueStrings(jsSrcs),
    faviconHref,
  };
};

export const generateExpoWebAssetsManifestFromBuild = ({
  distPath,
  indexFileName,
}: ExpoWebAssetsManifestBuildInput): ExpoWebAssetsManifest => {
  const resolvedDistPath = path.resolve(distPath);
  const resolvedIndexFileName = (indexFileName || "index.html").trim();
  const indexPath = path.join(resolvedDistPath, resolvedIndexFileName);

  if (!fs.existsSync(resolvedDistPath)) {
    throw new Error(`dist não encontrado em: ${resolvedDistPath}`);
  }

  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html não encontrado em: ${indexPath}`);
  }

  const html = fs.readFileSync(indexPath, "utf8");
  return extractExpoWebAssetsManifestFromHtml(html);
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

export const writeExpoWebAssetsManifestFromBuild = ({
  distPath,
  indexFileName,
  outputDir,
  manifestFileName,
}: ExpoWebAssetsManifestBuildInput & {
  outputDir: string;
  manifestFileName?: string;
}): ExpoWebAssetsManifestWriteResult & {
  manifest: ExpoWebAssetsManifest;
} => {
  const manifest = generateExpoWebAssetsManifestFromBuild({
    distPath,
    indexFileName,
  });

  const { outputPath } = writeExpoWebAssetsManifest({
    outputDir,
    manifestFileName,
    manifest,
  });

  return {
    outputPath,
    manifest,
  };
};
