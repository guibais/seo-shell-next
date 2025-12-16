import { withSeoShell } from "@seo-shell/seo-shell/server";
import { seoShell } from "../lib/seoShell";

export const getServerSideProps = withSeoShell(
  async () => ({
    props: {
      seo: {
        title: "Home",
        description: "Welcome to my app",
      },
    },
  }),
  { seoShell }
);

export default function HomePage() {
  return null;
}
