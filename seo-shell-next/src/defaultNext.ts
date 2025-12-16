import type { GetServerSidePropsContext } from "next";

const getHeaderValue = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
};

export const getBaseUrlFromRequest = (
  ctx: GetServerSidePropsContext
): string => {
  const req = ctx.req;
  const headers = req.headers;

  const forwardedProto = getHeaderValue(headers["x-forwarded-proto"]);
  const proto = forwardedProto?.split(",")[0]?.trim() || "https";

  const forwardedHost = getHeaderValue(headers["x-forwarded-host"]);
  const host =
    forwardedHost?.split(",")[0]?.trim() || getHeaderValue(headers.host);

  if (!host) {
    return "";
  }

  return `${proto}://${host}`;
};

export const getCanonicalUrlFromCtx = (
  ctx: GetServerSidePropsContext
): string => {
  const baseUrl = getBaseUrlFromRequest(ctx).replace(/\/+$/, "");
  const path = ctx.resolvedUrl || "/";
  return `${baseUrl}${path}`;
};
