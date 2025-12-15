export type WithContext<
  TType extends string,
  T extends Record<string, unknown>,
> = {
  "@context": "https://schema.org";
  "@type": TType;
} & T;

export type BreadcrumbListJsonLd = WithContext<
  "BreadcrumbList",
  {
    itemListElement: Array<{
      "@type": "ListItem";
      position: number;
      name: string;
      item: string;
    }>;
  }
>;

export type ItemListJsonLd = WithContext<
  "ItemList",
  {
    itemListElement: Array<{
      "@type": "ListItem";
      position: number;
      url: string;
      name: string;
    }>;
  }
>;

export type LocalBusinessJsonLd = WithContext<
  "LocalBusiness",
  {
    name: string;
    description?: string;
    url: string;
    telephone?: string;
    image?: string[];
    address?: {
      "@type": "PostalAddress";
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
    };
    aggregateRating?: {
      "@type": "AggregateRating";
      ratingValue: string;
      reviewCount: number;
    };
  }
>;

export type JsonLd =
  | BreadcrumbListJsonLd
  | ItemListJsonLd
  | LocalBusinessJsonLd;

type BreadcrumbItem = {
  name: string;
  url: string;
};

export const buildBreadcrumbListJsonLd = (
  items: BreadcrumbItem[]
): BreadcrumbListJsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

type ItemListItem = {
  name: string;
  url: string;
};

export const buildItemListJsonLd = (items: ItemListItem[]): ItemListJsonLd => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: item.url,
    name: item.name,
  })),
});

type LocalBusinessInput = {
  name: string;
  description?: string;
  url: string;
  telephone?: string;
  image?: string[];
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
  aggregateRating?: {
    ratingValue: string;
    reviewCount: number;
  };
};

export const buildLocalBusinessJsonLd = (
  input: LocalBusinessInput
): LocalBusinessJsonLd => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: input.name,
  description: input.description,
  url: input.url,
  telephone: input.telephone,
  image: input.image,
  address:
    input.addressLocality || input.addressRegion || input.addressCountry
      ? {
          "@type": "PostalAddress",
          addressLocality: input.addressLocality,
          addressRegion: input.addressRegion,
          addressCountry: input.addressCountry,
        }
      : undefined,
  aggregateRating: input.aggregateRating
    ? {
        "@type": "AggregateRating",
        ratingValue: input.aggregateRating.ratingValue,
        reviewCount: input.aggregateRating.reviewCount,
      }
    : undefined,
});

export const toJsonLdScriptProps = (jsonLd: JsonLd | JsonLd[]) => ({
  type: "application/ld+json" as const,
  dangerouslySetInnerHTML: {
    __html: JSON.stringify(jsonLd),
  },
});
