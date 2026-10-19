import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Returns & Exchanges',
  description: 'Morning harvest delivery policies and 24-hour return guidelines for Wild About Greens.',
};

export default function ReturnsAndExchangePage() {
  redirect('/shipping-and-returns');
}
