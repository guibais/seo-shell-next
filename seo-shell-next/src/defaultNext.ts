import type { GetServerSidePropsContext } from "next";

import type { SeoHeadProps } from "./seo/SeoHead";

const getHeaderValue = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
};

const getBaseUrlFromRequest = (ctx: GetServerSidePropsContext): string => {
  const req = ctx.req;
  const headers = req.headers;

  const forwardedProto = getHeaderValue(headers["x-forwarded-proto"]);
  const proto = forwardedProto?.split(",")[0]?.trim() || "https";

  const forwardedHost = getHeaderValue(headers["x-forwarded-host"]);
  const host =
    forwardedHost?.split(",")[0]?.trim() || getHeaderValue(headers.host);

  if (!host) {
    const envBaseUrl =
      process.env.SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "";

    return envBaseUrl.replace(/\/+$/, "");
  }

  return `${proto}://${host}`;
};

export const getCanonicalUrlFromCtx = (ctx: GetServerSidePropsContext) => {
  const baseUrl = getBaseUrlFromRequest(ctx).replace(/\/+$/, "");
  const path = ctx.resolvedUrl || "/";
  return `${baseUrl}${path}`;
};

export const getDefaultSeoFromEnv = (
  ctx: GetServerSidePropsContext
): SeoHeadProps => {
  const canonicalUrl = getCanonicalUrlFromCtx(ctx);

  const title = process.env.SEO_SHELL_DEFAULT_TITLE?.trim() || "";
  const description = process.env.SEO_SHELL_DEFAULT_DESCRIPTION?.trim() || "";

  return {
    title: title || undefined,
    description: description || undefined,
    canonicalUrl,
  };
};
