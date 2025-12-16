import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";

import type { SeoHeadProps } from "./seo/SeoHead";
import type { CdnAssets } from "./cdn";
import type { SeoShellConfig } from "./runtime";
import type { EnsureSitemapsConfig } from "./sitemap";

import { getPageAssets } from "./runtime";
import { ensureSitemaps } from "./sitemap";
import { getCanonicalUrlFromCtx } from "./defaultNext";

export type SeoShellInjectedProps = {
  __seoShell: {
    assets: CdnAssets;
    noIndex: boolean;
    defaultSeo: SeoHeadProps;
  };
};

export type SeoShellAppConfig = {
  cdn: {
    indexUrl?: string;
    baseUrl?: string;
    version?: string;
    indexFileName?: string;
  };
  defaults?: {
    defaultNoIndex?: boolean;
    seo?: SeoHeadProps;
  };
};

export type WithSeoShellOptions = {
  ensureSitemaps?: boolean;
  sitemapConfig?: EnsureSitemapsConfig;
  getSitemapConfig?: () => EnsureSitemapsConfig | Promise<EnsureSitemapsConfig>;
};

export type SeoShellApp = {
  config: SeoShellConfig;
  withSeoShell: <P extends Record<string, unknown>>(
    handler: GetServerSideProps<P>,
    options?: WithSeoShellOptions
  ) => GetServerSideProps<P & SeoShellInjectedProps>;
};

export const createSeoShellApp = (
  appConfig: SeoShellAppConfig
): SeoShellApp => {
  const config: SeoShellConfig = {
    cdn: {
      indexUrl: appConfig.cdn.indexUrl,
      baseUrl: appConfig.cdn.baseUrl,
      version: appConfig.cdn.version,
      indexFileName: appConfig.cdn.indexFileName,
    },
    defaults: {
      defaultNoIndex: appConfig.defaults?.defaultNoIndex ?? true,
    },
  };

  const withSeoShell = <P extends Record<string, unknown>>(
    handler: GetServerSideProps<P>,
    options?: WithSeoShellOptions
  ): GetServerSideProps<P & SeoShellInjectedProps> => {
    return async (ctx: GetServerSidePropsContext) => {
      if (options?.ensureSitemaps) {
        const sitemapConfig = options.sitemapConfig
          ? options.sitemapConfig
          : options.getSitemapConfig
          ? await options.getSitemapConfig()
          : null;

        if (sitemapConfig) {
          await ensureSitemaps(sitemapConfig);
        }
      }

      const { assets, noIndex } = await getPageAssets(config);
      const canonicalUrl = getCanonicalUrlFromCtx(ctx);
      const defaultSeo: SeoHeadProps = {
        ...appConfig.defaults?.seo,
        canonicalUrl,
      };

      const result = (await handler(
        ctx as never
      )) as GetServerSidePropsResult<P>;

      if ("redirect" in result) {
        return result as never;
      }

      if ("notFound" in result && result.notFound) {
        return result as never;
      }

      const props = ("props" in result ? result.props : {}) as P;

      return {
        props: {
          ...props,
          __seoShell: {
            assets,
            noIndex,
            defaultSeo,
          },
        },
      };
    };
  };

  return {
    config,
    withSeoShell,
  };
};
