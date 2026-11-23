import { redirect } from 'next/navigation';

export default async function CartContentRedirect({
  params,
}: {
  params: Promise<{ panelKey: string }> | { panelKey: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  redirect(`/${resolvedParams?.panelKey || 'admin'}/content?tab=cart-drawer`);
}
