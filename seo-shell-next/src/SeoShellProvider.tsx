import React from "react";

import { CdnAppBootstrap } from "./CdnAppBootstrap";
import type { SeoHeadProps } from "./seo/SeoHead";
import type { CdnAssets } from "./cdn";

export type SeoShellProviderProps = {
  assets: CdnAssets;
  noIndex: boolean;
  seo?: SeoHeadProps;
  children: React.ReactNode;
};

export const SeoShellProvider = ({
  assets,
  noIndex,
  seo,
  children,
}: SeoShellProviderProps) => {
  return (
    <CdnAppBootstrap
      assets={assets}
      seo={{
        noIndex,
        ...seo,
      }}
    >
      {children}
    </CdnAppBootstrap>
  );
};
