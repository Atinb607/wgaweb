import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSQL } from '@/lib/db';
import RecipeShareButtons from '@/components/RecipeShareButtons';
import JoinRevolutionSection from '@/components/JoinRevolutionSection';
import JsonLd from '@/components/JsonLd';
import { cldSrcSet } from '@/lib/cloudinary';
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  cloudinaryImage,
  DEFAULT_SITE_NAME,
  parseIsoDuration,
  siteUrl,
  truncate,
} from '@/lib/seo';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT slug
      FROM blog_posts
      WHERE is_published = true AND post_type = 'recipe'
    `;
    return (rows as unknown as { slug: string }[]).map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

interface RecipePost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt_text?: string | null;
  post_type: 'article' | 'recipe';
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at?: string | null;
  recipe_ingredients?: string[] | null;
  recipe_method_steps?: string[] | null;
  recipe_prep_time?: string | null;
  recipe_cook_time?: string | null;
  recipe_difficulty?: string | null;
  recipe_serves?: string | null;
  recipe_categories?: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

const getRecipe = cache(async (slug: string): Promise<RecipePost | null> => {
  try {
    const sql = getSQL();
    const posts = await sql`
      SELECT *
      FROM blog_posts
      WHERE slug = ${slug} AND is_published = true AND post_type = 'recipe'
      LIMIT 1
    `;
    if (posts.length === 0) return null;
    return posts[0] as unknown as RecipePost;
  } catch (err) {
    console.error('Error fetching recipe:', err);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getRecipe(params.slug);
  if (!post) {
    return {
      title: 'Recipe Not Found',
      robots: { index: false, follow: false },
    };
  }
  const title = post.seo_title?.trim() || `${post.title} · Recipe Khazana`;
  const rawDescription =
    post.seo_description?.trim() ||
    post.excerpt?.trim() ||
    post.content ||
    `Learn how to make ${post.title} with fresh microgreens from Wild About Greens.`;
  const description = truncate(rawDescription, 158);
  const imageAlt = post.cover_image_alt_text?.trim() || `${post.title} · Fresh Microgreens Recipe`;

  return buildPageMetadata({
    title,
    description,
    path: `/recipes/${post.slug}`,
    image: post.cover_image_url,
    imageAlt,
    type: 'article',
    publishedTime: post.published_at || post.created_at,
  });
}

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=2000&q=85';

export default async function RecipeDetailPage({ params }: { params: { slug: string } }) {
  const post = await getRecipe(params.slug);
  if (!post) {
    notFound();
  }

  const rawIngredients = post.recipe_ingredients;
  const ingredients: string[] = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === 'string'
    ? JSON.parse(rawIngredients || '[]')
    : [];

  const rawSteps = post.recipe_method_steps;
  const methodSteps: string[] = Array.isArray(rawSteps)
    ? rawSteps
    : typeof rawSteps === 'string'
    ? JSON.parse(rawSteps || '[]')
    : [];

  const hasMeta =
    post.recipe_prep_time?.trim() ||
    post.recipe_cook_time?.trim() ||
    post.recipe_difficulty?.trim() ||
    post.recipe_serves?.trim();

  const bannerImage = post.cover_image_url?.trim() || DEFAULT_BANNER;

  const cleanIngredients = ingredients.map((i) => (i ? i.trim() : '')).filter(Boolean);
  const cleanSteps = methodSteps.map((s) => (s ? s.trim() : '')).filter(Boolean);
  const cleanCategories = Array.isArray(post.recipe_categories)
    ? post.recipe_categories.map((c) => (c ? c.trim() : '')).filter(Boolean)
    : [];
  const prepIso = parseIsoDuration(post.recipe_prep_time);
  const cookIso = parseIsoDuration(post.recipe_cook_time);
  const publishedDate = post.published_at || post.created_at;
  const desc = post.excerpt?.trim() || truncate(post.content, 160);

  const recipeJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: post.title,
    ...(desc ? { description: desc } : {}),
    ...(post.cover_image_url?.trim()
      ? { image: [absoluteUrl(post.cover_image_url.trim())] }
      : {}),
    ...(cleanIngredients.length > 0 ? { recipeIngredient: cleanIngredients } : {}),
    ...(cleanSteps.length > 0
      ? {
          recipeInstructions: cleanSteps.map((step, idx) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            text: step,
          })),
        }
      : {}),
    ...(post.recipe_serves?.trim() ? { recipeYield: post.recipe_serves.trim() } : {}),
    ...(cleanCategories.length > 0
      ? {
          recipeCategory:
            cleanCategories.length === 1 ? cleanCategories[0] : cleanCategories,
        }
      : {}),
    author: {
      '@type': 'Organization',
      name: DEFAULT_SITE_NAME,
      url: siteUrl(),
    },
    ...(publishedDate ? { datePublished: new Date(publishedDate).toISOString() } : {}),
    ...(prepIso ? { prepTime: prepIso } : {}),
    ...(cookIso ? { cookTime: cookIso } : {}),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Recipes', path: '/recipes' },
    { name: post.title, path: `/recipes/${post.slug}` },
  ]);

  return (
    <div className="bg-white min-h-screen pt-[64px] lg:pt-[70px]">
      <JsonLd data={recipeJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* 1. Full-Width Edge-to-Edge Panoramic Hero Banner */}
      <div className="w-full relative overflow-hidden bg-[#EAE8E1] h-[220px] sm:h-[300px] md:h-[380px] lg:h-[440px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryImage(bannerImage, 1280)}
          srcSet={cldSrcSet(bannerImage, [480, 768, 1280, 1600])}
          sizes="100vw"
          alt={post.cover_image_alt_text?.trim() || post.title}
          width={1600}
          height={440}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* 2. Page Title Band: Clean, centered uppercase with spacious tracking */}
      <div className="bg-white pt-10 pb-4 sm:pt-14 sm:pb-6 px-4 sm:px-6 text-center">
        <h1 className="font-sans font-bold text-xl sm:text-2xl md:text-3xl lg:text-[32px] text-[#111111] uppercase tracking-[0.2em] leading-snug max-w-4xl mx-auto">
          {post.title}
        </h1>
      </div>

      {/* 3. Main Content Section: Seamless white background with 2-column layout */}
      <div className="bg-white text-[#151F19] pt-4 pb-14 sm:pt-6 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column: Floating Ingredients Card */}
            <aside className="md:col-span-5 lg:col-span-4">
              <div className="bg-white rounded-xl p-7 sm:p-9 shadow-sm border border-[#E4DDC8]">
                <h2 className="font-handwriting text-4xl sm:text-[44px] font-bold text-[#7BAE42] mb-1.5 leading-tight tracking-wide">
                  You Will Need
                </h2>
                <div className="border-b border-[#E4DDC8] pb-1 mb-5 w-full" />
                {ingredients.length > 0 ? (
                  <ul className="space-y-3.5 text-sm sm:text-[14.5px] text-[#222222] leading-relaxed">
                    {ingredients.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-[#222222] font-bold text-base leading-snug select-none shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Ingredients will be listed here soon.
                  </p>
                )}
              </div>
            </aside>

            {/* Right Column: Introduction, Method, Meta Info, Share, Back Button */}
            <div className="md:col-span-7 lg:col-span-8">
              {/* Introduction */}
              {post.content && (
                <div className="mb-6">
                  <h2 className="font-bold text-base sm:text-[17px] text-[#111111] mb-2">
                    Introduction
                  </h2>
                  <div className="text-sm sm:text-[14.5px] leading-relaxed text-[#333333] space-y-3">
                    {post.content.split('\n\n').map((para, idx) => (
                      <p key={idx} className="whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Method */}
              {methodSteps.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-bold text-base sm:text-[17px] text-[#111111] mb-2.5">
                    Method
                  </h2>
                  <ol className="space-y-2 text-sm sm:text-[14.5px] leading-relaxed text-[#333333]">
                    {methodSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-normal shrink-0">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Metadata Info: Clean text lines */}
              {hasMeta && (
                <div className="space-y-1.5 text-sm sm:text-[14.5px] text-[#333333] mb-8">
                  {post.recipe_prep_time?.trim() && (
                    <div>
                      <span className="font-bold text-[#111111]">Prep Time:</span>{' '}
                      <span>{post.recipe_prep_time.trim()}</span>
                    </div>
                  )}
                  {post.recipe_cook_time?.trim() && (
                    <div>
                      <span className="font-bold text-[#111111]">Cook Time:</span>{' '}
                      <span>{post.recipe_cook_time.trim()}</span>
                    </div>
                  )}
                  {post.recipe_difficulty?.trim() && (
                    <div>
                      <span className="font-bold text-[#111111]">Difficulty:</span>{' '}
                      <span>{post.recipe_difficulty.trim()}</span>
                    </div>
                  )}
                  {post.recipe_serves?.trim() && (
                    <div>
                      <span className="font-bold text-[#111111]">Serves:</span>{' '}
                      <span>{post.recipe_serves.trim()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Divider Line */}
              <div className="border-t border-[#E4DDC8] pt-6 mb-6">
                {/* Share Recipe */}
                <RecipeShareButtons
                  title={post.title}
                  coverImageUrl={post.cover_image_url}
                  label="Share recipe"
                />
              </div>

              {/* Back to Recipes Button: Green Pill */}
              <div className="mt-8">
                <Link
                  href="/recipes"
                  className="inline-flex items-center gap-2.5 bg-[#74A832] hover:bg-[#5E8C24] text-white text-xs sm:text-[13px] font-bold uppercase tracking-[0.14em] px-6 py-3 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 8l-4 4 4 4" />
                  </svg>
                  <span>BACK TO RECIPES</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Join The Revolution Section: Exactly like the home page */}
      <JoinRevolutionSection />
    </div>
  );
}
