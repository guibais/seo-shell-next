import type { GetServerSidePropsContext } from "next";
import { withSeoShell, createEventBridge } from "@seo-shell/seo-shell/server";
import { seoShell } from "../../lib/seoShell";
import { fetchProfessional } from "../../lib/api";

export const getServerSideProps = withSeoShell(
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
  },
  { seoShell }
);

export default function ProfessionalPage() {
  return null;
}
