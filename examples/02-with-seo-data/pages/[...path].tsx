import {
  getDefaultSeoFromEnv,
  getSeoShellConfigFromEnv,
  withSeoShell,
} from "@seo-shell/seo-shell/server";

export const getServerSideProps = withSeoShell(
  async () => {
    return { props: {} };
  },
  {
    seoShellConfig: getSeoShellConfigFromEnv(),
    getDefaultSeo: getDefaultSeoFromEnv,
  }
);

export default function SpaFallbackPage() {
  return null;
}
