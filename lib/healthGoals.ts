export interface HealthGoal {
  id: string; // canonical slug e.g. 'boost-immunity'
  slug: string;
  title: string;
  tag: string;
  icon: string;
  subtitle: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aliases: string[];
}

export const HEALTH_GOALS: HealthGoal[] = [
  {
    id: 'boost-immunity',
    slug: 'boost-immunity',
    title: 'Boost Immunity',
    tag: 'IMMUNITY',
    icon: 'shield',
    subtitle: 'Broccoli & radish blends',
    heroEyebrow: 'TARGETED CELLULAR NUTRITION · IMMUNITY',
    heroTitle: 'Strengthen natural defenses with potent sulforaphane & vitamin C.',
    heroSubtitle:
      'Fresh broccoli and peppery radish shoots packed with bioavailable antioxidants, glucosinolates, and immune-support enzymes harvested fresh on delivery morning.',
    heroImage:
      'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=jpg&q=85&w=1400&auto=format&fit=crop',
    aliases: ['immunity', 'boost-immunity'],
  },
  {
    id: 'weight-management',
    slug: 'weight-management',
    title: 'Weight Management',
    tag: 'WEIGHT',
    icon: 'scale',
    subtitle: 'Low cal, high fibre trays',
    heroEyebrow: 'CLEAN METABOLIC FUEL · WEIGHT MANAGEMENT',
    heroTitle: 'High satiety, dense micronutrients, near-zero calorie burden.',
    heroSubtitle:
      'Fiber-rich, enzymatically active fresh greens that support gentle digestion, natural fullness, and sustained metabolic balance without empty fillers.',
    heroImage:
      'https://plus.unsplash.com/premium_photo-1703258064295-71c77cc0720f?fm=jpg&q=85&w=1400&auto=format&fit=crop',
    aliases: ['weight', 'weight-management'],
  },
  {
    id: 'kids-nutrition',
    slug: 'kids-nutrition',
    title: 'Kids Nutrition',
    tag: 'KIDS',
    icon: 'smile',
    subtitle: 'Mild, sweet pea shoots & microgreens',
    heroEyebrow: 'GENTLE & SWEET · KIDS NUTRITION',
    heroTitle: 'Deliciously mild green crunch that kids actually love.',
    heroSubtitle:
      'Tender, sweet, zero-bitterness shoots packed with natural folate, calcium, and vitamin A. Snip straight onto pizzas, pastas, sandwiches, and daily meals.',
    heroImage:
      'https://plus.unsplash.com/premium_photo-1666184891926-68f52da26f15?fm=jpg&q=85&w=1400&auto=format&fit=crop',
    aliases: ['kids', 'kids-nutrition'],
  },
  {
    id: 'fitness-recovery',
    slug: 'fitness-recovery',
    title: 'Fitness & Recovery',
    tag: 'FITNESS',
    icon: 'zap',
    subtitle: 'Protein forward sunflower & green power',
    heroEyebrow: 'PLANT POWER · FITNESS & RECOVERY',
    heroTitle: 'Complete plant amino acids and electrolytes for rapid recovery.',
    heroSubtitle:
      'Crunchy sunflower shoots and mineral-rich greens offering complete plant proteins, zinc, and natural magnesium to fuel active workouts and accelerate recovery.',
    heroImage:
      'https://images.unsplash.com/photo-1610622930110-3c076902312a?fm=jpg&q=85&w=1400&auto=format&fit=crop',
    aliases: ['fitness', 'fitness-recovery'],
  },
  {
    id: 'diabetes-friendly',
    slug: 'diabetes-friendly',
    title: 'Diabetes Friendly',
    tag: 'LOW GI',
    icon: 'activity',
    subtitle: 'Low glycemic greens',
    heroEyebrow: 'LOW GLYCEMIC DENSITY · GLUCOSE BALANCE',
    heroTitle: 'Naturally support stable glucose with zero-spike fresh greens.',
    heroSubtitle:
      'Clinical studies show fresh brassica microgreens support insulin sensitivity and cellular vitality. Ultra low glycemic index, grown pure with mineral RO water.',
    heroImage:
      'https://plus.unsplash.com/premium_photo-1699976106481-02baab9811da?fm=jpg&q=85&w=1400&auto=format&fit=crop',
    aliases: ['low-gi', 'diabetes', 'diabetes-friendly'],
  },
  {
    id: 'heart-health',
    slug: 'heart-health',
    title: 'Heart Health',
    tag: 'HEART',
    icon: 'heart',
    subtitle: 'Potassium rich mixes',
    heroEyebrow: 'CARDIOVASCULAR VITALITY · HEART HEALTH',
    heroTitle: 'Potassium and bio-active nitrates for healthy circulation.',
    heroSubtitle:
      'Naturally support vascular elasticity, balanced blood pressure, and cardiovascular health with fresh shoots rich in chlorophyll, potassium, and polyphenols.',
    heroImage:
      'https://images.unsplash.com/photo-1647613233075-e0d5546b0f22?fm=jpg&q=85&w=1400&auto=format&fit=crop',
    aliases: ['heart', 'heart-health'],
  },
  {
    id: 'healthy-aging',
    slug: 'healthy-aging',
    title: 'Healthy Aging',
    tag: 'AGING',
    icon: 'sparkles',
    subtitle: 'Antioxidant dense trays',
    heroEyebrow: 'CELLULAR LONGEVITY · HEALTHY AGING',
    heroTitle: 'Combat oxidative stress and support youthful cellular vitality.',
    heroSubtitle:
      'Up to 40x the antioxidant density of mature vegetables. Potent sulforaphane, lutein, and glutathione precursors that nourish longevity and cellular repair from within.',
    heroImage:
      'https://plus.unsplash.com/premium_photo-1675368982408-ee5a9e0fab6c?fm=jpg&q=85&w=1400&auto=format&fit=crop',
    aliases: ['aging', 'healthy-aging'],
  },
  {
    id: 'all-trays',
    slug: 'all-trays',
    title: 'All Trays',
    tag: 'ALL',
    icon: 'sprout',
    subtitle: 'Every variety we grow',
    heroEyebrow: 'FULL CELLULAR SPECTRUM · ALL TRAYS',
    heroTitle: 'Every variety harvested on the morning of delivery.',
    heroSubtitle:
      'Browse our complete fresh microgreen lineup. Grown with 100% mineral RO water and zero pesticides on vertical indoor climate racks.',
    heroImage:
      'https://plus.unsplash.com/premium_photo-1661635029307-2183e966e5a8?fm=jpg&q=85&w=1400&auto=format&fit=crop',
    aliases: ['all', 'all-trays'],
  },
];

export function getHealthGoalBySlug(slug: string): HealthGoal | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  return HEALTH_GOALS.find(
    (g) => g.slug === clean || g.aliases.includes(clean)
  );
}

export function isValidHealthGoal(id: string): boolean {
  return HEALTH_GOALS.some((g) => g.id === id || g.slug === id);
}
