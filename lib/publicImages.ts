/**
 * Cloudinary hosted public brand assets and icons.
 * Replaces local /public image dependencies to guarantee 100% reliable CDN delivery
 * across local development, custom domains, and serverless hosting (e.g. wildaboutgreens.com).
 */

export const CLOUDINARY_ASSETS = {
  circleLogo: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_160,c_limit/v1792608008/wag_assets/circle-logo.jpg',
  fssai: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_320,c_limit/v1792608021/wag_assets/fssailogo.png',
  fssaiLogo: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_320,c_limit/v1792608021/wag_assets/fssailogo.png',
  logoWhiteBg: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_400,c_limit/v1792608046/wag_assets/logo-white-bg.png',
  logoPictureBg: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_400,c_limit/v1792608045/wag_assets/logo-picture-bg.png',
  logoForWhiteBg: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_400,c_limit/v1792608041/wag_assets/logo_for_white_bg.png',
  logoForPictureBg: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_400,c_limit/v1792608037/wag_assets/logo_for_picture_background.png',
  kidEatingMicrogreens: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_1000,c_limit/v1792608034/wag_assets/kid-eating-microgreens.png',
  trioBundleBanner: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_900,c_limit/v1792608108/wag_assets/trio-bundle-banner.png',
  tricityTrioBanner: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_900,c_limit/v1792608105/wag_assets/tricity-trio-banner.png',
  faviconPng: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_webp,q_auto,w_64,c_limit/v1792608010/wag_assets/favicon.png',
  appleTouchIcon: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_180,c_limit/v1792608007/wag_assets/apple-touch-icon.png',

  // Right Choice / Why Choose Cards
  whyChoose: {
    grownNotMade: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608080/wag_assets/right-choice/grown-not-made.png',
    roWater: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608103/wag_assets/right-choice/ro-water.png',
    cocoPeat: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608078/wag_assets/right-choice/coco-peat.png',
    noPest: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608091/wag_assets/right-choice/no-pest.png',
    roWaterPitcher: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608100/wag_assets/right-choice/ro-water-pitcher-backup.png',
    tenDayPeak: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608023/wag_assets/images/why-choose/10-day-peak.jpg',
    cutToOrder: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608026/wag_assets/images/why-choose/cut-to-order.jpg',
    mineralRoWater: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608029/wag_assets/images/why-choose/mineral-ro-water.jpg',
    soilFreeClean: 'https://res.cloudinary.com/qjoihkpr/image/upload/f_auto,q_auto,w_600,c_limit/v1792608033/wag_assets/images/why-choose/soil-free-clean.jpg',
  },
} as const;
