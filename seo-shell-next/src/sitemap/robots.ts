import type { RobotsConfig, RobotsRule } from "./types";

const buildRuleBlock = (rule: RobotsRule) => {
  const lines: string[] = [`User-agent: ${rule.userAgent}`];

  if (rule.allow) {
    rule.allow.forEach((path) => lines.push(`Allow: ${path}`));
  }
  if (rule.disallow) {
    rule.disallow.forEach((path) => lines.push(`Disallow: ${path}`));
  }

  return lines.join("\n");
};

export const buildRobotsTxt = (config: RobotsConfig) => {
  const parts: string[] = [];

  if (config.rules && config.rules.length > 0) {
    parts.push(config.rules.map(buildRuleBlock).join("\n\n"));
  } else {
    parts.push("User-agent: *\nAllow: /");
  }

  if (config.sitemapUrl) {
    parts.push(`Sitemap: ${config.sitemapUrl}`);
  }

  if (config.additionalSitemaps) {
    config.additionalSitemaps.forEach((url) => {
      parts.push(`Sitemap: ${url}`);
    });
  }

  if (config.custom) {
    parts.push(config.custom);
  }

  return parts.join("\n\n") + "\n";
};
