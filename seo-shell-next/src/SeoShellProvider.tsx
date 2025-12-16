import React from "react";

import { CdnAppBootstrap } from "./CdnAppBootstrap";
import type { SeoHeadProps } from "./seo/SeoHead";
import type { CdnAssets } from "./cdn";

export type SeoShellProviderProps = {
  assets: CdnAssets;
  noIndex: boolean;
  seo?: SeoHeadProps;
  injectStyles?: boolean;
  children: React.ReactNode;
};

export const SeoShellProvider = ({
  assets,
  noIndex,
  seo,
  injectStyles = true,
  children,
}: SeoShellProviderProps) => {
  return (
    <CdnAppBootstrap
      assets={assets}
      seo={{
        noIndex,
        ...seo,
      }}
      injectStyles={injectStyles}
    >
      {children}
    </CdnAppBootstrap>
  );
};
