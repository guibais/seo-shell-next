export type NextRewriteRule = {
  source: string;
  destination: string;
};

export type NextHeader = {
  key: string;
  value: string;
};

export type NextHeaderRule = {
  source: string;
  headers: NextHeader[];
};

type NextRewritesOutput =
  | NextRewriteRule[]
  | {
      beforeFiles?: NextRewriteRule[];
      afterFiles?: NextRewriteRule[];
      fallback?: NextRewriteRule[];
    };

type NextHeadersOutput = NextHeaderRule[];

export type NextConfigLike = {
  rewrites?: () => Promise<NextRewritesOutput> | NextRewritesOutput;
  headers?: () => Promise<NextHeadersOutput> | NextHeadersOutput;
} & Record<string, unknown>;

export type SeoShellNextSitemapPluginOptions = {
  publicSitemapSubdir?: string;
  sitemapIndexPath?: string;
  sitemapIndexRoute?: string;
  sitemapsRouteBasePath?: string;
  groups?: string[];
  includeRobotsHeaders?: boolean;
  includeSitemapHeaders?: boolean;
};

const normalizePath = (value: string): string => {
  if (!value.startsWith("/")) return `/${value}`;
  return value;
};

const toArrayRewrites = (rewrites: NextRewritesOutput): NextRewriteRule[] => {
  if (Array.isArray(rewrites)) return rewrites;
  return [
    ...(rewrites.beforeFiles ?? []),
    ...(rewrites.afterFiles ?? []),
    ...(rewrites.fallback ?? []),
  ];
};

const mergeRewritesOutput = (
  previous: NextRewritesOutput,
  additional: NextRewriteRule[]
): NextRewritesOutput => {
  if (Array.isArray(previous)) return [...additional, ...previous];

  return {
    beforeFiles: [...additional, ...(previous.beforeFiles ?? [])],
    afterFiles: previous.afterFiles,
    fallback: previous.fallback,
  };
};

const buildSitemapRewrites = (
  options: Required<
    Pick<
      SeoShellNextSitemapPluginOptions,
      | "publicSitemapSubdir"
      | "sitemapIndexPath"
      | "sitemapIndexRoute"
      | "sitemapsRouteBasePath"
      | "groups"
    >
  >
): NextRewriteRule[] => {
  const base = normalizePath(options.sitemapsRouteBasePath).replace(/\/+$/, "");
  const seo = normalizePath(options.publicSitemapSubdir).replace(/\/+$/, "");

  const groupRewrites = options.groups.map((group) => ({
    source: `${base}/${group}/:page.xml`,
    destination: `${seo}/${group}-:page.xml`,
  }));

  const indexRoute = normalizePath(options.sitemapIndexRoute);
  const indexDestination = normalizePath(options.sitemapIndexPath);

  const indexRewrite =
    indexRoute !== indexDestination
      ? ([
          {
            source: indexRoute,
            destination: indexDestination,
          },
        ] satisfies NextRewriteRule[])
      : ([] satisfies NextRewriteRule[]);

  return [...indexRewrite, ...groupRewrites];
};

const buildSitemapHeaders = (
  options: Required<
    Pick<
      SeoShellNextSitemapPluginOptions,
      "publicSitemapSubdir" | "sitemapIndexPath" | "sitemapIndexRoute"
    >
  >
): NextHeaderRule[] => {
  const seo = normalizePath(options.publicSitemapSubdir).replace(/\/+$/, "");
  const indexRoute = normalizePath(options.sitemapIndexRoute);

  const sitemapHeaders: NextHeader[] = [
    { key: "Content-Type", value: "application/xml" },
    { key: "Cache-Control", value: "public, max-age=0, s-maxage=3600" },
  ];

  return [
    {
      source: indexRoute,
      headers: sitemapHeaders,
    },
    {
      source: `${seo}/:path*.xml`,
      headers: sitemapHeaders,
    },
  ];
};

const buildRobotsHeaders = (): NextHeaderRule[] => {
  return [
    {
      source: "/robots.txt",
      headers: [
        { key: "Content-Type", value: "text/plain" },
        { key: "Cache-Control", value: "public, max-age=0, s-maxage=3600" },
      ],
    },
  ];
};

export const withSeoShellSitemap = (
  nextConfig: NextConfigLike,
  options?: SeoShellNextSitemapPluginOptions
): NextConfigLike => {
  const resolved: Required<SeoShellNextSitemapPluginOptions> = {
    publicSitemapSubdir: options?.publicSitemapSubdir ?? "/seo",
    sitemapIndexPath: options?.sitemapIndexPath ?? "sitemap.xml",
    sitemapIndexRoute: options?.sitemapIndexRoute ?? "/sitemap.xml",
    sitemapsRouteBasePath: options?.sitemapsRouteBasePath ?? "/sitemaps",
    groups: options?.groups ?? [],
    includeRobotsHeaders: options?.includeRobotsHeaders ?? true,
    includeSitemapHeaders: options?.includeSitemapHeaders ?? true,
  };

  const additionalRewrites = buildSitemapRewrites({
    publicSitemapSubdir: resolved.publicSitemapSubdir,
    sitemapIndexPath: resolved.sitemapIndexPath,
    sitemapIndexRoute: resolved.sitemapIndexRoute,
    sitemapsRouteBasePath: resolved.sitemapsRouteBasePath,
    groups: resolved.groups,
  });

  const sitemapHeaders = resolved.includeSitemapHeaders
    ? buildSitemapHeaders({
        publicSitemapSubdir: resolved.publicSitemapSubdir,
        sitemapIndexPath: resolved.sitemapIndexPath,
        sitemapIndexRoute: resolved.sitemapIndexRoute,
      })
    : [];

  const robotsHeaders = resolved.includeRobotsHeaders
    ? buildRobotsHeaders()
    : [];

  return {
    ...nextConfig,
    rewrites: async () => {
      const current = nextConfig.rewrites ? await nextConfig.rewrites() : [];
      return mergeRewritesOutput(current, additionalRewrites);
    },
    headers: async () => {
      const current = nextConfig.headers ? await nextConfig.headers() : [];
      return [...sitemapHeaders, ...robotsHeaders, ...current];
    },
  };
};
