import type { SitemapEntry, SitemapProviderResult } from "./types";

export const createStaticProvider = (
  name: string,
  urls: SitemapEntry[]
): (() => SitemapProviderResult) => {
  return () => ({ name, urls });
};

export const createAsyncProvider = (
  name: string,
  fetcher: () => Promise<SitemapEntry[]>
): (() => Promise<SitemapProviderResult>) => {
  return async () => {
    const urls = await fetcher();
    return { name, urls };
  };
};

export const createPaginatedProvider = (
  name: string,
  options: {
    fetchPage: (
      page: number
    ) => Promise<{ urls: SitemapEntry[]; hasMore: boolean }>;
    startPage?: number;
  }
): (() => Promise<SitemapProviderResult>) => {
  return async () => {
    const allUrls: SitemapEntry[] = [];
    let page = options.startPage ?? 1;
    let hasMore = true;

    while (hasMore) {
      const result = await options.fetchPage(page);
      allUrls.push(...result.urls);
      hasMore = result.hasMore;
      page += 1;
    }

    return { name, urls: allUrls };
  };
};

export const combineUrls = (baseUrl: string, paths: string[]): string[] => {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  return paths.map((p) => {
    const trimmedPath = p.startsWith("/") ? p : `/${p}`;
    return `${trimmedBase}${trimmedPath}`;
  });
};

export const slugify = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};
