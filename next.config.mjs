/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  async headers() {
    const antiCacheHeaders = [
      { key: 'Cache-Control', value: 'private, no-cache, no-store, max-age=0, must-revalidate' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
      { key: 'X-Cache-Enabled', value: 'False' },
      { key: 'X-Accel-Buffering', value: 'no' },
      { key: 'Surrogate-Control', value: 'no-store' },
    ];

    const adminSlugs = Array.from(
      new Set(
        [
          process.env.ADMIN_PANEL_SLUG,
          'admin-panel-secure',
          'admin',
        ].filter(Boolean)
      )
    );

    const adminRouteRules = [
      {
        source: '/api/admin/:path*',
        headers: antiCacheHeaders,
      },
      ...adminSlugs.flatMap((slug) => [
        {
          source: `/${slug}`,
          headers: antiCacheHeaders,
        },
        {
          source: `/${slug}/:path*`,
          headers: antiCacheHeaders,
        },
      ]),
    ];

    return [
      ...adminRouteRules,
      {
        source: '/((?!_next/).*\\.(?:ico|png|jpg|jpeg|svg|webp|avif|mp4|webm|woff|woff2|ttf|otf))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/recipe',
        destination: '/recipes',
        permanent: true,
      },
      {
        source: '/recipe/:slug',
        destination: '/recipes/:slug',
        permanent: true,
      },
      {
        source: '/recipe-khazana',
        destination: '/recipes',
        permanent: true,
      },
      {
        source: '/recipe-khazana/:slug',
        destination: '/recipes/:slug',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/pathshala',
        permanent: true,
      },
      {
        source: '/terms-of-service',
        destination: '/terms-and-conditions',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/terms-and-conditions',
        permanent: true,
      },
      {
        source: '/privacy',
        destination: '/privacy-policy',
        permanent: true,
      },
      {
        source: '/returns-and-exchange',
        destination: '/shipping-and-returns',
        permanent: false,
      },
      {
        source: '/returns',
        destination: '/shipping-and-returns',
        permanent: true,
      },
      {
        source: '/shipping',
        destination: '/shipping-and-returns',
        permanent: true,
      },
      {
        source: '/shipping-policy',
        destination: '/shipping-and-returns',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
