import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  detectDistDirectory,
  getDistPath,
  getSupportedFrameworks,
  getCommonDistPaths,
} from "./distDetector";

vi.mock("fs");
vi.mock("path", async () => {
  const actual = await vi.importActual<typeof path>("path");
  return {
    ...actual,
    resolve: (...args: string[]) => args.join("/"),
    join: (...args: string[]) => args.join("/"),
    isAbsolute: (p: string) => p.startsWith("/"),
  };
});

const mockFs = vi.mocked(fs);

beforeEach(() => {
  vi.clearAllMocks();
  mockFs.existsSync.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("detectDistDirectory", () => {
  it("returns null when no dist directory found", () => {
    mockFs.existsSync.mockReturnValue(false);

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result).toBeNull();
  });

  it("detects custom dist path", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("custom-dist")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue(
      '<script src="/app.abc123.js"></script>'
    );

    const result = detectDistDirectory({
      projectPath: "/project",
      customDistPath: "custom-dist",
    });

    expect(result).not.toBeNull();
    expect(result?.distPath).toContain("custom-dist");
  });

  it("throws when custom dist path not found", () => {
    mockFs.existsSync.mockReturnValue(false);

    expect(() =>
      detectDistDirectory({
        projectPath: "/project",
        customDistPath: "missing-dist",
      })
    ).toThrow("Custom dist path not found");
  });

  it("throws when no index.html in custom dist path", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("custom-dist") && !pathStr.includes(".html"))
        return true;
      return false;
    });

    expect(() =>
      detectDistDirectory({
        projectPath: "/project",
        customDistPath: "custom-dist",
      })
    ).toThrow("No index.html found");
  });

  it("detects expo framework from package.json", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { expo: "^50.0.0" } });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("expo");
  });

  it("detects vite framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ devDependencies: { vite: "^5.0.0" } });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("vite");
  });

  it("detects hashed assets", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue(
      '<script src="/app.abc12345.js"></script>'
    );

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.hasHashedAssets).toBe(true);
  });

  it("detects no hashed assets", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue('<script src="/app.js"></script>');

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.hasHashedAssets).toBe(false);
  });

  it("warns when expectHashedAssets is true but none found", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("custom-dist")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue('<script src="/app.js"></script>');

    detectDistDirectory({
      projectPath: "/project",
      customDistPath: "custom-dist",
      expectHashedAssets: true,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Expected hashed assets")
    );
    consoleSpy.mockRestore();
  });

  it("warns when expectHashedAssets is false but found", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("custom-dist")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue(
      '<script src="/app.abc12345.js"></script>'
    );

    detectDistDirectory({
      projectPath: "/project",
      customDistPath: "custom-dist",
      expectHashedAssets: false,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Found hashed assets")
    );
    consoleSpy.mockRestore();
  });

  it("falls back to common dist paths", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("build") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue('<script src="/app.js"></script>');

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("unknown");
    expect(result?.distPath).toContain("build");
  });

  it("handles absolute custom dist path", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr === "/absolute/path") return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue('<script src="/app.js"></script>');

    const result = detectDistDirectory({
      customDistPath: "/absolute/path",
    });

    expect(result?.distPath).toBe("/absolute/path");
  });

  it("detects framework from package.json for custom dist", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("custom-dist")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { next: "^14.0.0" } });
      }
      return '<script src="/app.js"></script>';
    });

    const result = detectDistDirectory({
      projectPath: "/project",
      customDistPath: "custom-dist",
    });

    expect(result?.framework).toBe("next");
  });

  it("returns null when no framework deps found in package.json", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({
          dependencies: { "some-random-package": "^1.0.0" },
        });
      }
      return '<script src="/app.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("unknown");
  });

  it("returns unknown framework when package.json parse fails", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return "invalid json";
      }
      return '<script src="/app.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("unknown");
  });
});

