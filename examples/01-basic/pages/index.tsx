import { seoShellApp } from "../lib/seoShell";

export const getServerSideProps = seoShellApp.withSeoShell(async () => ({
  props: {
    seo: {
      title: "Home",
      description: "Welcome to my app",
    },
  },
}));

export default function HomePage() {
  return null;
}
