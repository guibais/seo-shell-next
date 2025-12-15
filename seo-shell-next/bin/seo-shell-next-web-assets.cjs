#!/usr/bin/env node

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const getArgValue = (flag) => {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
};

const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));

const normalizeWebPath = (filePath) => {
  const posixPath = filePath.split(path.sep).join("/");
  return posixPath.startsWith("/") ? posixPath : `/${posixPath}`;
};

const extractFromHtml = (html) => {
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
    cssHrefs: unique(cssHrefs),
    jsSrcs: unique(jsSrcs),
    faviconHref,
  };
};

const listFilesRecursive = (dirPath) => {
  const result = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      result.push(...listFilesRecursive(absPath));
      continue;
    }
    result.push(absPath);
  }

  return result;
};

const inferAssetsFromDirectory = (distPath) => {
  const files = listFilesRecursive(distPath);
  const cssFiles = files.filter((p) => p.endsWith(".css"));
  const jsFiles = files.filter((p) => p.endsWith(".js"));

  const cssHrefs = cssFiles.map((abs) => {
    const rel = path.relative(distPath, abs);
    return normalizeWebPath(rel);
  });

  const jsSrcs = jsFiles.map((abs) => {
    const rel = path.relative(distPath, abs);
    return normalizeWebPath(rel);
  });

  const faviconCandidates = [
    path.join(distPath, "favicon.ico"),
    path.join(distPath, "favicon.png"),
    path.join(distPath, "favicon.jpg"),
    path.join(distPath, "favicon.svg"),
  ];

  const faviconAbs = faviconCandidates.find((p) => fs.existsSync(p));

  return {
    cssHrefs: unique(cssHrefs),
    jsSrcs: unique(jsSrcs),
    faviconHref: faviconAbs
      ? normalizeWebPath(path.basename(faviconAbs))
      : undefined,
  };
};

const resolveDistPath = (explicitDist) => {
  if (explicitDist) {
    return path.resolve(explicitDist);
  }

  const candidates = ["dist", "build", "out"];
  for (const c of candidates) {
    const abs = path.resolve(c);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      return abs;
    }
  }

  return path.resolve("dist");
};

const runBuild = async (buildCommand) => {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(buildCommand, {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });

    child.on("error", reject);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`build failed with exit code ${code}`));
    });
  });
};

const main = async () => {
  const build = getArgValue("--build");
  if (!build) {
    throw new Error("missing --build \"<command>\"");
  }

  const distPath = resolveDistPath(getArgValue("--dist"));
  const indexFileName = (getArgValue("--index") || "index.html").trim();
  const outputDir = path.resolve(getArgValue("--out") || distPath);
  const manifestFileName = (getArgValue("--manifest") || "web-assets.json").trim();

  await runBuild(build);

  if (!fs.existsSync(distPath)) {
    throw new Error(`dist não encontrado em: ${distPath}`);
  }

  const indexPath = path.join(distPath, indexFileName);

  const manifest = fs.existsSync(indexPath)
    ? extractFromHtml(fs.readFileSync(indexPath, "utf8"))
    : inferAssetsFromDirectory(distPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, manifestFileName);
  fs.writeFileSync(outputPath, JSON.stringify(manifest));
  process.stdout.write(`${outputPath}\n`);
};

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "seo-shell-next-web-assets failed"}\n`
  );
  process.exit(1);
});
