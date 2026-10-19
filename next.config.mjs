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
    return [
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
