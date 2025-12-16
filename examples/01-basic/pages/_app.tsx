import type { AppProps } from "next/app";
import { SeoShellProvider } from "@seo-shell/seo-shell";

export default function App({ Component, pageProps }: AppProps) {
  const shell = pageProps.__seoShell;

  if (!shell) {
    return <Component {...pageProps} />;
  }

  return (
    <SeoShellProvider
      assets={shell.assets}
      noIndex={shell.noIndex}
      seo={{ ...shell.defaultSeo, ...pageProps.seo }}
    >
      <Component {...pageProps} />
    </SeoShellProvider>
  );
}
