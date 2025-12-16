import { Head, Html, Main, NextScript } from "next/document";
import React from "react";

export type SeoShellDocumentProps = {
  lang?: string;
  cssHrefs?: string[];
  faviconHref?: string;
  children?: React.ReactNode;
};

const defaultStyles = {
  expoReset:
    "html,body{height:100%;}body{overflow:hidden;}#__next{height:100%;display:flex;flex:1;}#root{display:flex;height:100%;flex:1;}",
  ssrShellHide:
    "#ssr-shell{position:absolute!important;left:-10000px!important;top:auto!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;}",
};

export function SeoShellDocument({
  lang = "en",
  cssHrefs = [],
  faviconHref,
  children,
}: SeoShellDocumentProps) {
  return (
    <Html lang={lang}>
      <Head>
        {faviconHref ? <link rel="icon" href={faviconHref} /> : null}
        {cssHrefs.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <style
          id="expo-reset"
          dangerouslySetInnerHTML={{ __html: defaultStyles.expoReset }}
        />
        <style
          id="ssr-shell-hide"
          dangerouslySetInnerHTML={{ __html: defaultStyles.ssrShellHide }}
        />
        {children}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

export function createSeoShellDocument(
  props: Omit<SeoShellDocumentProps, "children">
) {
  return function Document() {
    return <SeoShellDocument {...props} />;
  };
}
