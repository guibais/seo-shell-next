import type { GetServerSidePropsContext } from "next";
import { createEventBridge } from "@seo-shell/seo-shell/server";
import { seoShellApp } from "../../lib/seoShell";
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
    events.queue("ready", { timestamp: Date.now() });

    return {
      props: {
        seo: {
          title: `${professional.name} | My App`,
          description: professional.bio,
        },
        __events: events.pendingEvents,
      },
    };
  }
);

export default function ProfessionalPage() {
  return null;
}
