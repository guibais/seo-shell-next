import type { SitemapGeneratorConfig } from "@seo-shell/seo-shell/server";
import { fetchAllProfessionalUrls, fetchAllCityUrls } from "./api";

export const sitemapConfig: SitemapGeneratorConfig = {
  baseUrl: "https://myapp.com",
  outputDir: "./public/seo",
  defaultPageSize: 30000,
  sitemapGroups: [
    {
      name: "professionals",
      provider: async () => ({
        name: "professionals",
        urls: await fetchAllProfessionalUrls(),
      }),
    },
    {
      name: "cities",
      provider: async () => ({
        name: "cities",
        urls: await fetchAllCityUrls(),
      }),
    },
    {
      name: "static",
      provider: async () => ({
        name: "static",
        urls: [
          "https://myapp.com",
          "https://myapp.com/about",
          "https://myapp.com/contact",
          "https://myapp.com/professionals",
        ],
      }),
    },
  ],
};
