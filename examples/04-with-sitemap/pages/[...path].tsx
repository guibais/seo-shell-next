import { seoShellApp } from "../lib/seoShell";

export const getServerSideProps = seoShellApp.withSeoShell(async () => ({
  props: {},
}));

export default function SpaFallbackPage() {
  return null;
}
