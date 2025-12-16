import { createSeoShellApp } from "@seo-shell/seo-shell/server";

export const seoShellApp = createSeoShellApp({
  cdn: {
    indexUrl: "https://cdn.example.com/app/index.html",
    baseUrl: "https://cdn.example.com/app",
  },
  defaults: {
    defaultNoIndex: false,
    seo: {
      title: "My App",
      description: "Welcome to my app",
      ogSiteName: "My App",
    },
  },
});
