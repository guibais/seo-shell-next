import React, { useEffect } from "react";
import Script from "next/script";

import { CdnAppBootstrap } from "./CdnAppBootstrap";
import type { SeoHeadProps } from "./seo/SeoHead";
import type { CdnAssets } from "./cdn";
import { sendEvent } from "./events";

export type SeoShellEvent = {
  name: string;
  payload: unknown;
};

export type SeoShellProviderProps = {
  assets: CdnAssets;
  noIndex: boolean;
  seo?: SeoHeadProps;
  events?: SeoShellEvent[];
  injectStyles?: boolean;
  children: React.ReactNode;
};

const buildEventsScript = (events: SeoShellEvent[]): string => {
  const assignments = events
    .map(
      (e) =>
        `window.__SEO_SHELL_EVENTS__[${JSON.stringify(
          e.name
        )}] = ${JSON.stringify(e.payload)};`
    )
    .join(" ");
  return `window.__SEO_SHELL_EVENTS__ = window.__SEO_SHELL_EVENTS__ || {}; ${assignments}`;
};

export const SeoShellProvider = ({
  assets,
  noIndex,
  seo,
  events,
  injectStyles = true,
  children,
}: SeoShellProviderProps) => {
  useEffect(() => {
    if (!events || events.length === 0) return;

    const win = window as unknown as {
      __SEO_SHELL_EVENTS__?: Record<string, unknown>;
    };
    win.__SEO_SHELL_EVENTS__ = win.__SEO_SHELL_EVENTS__ || {};
    events.forEach((e) => {
      win.__SEO_SHELL_EVENTS__![e.name] = e.payload;
      sendEvent(e.name, e.payload);
    });
  }, [events]);

  const eventsScript =
    events && events.length > 0 ? buildEventsScript(events) : null;

  return (
    <CdnAppBootstrap
      assets={assets}
      seo={{
        noIndex,
        ...seo,
      }}
      injectStyles={injectStyles}
    >
      {eventsScript && (
        <Script id="seo-shell-events" strategy="beforeInteractive">
          {eventsScript}
        </Script>
      )}
      {children}
    </CdnAppBootstrap>
  );
};
