import type { GetServerSidePropsContext } from "next";
import { withSeoShell } from "@seo-shell/seo-shell/server";
import { buildBreadcrumbListJsonLd } from "@seo-shell/seo-shell";
import { seoShell } from "../../lib/seoShell";
import { fetchProfessional } from "../../lib/api";

export const getServerSideProps = withSeoShell(
  async (ctx: GetServerSidePropsContext) => {
    const slug = ctx.params?.slug as string;
    const professional = await fetchProfessional(slug);

    if (!professional) {
      return { notFound: true };
    }

    return {
      props: {
        seo: {
          title: `${professional.name} | My App`,
          description: professional.bio,
          canonical: `https://myapp.com/professional/${slug}`,
          ogImage: {
            url: professional.imageUrl,
            alt: professional.name,
          },
          jsonLd: buildBreadcrumbListJsonLd([
            { name: "Home", url: "https://myapp.com" },
            { name: "Professionals", url: "https://myapp.com/professionals" },
            {
              name: professional.name,
              url: `https://myapp.com/professional/${slug}`,
            },
          ]),
        },
      },
    };
  },
  { seoShell }
);

export default function ProfessionalPage() {
  return null;
}
