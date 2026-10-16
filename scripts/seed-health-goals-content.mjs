import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

const blocks = [
  // Hero
  { key: 'health_goals_eyebrow', value: 'TARGETED NUTRITION · LIVING HARVEST', value_type: 'text' },
  { key: 'health_goals_hero_title', value: 'Shop microgreens by *health goal.*', value_type: 'text' },
  {
    key: 'health_goals_hero_subtitle',
    value: 'Living microgreen varieties curated for specific physiological goals. Cut fresh to order on harvest morning for maximum cellular potency.',
    value_type: 'textarea',
  },
  {
    key: 'health_goals_hero_image_url',
    value: 'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=jpg&q=85&w=1600&auto=format&fit=crop',
    value_type: 'image_url',
  },

  // Empty state
  {
    key: 'empty_goal_message',
    value: 'No products currently assigned to this health goal. Check back soon!',
    value_type: 'text',
  },

  // Trust section
  {
    key: 'trust_background_image',
    value: 'https://images.unsplash.com/photo-1540073280202-6e5c781befec?fm=jpg&q=85&w=1600&auto=format&fit=crop',
    value_type: 'image_url',
  },
  { key: 'trust_title', value: 'Each tray harvested,\nnear you.', value_type: 'text' },
  { key: 'trust_tagline', value: 'Grown 10 min away. Cut to order.', value_type: 'text' },
  { key: 'trust_bullet_1', value: 'Harvested the day you order, never pulled from cold storage.', value_type: 'text' },
  { key: 'trust_bullet_2', value: 'Zero pesticides, ever. Grown indoors on soil-free racks.', value_type: 'text' },
  { key: 'trust_bullet_3', value: 'Non-GMO seeds only, sourced and verified before sowing.', value_type: 'text' },
  { key: 'trust_bullet_4', value: 'Zero days in transit, harvested fresh on the morning of delivery.', value_type: 'text' },
  { key: 'trust_bullet_5', value: 'You can come see the racks your greens grew on.', value_type: 'text' },

  // Why choose
  { key: 'why_choose_title', value: 'Why is this the right choice for you?', value_type: 'text' },

  // Reviews
  { key: 'reviews_title', value: 'Straight from the gut.', value_type: 'text' },

  // Sampler banner
  { key: 'sampler_banner_title', value: 'New to microgreens?', value_type: 'text' },
  {
    key: 'sampler_banner_subtitle',
    value: 'Start small. One sampler tray, different ways to use it, zero commitment.',
    value_type: 'textarea',
  },
  { key: 'sampler_banner_cta_text', value: 'Try the sampler pack →', value_type: 'text' },
  { key: 'sampler_banner_link', value: '/products/classic-trio-bundle', value_type: 'text' },
  {
    key: 'sampler_slice_image_1',
    value: 'https://images.pexels.com/photos/8515766/pexels-photo-8515766.jpeg?auto=compress&cs=tinysrgb&w=1600',
    value_type: 'image_url',
  },
  {
    key: 'sampler_slice_image_2',
    value: 'https://images.pexels.com/photos/30270630/pexels-photo-30270630.jpeg?auto=compress&cs=tinysrgb&w=1600',
    value_type: 'image_url',
  },
  {
    key: 'sampler_slice_image_3',
    value: 'https://images.pexels.com/photos/27400770/pexels-photo-27400770.jpeg?auto=compress&cs=tinysrgb&w=1600',
    value_type: 'image_url',
  },
  {
    key: 'sampler_slice_image_4',
    value: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=1600&auto=format&fit=crop',
    value_type: 'image_url',
  },
  {
    key: 'sampler_slice_image_5',
    value: 'https://images.pexels.com/photos/27969848/pexels-photo-27969848.jpeg?auto=compress&cs=tinysrgb&w=1600',
    value_type: 'image_url',
  },

  // FAQ
  { key: 'faq_title', value: 'Frequently Asked Questions', value_type: 'text' },
  { key: 'faq_q1', value: 'How fresh are the greens when they arrive?', value_type: 'text' },
  {
    key: 'faq_a1',
    value: 'Every tray is cut after you place your order, not pulled from cold storage. Most orders reach you within a few hours of harvest, freshly packed for peak vitality.',
    value_type: 'textarea',
  },
  { key: 'faq_q2', value: 'How long do they stay fresh at home?', value_type: 'text' },
  {
    key: 'faq_a2',
    value: "Refrigerated and unwashed, most varieties hold up well for 5–7 days. We'll include specific care instructions with every order.",
    value_type: 'textarea',
  },
  { key: 'faq_q3', value: 'Are these actually pesticide-free?', value_type: 'text' },
  {
    key: 'faq_a3',
    value: "Yes, grown indoors on soil-free racks, with nothing sprayed at any stage. We're working toward publishing third-party lab results as we scale.",
    value_type: 'textarea',
  },
  { key: 'faq_q4', value: 'How is delivery handled?', value_type: 'text' },
  {
    key: 'faq_a4',
    value: 'We harvest on schedule so every fresh tray reaches your doorstep fresh within hours of harvest.',
    value_type: 'textarea',
  },
  { key: 'faq_q5', value: 'Can restaurants order in bulk?', value_type: 'text' },
  {
    key: 'faq_a5',
    value: 'Yes, we supply top restaurants in Tricity with weekly recurring fresh harvests. Drop us an inquiry through our contact form.',
    value_type: 'textarea',
  },

  // Newsletter
  { key: 'newsletter_title', value: 'Want 15% off and the inside scoop?', value_type: 'text' },
  {
    key: 'newsletter_subtitle',
    value: 'Get 15% off your first order, plus early access to new varieties, growing tips and exclusive seasonal drops.',
    value_type: 'textarea',
  },
  { key: 'newsletter_button_text', value: 'Sign Up', value_type: 'text' },
  { key: 'newsletter_placeholder', value: 'your@email.com', value_type: 'text' },
  { key: 'newsletter_disclaimer', value: 'No spam. Unsubscribe anytime.', value_type: 'text' },
];

async function seed() {
  console.log(`Seeding ${blocks.length} content blocks for page 'health-goals'...`);

  for (const block of blocks) {
    await sql`
      INSERT INTO content_blocks (page, key, value, value_type, updated_at)
      VALUES ('health-goals', ${block.key}, ${block.value}, ${block.value_type}, now())
      ON CONFLICT (page, key)
      DO NOTHING
    `;
  }

  const countRes = await sql`
    SELECT COUNT(*) as count FROM content_blocks WHERE page = 'health-goals'
  `;
  console.log(`Done! Total content_blocks for 'health-goals':`, countRes[0].count);
}

seed().catch((err) => {
  console.error('Error seeding health-goals content blocks:', err);
  process.exit(1);
});
