import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getHealthGoalBySlug } from '@/lib/healthGoals';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const goal = getHealthGoalBySlug(params.slug);
  if (!goal) {
    return {
      title: 'Health Goals · Wild About Greens',
      description: 'Fresh microgreens curated by health goal.',
    };
  }

  return {
    title: `${goal.title} · Fresh Microgreens | Wild About Greens`,
    description: goal.heroSubtitle,
    openGraph: {
      title: `${goal.title} · Fresh Microgreens | Wild About Greens`,
      description: goal.heroSubtitle,
      images: [{ url: goal.heroImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${goal.title} · Fresh Microgreens | Wild About Greens`,
      description: goal.heroSubtitle,
    },
  };
}

export default async function HealthGoalPage({ params }: PageProps) {
  const goal = getHealthGoalBySlug(params.slug);
  const targetSlug = goal ? goal.slug : params.slug;
  redirect(`/products/health-goals?goal=${encodeURIComponent(targetSlug)}`);
}
