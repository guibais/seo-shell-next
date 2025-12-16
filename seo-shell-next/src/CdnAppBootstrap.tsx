import Head from "next/head";
import Script from "next/script";
import React from "react";

import type { CdnAssets } from "./cdn";
import { SeoHead } from "./seo/SeoHead";
import type { SeoHeadProps } from "./seo/SeoHead";

export type CdnAppBootstrapProps = {
  assets: CdnAssets;
  seo?: SeoHeadProps;
  injectStyles?: boolean;
  children?: React.ReactNode;
};

export const CdnAppBootstrap = ({
  assets,
  seo,
  injectStyles = true,
  children,
}: CdnAppBootstrapProps) => {
  const cssHrefs = assets?.cssHrefs ?? [];
  const jsSrcs = assets?.jsSrcs ?? [];

  return (
    <>
      <Head>
        {assets?.faviconHref ? (
          <link rel="icon" href={assets.faviconHref} />
        ) : null}
        {injectStyles
          ? cssHrefs.map((href: string) => (
              <link key={href} rel="stylesheet" href={href} />
            ))
          : null}
      </Head>

      {seo && <SeoHead {...seo} />}

      <div id="ssr-shell">{children}</div>
      <div id="root" />

      <Script
        id="seo-shell-ready"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{window.dispatchEvent(new CustomEvent('seo-shell:ready',{detail:{ts:Date.now()}}));}catch(e){}})();",
        }}
      />

      <Script
        id="remove-ssr-shell"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var t=0;function r(){t++;var e=document.getElementById('root');var s=document.getElementById('ssr-shell');if(!s)return;if(e&&e.childNodes&&e.childNodes.length>0){try{window.dispatchEvent(new CustomEvent('seo-shell:hydrated',{detail:{ts:Date.now()}}));}catch(e){}s.parentNode&&s.parentNode.removeChild(s);return}if(t<300){requestAnimationFrame(r)}}requestAnimationFrame(r)})();",
        }}
      />

      {jsSrcs.map((src: string) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </>
  );
};
