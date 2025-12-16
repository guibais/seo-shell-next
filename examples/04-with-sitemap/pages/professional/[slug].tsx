import type { GetServerSidePropsContext } from "next";
import { createEventBridge } from "@seo-shell/seo-shell/server";
import { buildBreadcrumbListJsonLd } from "@seo-shell/seo-shell";
import { seoShellApp } from "../../lib/seoShell";
import { sitemapConfig } from "../../lib/sitemapConfig";
import { fetchProfessional } from "../../lib/api";

export const getServerSideProps = seoShellApp.withSeoShell(
  async (ctx: GetServerSidePropsContext) => {
    const slug = ctx.params?.slug as string;
    const professional = await fetchProfessional(slug);

    if (!professional) {
      return { notFound: true };
    }

    const events = createEventBridge();
    events.queue("professional", professional);

    return {
      props: {
        seo: {
          title: `${professional.name} | My App`,
          description: professional.bio,
          canonical: `https://myapp.com/professional/${slug}`,
          jsonLd: buildBreadcrumbListJsonLd([
            { name: "Home", url: "https://myapp.com" },
            { name: "Professionals", url: "https://myapp.com/professionals" },
            {
              name: professional.name,
              url: `https://myapp.com/professional/${slug}`,
            },
          ]),
        },
        __events: events.pendingEvents,
      },
    };
  },
  {
    ensureSitemaps: true,
    sitemapConfig,
  }
);

export default function ProfessionalPage() {
  return null;
}
