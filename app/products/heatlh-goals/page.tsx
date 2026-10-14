import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function HeatlhGoalsTypoRedirect({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const goal = searchParams?.goal;
  const qs = goal ? `?goal=${encodeURIComponent(Array.isArray(goal) ? goal[0] : goal)}` : '';
  redirect(`/products/health-goals${qs}`);
}
