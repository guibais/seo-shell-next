export type Professional = {
  slug: string;
  name: string;
  bio: string;
  imageUrl: string;
};

export async function fetchProfessional(
  slug: string
): Promise<Professional | null> {
  const res = await fetch(`https://api.example.com/professionals/${slug}`);
  if (!res.ok) return null;
  return res.json();
}
