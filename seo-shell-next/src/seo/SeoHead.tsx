import Head from "next/head";
import React from "react";

import type { JsonLd } from "./jsonLd";
import { toJsonLdScriptProps } from "./jsonLd";

export type SeoOgImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  type?: string;
};

export type SeoHeadProps = {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  ogType?: string | null;
  ogSiteName?: string | null;
  ogLocale?: string | null;
  ogImage?: SeoOgImage | null;
  twitterSite?: string | null;
  twitterCreator?: string | null;
  keywords?: string[] | null;
  jsonLd?: JsonLd | JsonLd[] | null;
  noIndex?: boolean | null;
};

export const SeoHead = ({
  title,
  description,
  canonicalUrl,
  ogType,
  ogSiteName,
  ogLocale,
  ogImage,
  twitterSite,
  twitterCreator,
  keywords,
  jsonLd,
  noIndex,
}: SeoHeadProps) => {
  const keywordsContent = keywords?.filter(Boolean).join(", ");

  return (
    <Head>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {keywordsContent ? (
        <meta name="keywords" content={keywordsContent} />
      ) : null}
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}

      {title ? <meta property="og:title" content={title} /> : null}
      {description ? (
        <meta property="og:description" content={description} />
      ) : null}
      <meta property="og:type" content={ogType ?? "website"} />
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      {ogSiteName ? (
        <meta property="og:site_name" content={ogSiteName} />
      ) : null}
      {ogLocale ? <meta property="og:locale" content={ogLocale} /> : null}

      {ogImage ? <meta property="og:image" content={ogImage.url} /> : null}
      {ogImage?.alt ? (
        <meta property="og:image:alt" content={ogImage.alt} />
      ) : null}
      {ogImage?.width ? (
        <meta property="og:image:width" content={String(ogImage.width)} />
      ) : null}
      {ogImage?.height ? (
        <meta property="og:image:height" content={String(ogImage.height)} />
      ) : null}
      {ogImage?.type ? (
        <meta property="og:image:type" content={ogImage.type} />
      ) : null}

      <meta name="twitter:card" content="summary_large_image" />
      {title ? <meta name="twitter:title" content={title} /> : null}
      {description ? (
        <meta name="twitter:description" content={description} />
      ) : null}
      {twitterSite ? <meta name="twitter:site" content={twitterSite} /> : null}
      {twitterCreator ? (
        <meta name="twitter:creator" content={twitterCreator} />
      ) : null}
      {ogImage ? <meta name="twitter:image" content={ogImage.url} /> : null}
      {ogImage?.alt ? (
        <meta name="twitter:image:alt" content={ogImage.alt} />
      ) : null}

      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

      {jsonLd ? <script {...toJsonLdScriptProps(jsonLd)} /> : null}
    </Head>
  );
};
