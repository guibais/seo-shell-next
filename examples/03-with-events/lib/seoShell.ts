import { createSeoShell } from "@seo-shell/seo-shell/server";

export const seoShell = createSeoShell({
  cdn: {
    indexUrl: "https://cdn.example.com/app/index.html",
  },
});
