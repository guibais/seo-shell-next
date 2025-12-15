"use client";

import React from "react";
import { CdnAppBootstrap } from "./CdnAppBootstrap";
import type { CdnAssets } from "./cdn";

export type CdnAppShellPageProps = {
  assets: CdnAssets;
  noIndex?: boolean;
  children?: React.ReactNode;
};

export const CdnAppShellPage: React.FC<CdnAppShellPageProps> = ({
  assets,
  noIndex = false,
  children,
}) => {
  return (
    <CdnAppBootstrap assets={assets} seo={{ noIndex }}>
      {children}
    </CdnAppBootstrap>
  );
};
