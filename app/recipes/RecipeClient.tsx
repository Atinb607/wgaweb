'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Utensils } from '@/components/icons';
import { cldUrl, cldSrcSet } from '@/lib/cloudinary';

export interface RecipeItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt_text?: string | null;
  recipe_categories?: string[] | null;
  published_at: string | null;
}

interface RecipeClientProps {
  recipes: RecipeItem[];
  categories: string[];
  content: Record<string, string>;
}

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=2000&q=85';

export default function RecipeClient({
  recipes,
  categories,
  content,
}: RecipeClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const heroImageSource = content.hero_image_url?.trim() || DEFAULT_HERO_IMAGE;
  const heroImage = cldUrl(heroImageSource, 1280);
  const heroSrcSet = cldSrcSet(heroImageSource, [480, 768, 1280, 1600]);
  const heroTitle = content.hero_title?.trim() || 'All Recipes';
  const heroSubtitle = content.hero_subtitle?.trim() || '';

  const filteredRecipes = recipes.filter((recipe) => {
    if (activeCategory === 'all') return true;
    if (!recipe.recipe_categories || !Array.isArray(recipe.recipe_categories)) return false;
    return recipe.recipe_categories.some(
      (cat) => cat.toLowerCase().trim() === activeCategory.toLowerCase().trim()
    );
  });

  return (
    <div className="bg-white text-[#151F19] min-h-screen pt-[64px] lg:pt-[70px] pb-24">
      {/* Full-Width Edge-to-Edge Panoramic Hero Banner (W S Bentley Style) */}
      <div className="w-full relative overflow-hidden bg-[#EAE8E1] h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          srcSet={heroSrcSet}
          sizes="100vw"
          alt={content.hero_image_url_alt?.trim() || `${heroTitle} · Wild About Greens`}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width={2000}
          height={600}
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title Section (Centered, Clean Spaced Uppercase) */}
        <div className="text-center pt-10 pb-6 sm:pt-12 sm:pb-8">
          <h1 className="font-sans font-bold sm:font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#18231C] uppercase tracking-[0.22em] sm:tracking-[0.26em]">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="text-[#666666] text-xs sm:text-sm max-w-xl mx-auto mt-2 font-normal leading-relaxed">
              {heroSubtitle}
            </p>
          )}
        </div>

        {/* Category Filter Tabs (Crisp Green Outlined Rectangular Pills) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10 sm:mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 sm:px-5 py-1.5 sm:py-2 border text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200 ${
              activeCategory === 'all'
                ? 'bg-[#74A832] text-white border-[#74A832] shadow-xs'
                : 'bg-transparent text-[#2C3E2D] border-[#74A832] hover:bg-[#74A832] hover:text-white'
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 border text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200 ${
                  isActive
                    ? 'bg-[#74A832] text-white border-[#74A832] shadow-xs'
                    : 'bg-transparent text-[#2C3E2D] border-[#74A832] hover:bg-[#74A832] hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 4-Column Recipe Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16 bg-[#FAF9F6] border border-[#E4DDC8] p-8 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#EDEAE1] text-[#1C3F2D] flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#151F19] mb-2">
              No recipes found in this category
            </h2>
            <p className="text-xs sm:text-sm text-[#5C6B60] mb-6 leading-relaxed">
              Try selecting another category or view all recipes.
            </p>
            <button
              onClick={() => setActiveCategory('all')}
              className="inline-block px-6 py-2.5 border border-[#74A832] bg-[#74A832] text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#5E8C24] transition-all"
            >
              View All Recipes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 sm:gap-x-7 gap-y-10 sm:gap-y-12">
            {filteredRecipes.map((post) => {
              const postCategories = (post.recipe_categories || []).filter(
                (c) => c && c.trim().length > 0
              );
              const categoriesText = postCategories.length > 0 ? postCategories.join(', ') : null;

              return (
                <article key={post.id} className="group flex flex-col">
                  {/* Photo (Clean rectangular presentation, smooth hover zoom) */}
                  <Link
                    href={`/recipes/${post.slug}`}
                    className="block aspect-[16/10] w-full overflow-hidden bg-[#EDEAE1] relative"
                  >
                    {post.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cldUrl(post.cover_image_url, 640)}
                        alt={post.cover_image_alt_text?.trim() || `${post.title} · microgreens recipe`}
                        loading="lazy"
                        decoding="async"
                        width={640}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EDE7D6] to-[#E1DAC3] opacity-60">
                        <Utensils className="w-10 h-10 text-[#1C3F2D]" />
                      </div>
                    )}
                  </Link>

                  {/* Centered Title & Found in line below photo */}
                  <div className="mt-3.5 sm:mt-4 text-center flex flex-col items-center px-1">
                    <h2 className="font-sans font-semibold text-xs sm:text-[14px] uppercase tracking-[0.06em] text-[#6CA030] hover:text-[#527d22] transition-colors line-clamp-2 leading-snug">
                      <Link href={`/recipes/${post.slug}`}>{post.title}</Link>
                    </h2>

                    {categoriesText && (
                      <p className="text-[11px] sm:text-xs text-[#555555] font-normal tracking-wide mt-1.5">
                        Found in {categoriesText} Recipes
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
