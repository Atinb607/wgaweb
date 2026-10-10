import Link from 'next/link';
import { Instagram, ShoppingBag, PackageBox } from '@/components/icons';

interface JoinRevolutionSectionProps {
  title?: string;
  subtitle?: string;
}

export default function JoinRevolutionSection({
  title,
  subtitle = 'One tray at a time, grown ten minutes from your kitchen.',
}: JoinRevolutionSectionProps) {
  return (
    <section className="relative bg-[#122A1F] py-20 text-[#FFFDF8] text-center overflow-hidden">
      <div className="wrap relative z-10 max-w-2xl mx-auto px-4">
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium mb-4 leading-tight">
          {title ? (
            title
          ) : (
            <>
              Join the revolution.
              <br />
              <em className="italic text-[#CFFA57] font-normal">Live healthily.</em>
            </>
          )}
        </h2>
        <p className="text-[#FFFDF8]/70 text-base sm:text-lg mb-8 max-w-md mx-auto">
          {subtitle}
        </p>
        <div className="flex justify-center gap-3.5 flex-wrap">
          <a
            href="https://www.instagram.com/wild.about.greens/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#FFFDF8]/30 px-5 py-3 rounded-full text-sm font-semibold text-white hover:bg-[#CFFA57] hover:border-[#CFFA57] hover:text-[#151F19] hover:-translate-y-0.5 transition-all duration-200"
          >
            <Instagram className="w-4 h-4 shrink-0" />
            <span>Instagram</span>
          </a>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 border border-[#FFFDF8]/30 px-5 py-3 rounded-full text-sm font-semibold text-white hover:bg-[#CFFA57] hover:border-[#CFFA57] hover:text-[#151F19] hover:-translate-y-0.5 transition-all duration-200"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Shop Products</span>
          </Link>
          <Link
            href="/bulk-order"
            className="inline-flex items-center gap-2 border border-[#FFFDF8]/30 px-5 py-3 rounded-full text-sm font-semibold text-white hover:bg-[#CFFA57] hover:border-[#CFFA57] hover:text-[#151F19] hover:-translate-y-0.5 transition-all duration-200"
          >
            <PackageBox className="w-4 h-4 shrink-0" />
            <span>Bulk Order</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
