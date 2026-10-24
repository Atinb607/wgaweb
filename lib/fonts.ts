import {
  Inter,
  Fraunces,
  Newsreader,
  Anton,
  Dancing_Script,
  IBM_Plex_Mono,
} from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  axes: ['opsz'],
});

export const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-editorial',
  axes: ['opsz'],
});

export const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-display',
});

export const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-handwriting',
});

export const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-mono',
});

export const fontVariables = `${inter.variable} ${fraunces.variable} ${newsreader.variable} ${anton.variable} ${dancingScript.variable} ${ibmPlexMono.variable}`;
