import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RecipeDetailLegacyRedirect({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  permanentRedirect(`/recipes/${slug}`);
}
