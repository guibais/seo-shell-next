import { describe, it, expect } from "vitest";
import {
  buildBreadcrumbListJsonLd,
  buildItemListJsonLd,
  buildLocalBusinessJsonLd,
  toJsonLdScriptProps,
} from "./jsonLd";

describe("buildBreadcrumbListJsonLd", () => {
  it("builds breadcrumb list with single item", () => {
    const result = buildBreadcrumbListJsonLd([
      { name: "Home", url: "https://example.com" },
    ]);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://example.com",
        },
      ],
    });
  });

  it("builds breadcrumb list with multiple items", () => {
    const result = buildBreadcrumbListJsonLd([
      { name: "Home", url: "https://example.com" },
      { name: "Products", url: "https://example.com/products" },
      { name: "Item", url: "https://example.com/products/item" },
    ]);

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("BreadcrumbList");
    expect(result.itemListElement).toHaveLength(3);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
    expect(result.itemListElement[2].position).toBe(3);
  });

  it("builds empty breadcrumb list", () => {
    const result = buildBreadcrumbListJsonLd([]);
    expect(result.itemListElement).toEqual([]);
  });
});

describe("buildItemListJsonLd", () => {
  it("builds item list with single item", () => {
    const result = buildItemListJsonLd([
      { name: "Product 1", url: "https://example.com/p1" },
    ]);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          url: "https://example.com/p1",
          name: "Product 1",
        },
      ],
    });
  });

  it("builds item list with multiple items", () => {
    const result = buildItemListJsonLd([
      { name: "Product 1", url: "https://example.com/p1" },
      { name: "Product 2", url: "https://example.com/p2" },
    ]);

    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
  });

  it("builds empty item list", () => {
    const result = buildItemListJsonLd([]);
    expect(result.itemListElement).toEqual([]);
  });
});

describe("buildLocalBusinessJsonLd", () => {
  it("builds minimal local business", () => {
    const result = buildLocalBusinessJsonLd({
      name: "My Business",
      url: "https://mybusiness.com",
    });

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "My Business",
      description: undefined,
      url: "https://mybusiness.com",
      telephone: undefined,
      image: undefined,
      address: undefined,
      aggregateRating: undefined,
    });
  });

  it("builds local business with all fields", () => {
    const result = buildLocalBusinessJsonLd({
      name: "My Business",
      description: "A great business",
      url: "https://mybusiness.com",
      telephone: "+1234567890",
      image: [
        "https://mybusiness.com/img1.jpg",
        "https://mybusiness.com/img2.jpg",
      ],
      addressLocality: "City",
      addressRegion: "State",
      addressCountry: "Country",
      aggregateRating: {
        ratingValue: "4.5",
        reviewCount: 100,
      },
    });

    expect(result.name).toBe("My Business");
    expect(result.description).toBe("A great business");
    expect(result.telephone).toBe("+1234567890");
    expect(result.image).toEqual([
      "https://mybusiness.com/img1.jpg",
      "https://mybusiness.com/img2.jpg",
    ]);
    expect(result.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "City",
      addressRegion: "State",
      addressCountry: "Country",
    });
    expect(result.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: 100,
    });
  });

  it("builds address when only locality is provided", () => {
    const result = buildLocalBusinessJsonLd({
      name: "My Business",
      url: "https://mybusiness.com",
      addressLocality: "City",
    });

    expect(result.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "City",
      addressRegion: undefined,
      addressCountry: undefined,
    });
  });

  it("builds address when only region is provided", () => {
    const result = buildLocalBusinessJsonLd({
      name: "My Business",
      url: "https://mybusiness.com",
      addressRegion: "State",
    });

    expect(result.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: undefined,
      addressRegion: "State",
      addressCountry: undefined,
    });
  });

  it("builds address when only country is provided", () => {
    const result = buildLocalBusinessJsonLd({
      name: "My Business",
      url: "https://mybusiness.com",
      addressCountry: "Country",
    });

    expect(result.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: undefined,
      addressRegion: undefined,
      addressCountry: "Country",
    });
  });

  it("does not build address when no address fields provided", () => {
    const result = buildLocalBusinessJsonLd({
      name: "My Business",
      url: "https://mybusiness.com",
    });

    expect(result.address).toBeUndefined();
  });

  it("does not build aggregateRating when not provided", () => {
    const result = buildLocalBusinessJsonLd({
      name: "My Business",
      url: "https://mybusiness.com",
    });

    expect(result.aggregateRating).toBeUndefined();
  });
});

describe("toJsonLdScriptProps", () => {
  it("returns script props for single jsonLd", () => {
    const jsonLd = buildBreadcrumbListJsonLd([
      { name: "Home", url: "https://example.com" },
    ]);

    const result = toJsonLdScriptProps(jsonLd);

    expect(result.type).toBe("application/ld+json");
    expect(result.dangerouslySetInnerHTML.__html).toBe(JSON.stringify(jsonLd));
  });

  it("returns script props for array of jsonLd", () => {
    const jsonLdArray = [
      buildBreadcrumbListJsonLd([{ name: "Home", url: "https://example.com" }]),
      buildItemListJsonLd([{ name: "Product", url: "https://example.com/p" }]),
    ];

    const result = toJsonLdScriptProps(jsonLdArray);

    expect(result.type).toBe("application/ld+json");
    expect(result.dangerouslySetInnerHTML.__html).toBe(
      JSON.stringify(jsonLdArray)
    );
  });
});