describe("getDistPath", () => {
  it("returns dist path when found", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue('<script src="/app.js"></script>');

    const result = getDistPath({ projectPath: "/project" });

    expect(result).toContain("dist");
  });

  it("throws when no dist directory found", () => {
    mockFs.existsSync.mockReturnValue(false);

    expect(() => getDistPath({ projectPath: "/project" })).toThrow(
      "No dist directory found"
    );
  });
});

describe("detectDistDirectory - framework detection with expectHashedAssets", () => {
  it("warns when expectHashedAssets true but none found in framework dist", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { vite: "^5.0.0" } });
      }
      return '<script src="/app.js"></script>';
    });

    detectDistDirectory({
      projectPath: "/project",
      expectHashedAssets: true,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Expected hashed assets")
    );
    consoleSpy.mockRestore();
  });

  it("warns when expectHashedAssets false but found in framework dist", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { vite: "^5.0.0" } });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    detectDistDirectory({
      projectPath: "/project",
      expectHashedAssets: false,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Found hashed assets")
    );
    consoleSpy.mockRestore();
  });

  it("warns when expectHashedAssets true but none found in common dist", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("build") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue('<script src="/app.js"></script>');

    detectDistDirectory({
      projectPath: "/project",
      expectHashedAssets: true,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Expected hashed assets")
    );
    consoleSpy.mockRestore();
  });

  it("warns when expectHashedAssets false but found in common dist", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("build") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockReturnValue(
      '<script src="/app.abc12345.js"></script>'
    );

    detectDistDirectory({
      projectPath: "/project",
      expectHashedAssets: false,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Found hashed assets")
    );
    consoleSpy.mockRestore();
  });

  it("returns null when framework detected but no matching dist path", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { vite: "^5.0.0" } });
      }
      return "";
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result).toBeNull();
  });
});

describe("getSupportedFrameworks", () => {
  it("returns array of framework types", () => {
    const frameworks = getSupportedFrameworks();

    expect(Array.isArray(frameworks)).toBe(true);
    expect(frameworks.length).toBeGreaterThan(0);
    expect(frameworks).toContain("expo");
    expect(frameworks).toContain("vite");
    expect(frameworks).toContain("next");
  });
});

describe("detectDistDirectory - additional frameworks", () => {
  it("detects cra framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("build") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { "react-scripts": "^5.0.0" } });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("cra");
  });

  it("detects nuxt framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes(".output/public")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { nuxt: "^3.0.0" } });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("nuxt");
  });

  it("detects angular framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { "@angular/core": "^17.0.0" } });
      }
      return '<script src="/app.abc1234567890123456.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("angular");
  });

  it("detects vue-cli framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({
          devDependencies: { "@vue/cli-service": "^5.0.0" },
        });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("vue-cli");
  });

  it("detects remix framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("public/build")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({
          dependencies: { "@remix-run/react": "^2.0.0" },
        });
      }
      return '<script src="/app-ABC12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("remix");
  });

  it("detects astro framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { astro: "^4.0.0" } });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("astro");
  });

  it("detects gatsby framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("public") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { gatsby: "^5.0.0" } });
      }
      return '<script src="/app-abc12345678901234567890.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("gatsby");
  });

  it("detects svelte framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("build") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ dependencies: { "@sveltejs/kit": "^2.0.0" } });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("svelte");
  });

  it("detects parcel framework", () => {
    mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) return true;
      if (pathStr.includes("dist") && !pathStr.includes(".")) return true;
      if (pathStr.includes("index.html")) return true;
      return false;
    });
    mockFs.readFileSync.mockImplementation((p: fs.PathOrFileDescriptor) => {
      const pathStr = String(p);
      if (pathStr.includes("package.json")) {
        return JSON.stringify({ devDependencies: { parcel: "^2.0.0" } });
      }
      return '<script src="/app.abc12345.js"></script>';
    });

    const result = detectDistDirectory({ projectPath: "/project" });

    expect(result?.framework).toBe("parcel");
  });
});

describe("getCommonDistPaths", () => {
  it("returns array of common dist paths", () => {
    const paths = getCommonDistPaths();

    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContain("dist");
    expect(paths).toContain("build");
  });
});
