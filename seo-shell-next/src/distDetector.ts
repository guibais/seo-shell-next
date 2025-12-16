import fs from "node:fs";
import path from "node:path";

export type FrameworkType =
  | "expo"
  | "vite"
  | "cra"
  | "next"
  | "nuxt"
  | "angular"
  | "vue-cli"
  | "parcel"
  | "webpack"
  | "rollup"
  | "esbuild"
  | "remix"
  | "astro"
  | "gatsby"
  | "svelte"
  | "unknown";

export type DistDetectorResult = {
  distPath: string;
  framework: FrameworkType;
  indexPath: string;
  hasHashedAssets: boolean;
};

export type DistDetectorOptions = {
  projectPath?: string;
  customDistPath?: string;
  expectHashedAssets?: boolean;
};

type FrameworkDistConfig = {
  framework: FrameworkType;
  distPaths: string[];
  indexFiles: string[];
  hashPattern: RegExp;
};

const FRAMEWORK_CONFIGS: FrameworkDistConfig[] = [
  {
    framework: "expo",
    distPaths: ["dist", "web-build"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8,32}\.(js|css)$/i,
  },
  {
    framework: "vite",
    distPaths: ["dist", "build"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "cra",
    distPaths: ["build"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "next",
    distPaths: [".next", "out"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8,16}\.(js|css)$/i,
  },
  {
    framework: "nuxt",
    distPaths: [".output/public", "dist", ".nuxt"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "angular",
    distPaths: ["dist", "dist/browser"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{16,20}\.(js|css)$/i,
  },
  {
    framework: "vue-cli",
    distPaths: ["dist"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "parcel",
    distPaths: ["dist", "build"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "remix",
    distPaths: ["public/build", "build/client"],
    indexFiles: ["index.html"],
    hashPattern: /\-[A-Z0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "astro",
    distPaths: ["dist"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "gatsby",
    distPaths: ["public"],
    indexFiles: ["index.html"],
    hashPattern: /\-[a-f0-9]{20}\.(js|css)$/i,
  },
  {
    framework: "svelte",
    distPaths: ["build", "dist", "public/build"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "webpack",
    distPaths: ["dist", "build", "public"],
    indexFiles: ["index.html"],
    hashPattern: /\.[a-f0-9]{8,20}\.(js|css)$/i,
  },
  {
    framework: "rollup",
    distPaths: ["dist", "build"],
    indexFiles: ["index.html"],
    hashPattern: /\-[a-f0-9]{8}\.(js|css)$/i,
  },
  {
    framework: "esbuild",
    distPaths: ["dist", "out", "build"],
    indexFiles: ["index.html"],
    hashPattern: /\-[A-Z0-9]{8}\.(js|css)$/i,
  },
];

const COMMON_DIST_PATHS = [
  "dist",
  "build",
  "out",
  "public",
  "web-build",
  ".next",
  ".output/public",
  "dist/browser",
  "public/build",
  "build/client",
];

const COMMON_INDEX_FILES = ["index.html", "200.html", "404.html"];

const detectHashedAssets = (html: string, hashPattern: RegExp): boolean => {
  const scriptSrcs = Array.from(
    html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)
  ).map((m) => m[1]);

  const linkHrefs = Array.from(
    html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi)
  ).map((m) => m[1]);

  const allAssets = [...scriptSrcs, ...linkHrefs];
  return allAssets.some((asset) => hashPattern.test(asset));
};

const detectHashedAssetsGeneric = (html: string): boolean => {
  const genericHashPattern = /[\.\-_][a-f0-9]{6,32}\.(js|css)$/i;
  return detectHashedAssets(html, genericHashPattern);
};

const findIndexFile = (
  distPath: string,
  indexFiles: string[]
): string | null => {
  for (const indexFile of indexFiles) {
    const indexPath = path.join(distPath, indexFile);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  return null;
};

const detectFrameworkFromPackageJson = (
  projectPath: string
): FrameworkType | null => {
  const packageJsonPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const frameworkDetectors: Record<string, FrameworkType> = {
      expo: "expo",
      "@expo/webpack-config": "expo",
      vite: "vite",
      "react-scripts": "cra",
      next: "next",
      nuxt: "nuxt",
      "@angular/core": "angular",
      "@vue/cli-service": "vue-cli",
      parcel: "parcel",
      "@remix-run/react": "remix",
      astro: "astro",
      gatsby: "gatsby",
      svelte: "svelte",
      "@sveltejs/kit": "svelte",
    };

    for (const [dep, framework] of Object.entries(frameworkDetectors)) {
      if (deps[dep]) {
        return framework;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const detectDistDirectory = (
  options: DistDetectorOptions = {}
): DistDetectorResult | null => {
  const projectPath = options.projectPath
    ? path.resolve(options.projectPath)
    : process.cwd();

  if (options.customDistPath) {
    const customPath = path.isAbsolute(options.customDistPath)
      ? options.customDistPath
      : path.join(projectPath, options.customDistPath);

    if (!fs.existsSync(customPath)) {
      throw new Error(`Custom dist path not found: ${customPath}`);
    }

    const indexPath = findIndexFile(customPath, COMMON_INDEX_FILES);
    if (!indexPath) {
      throw new Error(`No index.html found in custom dist path: ${customPath}`);
    }

    const html = fs.readFileSync(indexPath, "utf8");
    const hasHashedAssets = detectHashedAssetsGeneric(html);

    if (options.expectHashedAssets !== undefined) {
      if (options.expectHashedAssets && !hasHashedAssets) {
        console.warn(
          `Warning: Expected hashed assets but none found in ${customPath}`
        );
      }
      if (!options.expectHashedAssets && hasHashedAssets) {
        console.warn(
          `Warning: Found hashed assets but expectHashedAssets is false in ${customPath}`
        );
      }
    }

    return {
      distPath: customPath,
      framework: detectFrameworkFromPackageJson(projectPath) ?? "unknown",
      indexPath,
      hasHashedAssets,
    };
  }

  const detectedFramework = detectFrameworkFromPackageJson(projectPath);

  if (detectedFramework) {
    const config = FRAMEWORK_CONFIGS.find(
      (c) => c.framework === detectedFramework
    );
    if (config) {
      for (const distDir of config.distPaths) {
        const distPath = path.join(projectPath, distDir);
        if (fs.existsSync(distPath)) {
          const indexPath = findIndexFile(distPath, config.indexFiles);
          if (indexPath) {
            const html = fs.readFileSync(indexPath, "utf8");
            const hasHashedAssets = detectHashedAssets(
              html,
              config.hashPattern
            );

            if (options.expectHashedAssets !== undefined) {
              if (options.expectHashedAssets && !hasHashedAssets) {
                console.warn(
                  `Warning: Expected hashed assets but none found in ${distPath}`
                );
              }
              if (!options.expectHashedAssets && hasHashedAssets) {
                console.warn(
                  `Warning: Found hashed assets but expectHashedAssets is false in ${distPath}`
                );
              }
            }

            return {
              distPath,
              framework: detectedFramework,
              indexPath,
              hasHashedAssets,
            };
          }
        }
      }
    }
  }

  for (const distDir of COMMON_DIST_PATHS) {
    const distPath = path.join(projectPath, distDir);
    if (fs.existsSync(distPath)) {
      const indexPath = findIndexFile(distPath, COMMON_INDEX_FILES);
      if (indexPath) {
        const html = fs.readFileSync(indexPath, "utf8");
        const hasHashedAssets = detectHashedAssetsGeneric(html);

        if (options.expectHashedAssets !== undefined) {
          if (options.expectHashedAssets && !hasHashedAssets) {
            console.warn(
              `Warning: Expected hashed assets but none found in ${distPath}`
            );
          }
          if (!options.expectHashedAssets && hasHashedAssets) {
            console.warn(
              `Warning: Found hashed assets but expectHashedAssets is false in ${distPath}`
            );
          }
        }

        return {
          distPath,
          framework: "unknown",
          indexPath,
          hasHashedAssets,
        };
      }
    }
  }

  return null;
};

export const getDistPath = (options: DistDetectorOptions = {}): string => {
  const result = detectDistDirectory(options);
  if (!result) {
    const projectPath = options.projectPath ?? process.cwd();
    throw new Error(
      `No dist directory found in ${projectPath}. ` +
        `Searched: ${COMMON_DIST_PATHS.join(", ")}. ` +
        `Use customDistPath option to specify a custom path.`
    );
  }
  return result.distPath;
};

export const getSupportedFrameworks = (): FrameworkType[] => {
  return FRAMEWORK_CONFIGS.map((c) => c.framework);
};

export const getCommonDistPaths = (): string[] => {
  return [...COMMON_DIST_PATHS];
};
