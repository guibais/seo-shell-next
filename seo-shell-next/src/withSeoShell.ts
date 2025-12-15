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

export type SeoShellInjectedProps = {
  __seoShell: {
    assets: CdnAssets;
    noIndex: boolean;
    defaultSeo: SeoHeadProps;
  };
};

export type WithSeoShellOptions = {
  ensureSitemaps?: boolean;
  sitemapConfig?: EnsureSitemapsConfig;
  getSitemapConfig?: () => EnsureSitemapsConfig | Promise<EnsureSitemapsConfig>;
};

export type WithSeoShellParams = {
  seoShellConfig: SeoShellConfig;
  getDefaultSeo: (ctx: GetServerSidePropsContext) => SeoHeadProps;
  options?: WithSeoShellOptions;
};

export const withSeoShell = <P extends Record<string, unknown>>(
  handler: GetServerSideProps<P>,
  params: WithSeoShellParams
): GetServerSideProps<P & SeoShellInjectedProps> => {
  return async (ctx: GetServerSidePropsContext) => {
    if (params.options?.ensureSitemaps) {
      const sitemapConfig = params.options.sitemapConfig
        ? params.options.sitemapConfig
        : params.options.getSitemapConfig
          ? await params.options.getSitemapConfig()
          : null;

      if (sitemapConfig) {
        await ensureSitemaps(sitemapConfig);
      }
    }

    const { assets, noIndex } = await getPageAssets(params.seoShellConfig);
    const defaultSeo = params.getDefaultSeo(ctx);

    const result = (await handler(ctx as never)) as GetServerSidePropsResult<P>;

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
