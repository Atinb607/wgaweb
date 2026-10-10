import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSQL } from '@/lib/db';
import RecipeShareButtons from '@/components/RecipeShareButtons';
import JoinRevolutionSection from '@/components/JoinRevolutionSection';

export const dynamic = 'force-dynamic';

interface ArticlePost {
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
  recipe_categories?: string[] | null;
}

async function getArticle(slug: string): Promise<ArticlePost | null> {
  try {
    const sql = getSQL();
    const posts = await sql`
      SELECT
        id, slug, title, content, excerpt, cover_image_url, cover_image_alt_text,
        post_type, is_published, published_at, created_at, recipe_categories
      FROM blog_posts
      WHERE slug = ${slug} AND is_published = true AND post_type = 'article'
      LIMIT 1
    `;
    if (posts.length === 0) return null;
    return posts[0] as unknown as ArticlePost;
  } catch (err) {
    console.error('Error fetching article:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getArticle(params.slug);
  if (!post) {
    return { title: 'Article Not Found · Wild About Greens' };
  }
  const siteTitle = `${post.title} · Wild About Greens`;

  return {
    title: siteTitle,
    description: post.excerpt || 'Read the latest insights from Wild About Greens.',
    openGraph: {
      title: siteTitle,
      description: post.excerpt || 'Read the latest insights from Wild About Greens.',
      type: 'article',
      ...(post.cover_image_url ? { images: [{ url: post.cover_image_url }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: post.excerpt || 'Read the latest insights from Wild About Greens.',
      ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}),
    },
  };
}

const DEFAULT_ARTICLE_BANNER = 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=2000&q=85';

export default async function PathshalaDetailPage({ params }: { params: { slug: string } }) {
  const post = await getArticle(params.slug);
  if (!post) {
    notFound();
  }

  const categories = Array.isArray(post.recipe_categories)
    ? post.recipe_categories.filter((c) => c && c.trim().length > 0)
    : [];

  const bannerImage = post.cover_image_url?.trim() || DEFAULT_ARTICLE_BANNER;

  const paragraphs = post.content
    ? post.content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : [];

  const midPoint = Math.ceil(paragraphs.length / 2);
  const leftCol = paragraphs.slice(0, midPoint);
  const rightCol = paragraphs.slice(midPoint);

  return (
    <div className="bg-white min-h-screen pt-[64px] lg:pt-[70px]">
      {/* 1. Full-Width Edge-to-Edge Panoramic Hero Banner */}
      <div className="w-full relative overflow-hidden bg-[#EAE8E1] h-[220px] sm:h-[300px] md:h-[380px] lg:h-[440px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerImage}
          alt={post.cover_image_alt_text || post.title}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* 2. Page Title Band: Clean, centered uppercase with metadata */}
      <div className="bg-white pt-10 pb-6 sm:pt-14 sm:pb-8 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <h1 className="font-sans font-bold text-xl sm:text-2xl md:text-3xl lg:text-[34px] text-[#111111] uppercase tracking-[0.2em] leading-snug">
          {post.title}
        </h1>

        {/* Categories & Published Date */}
        {(categories.length > 0 || post.published_at) && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap mt-3.5 text-xs sm:text-[13px] text-[#555555]">
            {categories.length > 0 && (
              <span className="font-semibold uppercase tracking-wider text-[#74A832]">
                {categories.join(' · ')}
              </span>
            )}
            {categories.length > 0 && post.published_at && (
              <span className="text-[#A09A8A] select-none">•</span>
            )}
            {post.published_at && (
              <span className="tracking-wide">
                {new Date(post.published_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Main Content Section: 2-Column Article Layout */}
      <div className="bg-white text-[#151F19] pt-2 pb-14 sm:pt-4 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {paragraphs.length > 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 xl:gap-16 items-start">
              <div className="space-y-5 sm:space-y-6">
                {leftCol.map((para, idx) => (
                  <p
                    key={idx}
                    className="whitespace-pre-line leading-[1.8] text-[#2C3E2D] text-sm sm:text-[15px] lg:text-base font-normal"
                  >
                    {para}
                  </p>
                ))}
              </div>
              <div className="space-y-5 sm:space-y-6">
                {rightCol.map((para, idx) => (
                  <p
                    key={idx}
                    className="whitespace-pre-line leading-[1.8] text-[#2C3E2D] text-sm sm:text-[15px] lg:text-base font-normal"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 gap-8 lg:gap-14 space-y-5 text-[#2C3E2D] text-sm sm:text-[15px] lg:text-base leading-[1.8]">
              {paragraphs.map((para, idx) => (
                <p key={idx} className="whitespace-pre-line mb-5 break-inside-avoid">
                  {para}
                </p>
              ))}
            </div>
          )}

          {/* Divider Line */}
          <div className="border-t border-[#E4DDC8] pt-8 mt-12 mb-6">
            {/* Share Article */}
            <RecipeShareButtons
              title={post.title}
              coverImageUrl={post.cover_image_url}
              label="Share article"
            />
          </div>

          {/* Back to Pathshala Button: Green Pill */}
          <div className="mt-8">
            <Link
              href="/pathshala"
              className="inline-flex items-center gap-2.5 bg-[#74A832] hover:bg-[#5E8C24] text-white text-xs sm:text-[13px] font-bold uppercase tracking-[0.14em] px-6 py-3 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 8l-4 4 4 4" />
              </svg>
              <span>BACK TO PATHSHALA</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Join The Revolution Section */}
      <JoinRevolutionSection />
    </div>
  );
}
