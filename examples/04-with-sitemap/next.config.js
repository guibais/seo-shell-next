const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@seo-shell/seo-shell"],
  async rewrites() {
    return [
      {
        source: "/sitemaps/cities/:page.xml",
        destination: "/seo/cities-:page.xml",
      },
      {
        source: "/sitemaps/professionals/:page.xml",
        destination: "/seo/professionals-:page.xml",
      },
    ];
  },
};

export default nextConfig;
