import type { SeoOgImage } from "./SeoHead";

export const compactKeywords = (values: Array<string | undefined | null>) => {
  const set = new Set<string>();
  values.forEach((value) => {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (!normalized) return;
    set.add(normalized);
  });
  return Array.from(set);
};

export const inferOgImageType = (url: string) => {
  const lower = url.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  return undefined;
};

export type BuildOgImageInput = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  type?: string;
};

export const buildOgImage = (input: BuildOgImageInput): SeoOgImage => {
  const type = input.type ?? inferOgImageType(input.url);
  return {
    url: input.url,
    alt: input.alt,
    width: input.width,
    height: input.height,
    type,
  };
};
