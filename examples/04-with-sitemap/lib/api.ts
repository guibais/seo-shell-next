export type Professional = {
  slug: string;
  name: string;
  bio: string;
};

export type City = {
  slug: string;
  name: string;
};

export async function fetchProfessional(
  slug: string
): Promise<Professional | null> {
  const res = await fetch(`https://api.example.com/professionals/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAllProfessionalUrls(): Promise<string[]> {
  const res = await fetch("https://api.example.com/professionals");
  const professionals: Professional[] = await res.json();
  return professionals.map((p) => `https://myapp.com/professional/${p.slug}`);
}

export async function fetchAllCityUrls(): Promise<string[]> {
  const res = await fetch("https://api.example.com/cities");
  const cities: City[] = await res.json();
  return cities.map((c) => `https://myapp.com/city/${c.slug}`);
}
