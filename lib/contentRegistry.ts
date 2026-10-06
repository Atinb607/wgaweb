export interface ContentFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image_url' | 'recipe_select' | 'product_select' | 'mascot_select';
  defaultValue: string;
  description?: string;
}

export const CONTENT_REGISTRY: Record<string, ContentFieldDef[]> = {
  homepage: [
    {
      key: 'hero_eyebrow',
      label: 'Hero Eyebrow / Pill',
      type: 'text',
      defaultValue: 'Grown Locally · Delivered Fresh Daily',
    },
    {
      key: 'hero_title',
      label: 'Hero Headline',
      type: 'text',
      defaultValue: "Let's Eat Well.",
    },
    {
      key: 'hero_subtitle',
      label: 'Hero Subtitle',
      type: 'textarea',
      defaultValue:
        'Non GMO seeds. Mineral water. Coco peat. Clean air.\n100% pesticide free. Absolutely nothing else.',
    },
    {
      key: 'hero_trust_text',
      label: 'Hero Trust Line / Social Proof',
      type: 'text',
      defaultValue:
        'Join over 1000+ families eating fresh microgreens daily',
    },
    {
      key: 'hero_image_url',
      label: 'Hero Background Image',
      type: 'image_url',
      defaultValue: '',
      description: 'Upload a custom photo for the homepage hero background. Click Remove to delete or clear it anytime.',
    },
    {
      key: 'hero_video_url',
      label: 'Hero Background Video (Preferred)',
      type: 'image_url',
      defaultValue: '',
      description: 'Upload a video for the homepage hero background. When uploaded, this video takes top priority over the background photo. Autoplay, muted, loop. Click Remove to delete it anytime.',
    },
    {
      key: 'why_badge',
      label: 'Why Microgreens Badge',
      type: 'text',
      defaultValue: '🔬 The Actual Data',
    },
    {
      key: 'why_title',
      label: 'Why Microgreens Section Title',
      type: 'text',
      defaultValue: 'Why microgreens?',
    },
    {
      key: 'why_headline',
      label: 'Why Microgreens Callout Headline',
      type: 'text',
      defaultValue: 'Day 10 beats day 30.',
    },
    {
      key: 'why_body_1',
      label: 'Why Microgreens Paragraph 1',
      type: 'textarea',
      defaultValue:
        "Nutrients don't wait around. The moment a vegetable is cut, its vitamin content starts to fall, sitting in trucks, warehouses, and shop shelves for days before it reaches you.",
    },
    {
      key: 'why_quote',
      label: 'Why Microgreens Quote Callout',
      type: 'textarea',
      defaultValue:
        'We harvest at the exact peak of density, ten days in, then it comes straight to your door, still breathing.',
    },
    {
      key: 'why_body_2',
      label: 'Why Microgreens Paragraph 2',
      type: 'textarea',
      defaultValue:
        'A single tray of broccoli microgreens can carry many times the vitamin C and antioxidant load of the mature vegetable, by weight.*',
    },
    {
      key: 'why_cta_text',
      label: 'Why Microgreens CTA Button',
      type: 'text',
      defaultValue: 'Pathshala →',
    },
    {
      key: 'why_image',
      label: 'Why Microgreens Section Image',
      type: 'image_url',
      defaultValue: '',
      description: 'Optional image to show in the "Day X beats Day Y" section alongside the data chart.',
    },
    {
      key: 'goals_badge',
      label: 'Health Goals Section Badge',
      type: 'text',
      defaultValue: '🎯 Find Your Fit',
    },
    {
      key: 'goals_title',
      label: 'Health Goals Section Title',
      type: 'text',
      defaultValue: 'Shop by health goal.',
    },
    {
      key: 'recipes_badge',
      label: 'Recipe Khazana Badge',
      type: 'text',
      defaultValue: '🍽️ Recipe Khazana',
    },
    {
      key: 'recipes_subtitle',
      label: 'Recipe Khazana Subtitle',
      type: 'text',
      defaultValue: 'Good for you. Easy for you. Delicious for you.',
    },
    {
      key: 'recipes_title',
      label: 'Recipe Khazana Headline',
      type: 'text',
      defaultValue: 'Sneak greens into your meals.',
    },
    {
      key: 'recipes_pinned_1',
      label: 'Featured Recipe 01 (Recipe 01 / 02)',
      type: 'recipe_select',
      defaultValue: 'pea-shoot-citrus-summer-salad',
      description: 'Select the 1st recipe displayed as Recipe 01 / 02 in homepage Recipe Khazana.',
    },
    {
      key: 'recipes_pinned_2',
      label: 'Featured Recipe 02 (Recipe 02 / 02)',
      type: 'recipe_select',
      defaultValue: 'crispy-broccoli-microgreen-toast',
      description: 'Select the 2nd recipe displayed as Recipe 02 / 02 in homepage Recipe Khazana.',
    },
    {
      key: 'recipes_bg_image',
      label: 'Recipe Khazana Background Image',
      type: 'image_url',
      defaultValue: '',
      description: 'Background image for the Recipe Khazana section.',
    },
    {
      key: 'recipes_cta_text',
      label: 'Recipe Khazana CTA Button',
      type: 'text',
      defaultValue: 'The Recipe Khazana →',
    },
    {
      key: 'story_eyebrow',
      label: 'Story Section Eyebrow',
      type: 'text',
      defaultValue: 'The Long Story',
    },
    {
      key: 'story_title',
      label: 'Story Section Headline',
      type: 'text',
      defaultValue: 'From a small idea to a healthier tomorrow.',
    },
    {
      key: 'story_body',
      label: 'Story Section Body',
      type: 'textarea',
      defaultValue:
        "We started with a simple question: why is it so hard to eat truly fresh, nutrient dense greens in our busy urban lives?\n\nThat question led us to microgreens. To science. To clean growing. To long nights perfecting our system. And today, to your table.\n\nWe're not just growing greens. We're growing a movement for real food, real nutrition, and real change.",
    },
    {
      key: 'story_cta_text',
      label: 'Story Section CTA Button',
      type: 'text',
      defaultValue: 'Our Story →',
    },
    {
      key: 'final_cta_title',
      label: 'Final CTA Headline',
      type: 'text',
      defaultValue: 'Join the revolution. Live healthily.',
    },
    {
      key: 'final_cta_subtitle',
      label: 'Final CTA Subtitle',
      type: 'text',
      defaultValue: 'One tray at a time, grown ten minutes from your kitchen.',
    },
    {
      key: 'homepage_partner_logos_enabled',
      label: 'Partner Logos Section Enabled (true/false)',
      type: 'text',
      defaultValue: 'true',
      description: 'Set to "true" to show the Partner Logos section on the homepage, or "false" to hide it.',
    },
    {
      key: 'homepage_partner_logos_eyebrow',
      label: 'Partner Logos Eyebrow',
      type: 'text',
      defaultValue: 'TRUSTED BY',
      description: 'Small text displayed above the partner logos headline.',
    },
    {
      key: 'homepage_partner_logos_title',
      label: 'Partner Logos Headline',
      type: 'text',
      defaultValue: 'Leading organizations choose wild about greens.',
      description: 'Main heading for the partner logos section.',
    },
  ],

  'product-listing': [
    {
      key: 'hero_eyebrow',
      label: 'Hero Eyebrow / Pill',
      type: 'text',
      defaultValue: '🌱 FRESH HARVEST · HARVESTED TO ORDER',
    },
    {
      key: 'hero_title',
      label: 'Hero Headline',
      type: 'text',
      defaultValue: 'Cut to order, delivered still breathing.',
    },
    {
      key: 'hero_subtitle',
      label: 'Hero Subtitle',
      type: 'textarea',
      defaultValue:
        'Fresh microgreen trays delivered on harvest morning to your doorstep. Snip fresh into your daily meals for up to 10 days.',
    },
    {
      key: 'hero_image_url',
      label: 'Hero Banner Image',
      type: 'image_url',
      defaultValue: '',
      description: 'Right column photo for the product catalog hero section.',
    },
    {
      key: 'salad_greens_title',
      label: 'Salad Greens Category Title',
      type: 'text',
      defaultValue: 'SALAD GREENS',
    },
    {
      key: 'salad_greens_desc',
      label: 'Salad Greens Category Description',
      type: 'textarea',
      defaultValue:
        'Crunchy, peppery, fresh shoots harvested at peak biological density. Keep on your counter for 7 to 10 days fresh.',
    },
    {
      key: 'samplers_title',
      label: 'Samplers & Bundles Category Title',
      type: 'text',
      defaultValue: 'SAMPLERS & BUNDLES',
    },
    {
      key: 'samplers_desc',
      label: 'Samplers & Bundles Category Description',
      type: 'textarea',
      defaultValue:
        'Experience the full spectrum of cellular nutrition. Three signature fresh varieties delivered together at special bundle pricing.',
    },
    {
      key: 'trust_title',
      label: 'Trust Hero Headline',
      type: 'text',
      defaultValue: 'Each tray harvested,\nnear you.',
    },
    {
      key: 'trust_tagline',
      label: 'Trust Hero Handwritten Tagline',
      type: 'text',
      defaultValue: 'Grown 10 min away. Cut to order.',
    },
    {
      key: 'trust_bullet_1',
      label: 'Trust Hero Bullet 1',
      type: 'text',
      defaultValue: 'Harvested the day you order, never pulled from cold storage.',
    },
    {
      key: 'trust_bullet_2',
      label: 'Trust Hero Bullet 2',
      type: 'text',
      defaultValue: 'Zero pesticides, ever. Grown indoors on soil-free racks.',
    },
    {
      key: 'trust_bullet_3',
      label: 'Trust Hero Bullet 3',
      type: 'text',
      defaultValue: 'Non-GMO seeds only, sourced and verified before sowing.',
    },
    {
      key: 'trust_bullet_4',
      label: 'Trust Hero Bullet 4',
      type: 'text',
      defaultValue: 'Zero days in transit, harvested fresh on the morning of delivery.',
    },
    {
      key: 'trust_bullet_5',
      label: 'Trust Hero Bullet 5',
      type: 'text',
      defaultValue: 'You can come see the racks your greens grew on.',
    },
    {
      key: 'why_choose_title',
      label: 'Why Choose Us Title',
      type: 'text',
      defaultValue: 'Why is this the right choice for you?',
    },
    {
      key: 'reviews_title',
      label: 'Reviews Section Title',
      type: 'text',
      defaultValue: 'Straight from the gut.',
    },
    {
      key: 'sampler_banner_title',
      label: 'Sampler Banner Title',
      type: 'text',
      defaultValue: 'New to microgreens?',
    },
    {
      key: 'sampler_banner_subtitle',
      label: 'Sampler Banner Subtitle',
      type: 'textarea',
      defaultValue:
        'Start small. One sampler tray, different ways to use it, zero commitment.',
    },
    {
      key: 'sampler_banner_cta_text',
      label: 'Sampler Banner CTA Text',
      type: 'text',
      defaultValue: 'Try the sampler pack →',
    },
    {
      key: 'faq_title',
      label: 'FAQ Section Title',
      type: 'text',
      defaultValue: 'Frequently Asked Questions',
    },
    {
      key: 'faq_q1',
      label: 'FAQ Question 1',
      type: 'text',
      defaultValue: 'How fresh are the greens when they arrive?',
    },
    {
      key: 'faq_a1',
      label: 'FAQ Answer 1',
      type: 'textarea',
      defaultValue:
        'Every tray is cut after you place your order, not pulled from cold storage. Most orders reach your doorstep freshly packed for peak vitality.',
    },
    {
      key: 'faq_q2',
      label: 'FAQ Question 2',
      type: 'text',
      defaultValue: 'How long do they stay fresh at home?',
    },
    {
      key: 'faq_a2',
      label: 'FAQ Answer 2',
      type: 'textarea',
      defaultValue:
        "Refrigerated and unwashed, most varieties hold up well for 5–7 days. We'll include specific care instructions with every order.",
    },
    {
      key: 'faq_q3',
      label: 'FAQ Question 3',
      type: 'text',
      defaultValue: 'Are these actually pesticide-free?',
    },
    {
      key: 'faq_a3',
      label: 'FAQ Answer 3',
      type: 'textarea',
      defaultValue:
        "Yes, grown indoors on soil-free racks, with nothing sprayed at any stage. We're working toward publishing third-party lab results as we scale.",
    },
    {
      key: 'faq_q4',
      label: 'FAQ Question 4',
      type: 'text',
      defaultValue: 'How is delivery handled?',
    },
    {
      key: 'faq_a4',
      label: 'FAQ Answer 4',
      type: 'textarea',
      defaultValue:
        'We harvest on schedule so every fresh tray reaches your doorstep within hours of harvest.',
    },
    {
      key: 'faq_q5',
      label: 'FAQ Question 5',
      type: 'text',
      defaultValue: 'Can restaurants order in bulk?',
    },
    {
      key: 'faq_a5',
      label: 'FAQ Answer 5',
      type: 'textarea',
      defaultValue:
        'Yes, reach out via our restaurants page for standing orders and bulk pricing.',
    },
    {
      key: 'newsletter_title',
      label: 'Newsletter Banner Title / Headline',
      type: 'text',
      defaultValue: 'Want 15% off and the inside scoop?',
      description: 'Main headline. Tip: wrap words in *asterisks* (e.g. *inside scoop?*) to highlight them in lime green italics.',
    },
    {
      key: 'newsletter_subtitle',
      label: 'Newsletter Banner Subtitle / Description',
      type: 'textarea',
      defaultValue:
        'Get 15% off your first order, plus early access to new varieties, growing tips and exclusive seasonal drops.',
    },
    {
      key: 'newsletter_button_text',
      label: 'Newsletter Button Label',
      type: 'text',
      defaultValue: 'Sign Up',
      description: 'Call-to-action text on the subscribe button.',
    },
    {
      key: 'newsletter_placeholder',
      label: 'Newsletter Email Placeholder',
      type: 'text',
      defaultValue: 'your@email.com',
      description: 'Placeholder text shown inside the email input field.',
    },
    {
      key: 'newsletter_disclaimer',
      label: 'Newsletter Disclaimer Note',
      type: 'text',
      defaultValue: 'No spam. Unsubscribe anytime.',
      description: 'Reassurance note displayed underneath the form.',
    },
  ],

  'product-detail': [
    {
      key: 'bundle_banner_title',
      label: 'Trio Bundle Banner Title',
      type: 'text',
      defaultValue: 'Go For All Three',
    },
    {
      key: 'bundle_banner_subtitle',
      label: 'Trio Bundle Banner Subtitle',
      type: 'textarea',
      defaultValue:
        'Broccoli for sulforaphane, Radish for spice and zinc, Sunflower shoots for protein and crunch. Get our signature 3-tray variety pack delivered together.',
    },
    {
      key: 'bundle_banner_image',
      label: 'Trio Bundle Banner Image',
      type: 'image_url',
      defaultValue: '',
      description: 'Media image for the Trio bundle promo banner.',
    },
    {
      key: 'bundle_banner_cta_text',
      label: 'Trio Bundle Banner CTA Button',
      type: 'text',
      defaultValue: 'Try the Hat Trick Pack →',
    },
    {
      key: 'stats_banner_title',
      label: 'Nutrient Stats Banner Title',
      type: 'text',
      defaultValue: 'Tiny leaves, massive impact.',
    },
    {
      key: 'stats_banner_subtitle',
      label: 'Nutrient Stats Banner Subtitle',
      type: 'textarea',
      defaultValue:
        'Because microgreens are harvested just after the cotyledon leaves emerge, all the energy concentrated in the seed is available right in the young shoot.',
    },
    {
      key: 'stats_banner_image',
      label: 'Nutrient Stats Banner Image',
      type: 'image_url',
      defaultValue: '',
      description: 'Media image for the Nutrient Stats section.',
    },
    {
      key: 'stats_item_1_number',
      label: 'Nutrient Stat 1 — Value / Metric',
      type: 'text',
      defaultValue: '+1500%',
      description: 'First stat metric or percentage, e.g. +1500%',
    },
    {
      key: 'stats_item_1_text',
      label: 'Nutrient Stat 1 — Description',
      type: 'text',
      defaultValue: 'Sulforaphane concentration compared to full-grown broccoli',
      description: 'Description text next to Stat 1.',
    },
    {
      key: 'stats_item_2_number',
      label: 'Nutrient Stat 2 — Value / Metric',
      type: 'text',
      defaultValue: '+400%',
      description: 'Second stat metric or percentage, e.g. +400%',
    },
    {
      key: 'stats_item_2_text',
      label: 'Nutrient Stat 2 — Description',
      type: 'text',
      defaultValue: 'Bioavailable Vitamin C and beta-carotene per gram of greens',
      description: 'Description text next to Stat 2.',
    },
    {
      key: 'stats_item_3_number',
      label: 'Nutrient Stat 3 — Value / Metric',
      type: 'text',
      defaultValue: '+600%',
      description: 'Third stat metric or percentage, e.g. +600%',
    },
    {
      key: 'stats_item_3_text',
      label: 'Nutrient Stat 3 — Description',
      type: 'text',
      defaultValue: 'Antioxidant capacity (ORAC value) protecting cells against oxidative stress',
      description: 'Description text next to Stat 3.',
    },
    {
      key: 'reasons_title',
      label: 'Six Reasons Section Title',
      type: 'text',
      defaultValue: 'Six reasons why we grow this way.',
    },
    {
      key: 'reasons_subtitle',
      label: 'Six Reasons Section Subtitle',
      type: 'text',
      defaultValue: 'Clean agriculture engineered for urban nutrition.',
    },
    {
      key: 'reviews_title',
      label: 'Customer Reviews Section Title',
      type: 'text',
      defaultValue: 'Straight from the gut.',
    },
    {
      key: 'reviews_subtitle',
      label: 'Customer Reviews Section Subtitle',
      type: 'text',
      defaultValue: 'Verified reviews from our community',
    },
  ],

  'our-story': [
    {
      key: 'hero_eyebrow',
      label: 'Hero Eyebrow / Pill',
      type: 'text',
      defaultValue: 'Our Mission',
    },
    {
      key: 'hero_title',
      label: 'Hero Headline',
      type: 'text',
      defaultValue: 'Helping India rediscover the power of fresh food',
    },
    {
      key: 'hero_cta_text',
      label: 'Hero CTA Button',
      type: 'text',
      defaultValue: 'Know More →',
    },
    {
      key: 'movement_title',
      label: 'Movement Section Title',
      type: 'text',
      defaultValue: "We're leading a movement to reimagine healthier living",
    },
    {
      key: 'movement_body',
      label: 'Movement Section Body',
      type: 'textarea',
      defaultValue:
        "Every tray we grow represents a simple belief: healthy food shouldn't be complicated. It shouldn't be expensive. And it certainly shouldn't feel like a luxury. Our goal is to help families make one small decision every day that leads to a healthier tomorrow.",
    },
    {
      key: 'story_eyebrow',
      label: 'Story Section Eyebrow',
      type: 'text',
      defaultValue: 'Our Story',
    },
    {
      key: 'story_title',
      label: 'Story Section Headline',
      type: 'text',
      defaultValue:
        "We have a different relationship with food and we're out to change yours",
    },
    {
      key: 'story_image_1',
      label: 'Our Story Photo 1 (Left)',
      type: 'image_url',
      defaultValue: '',
      description: 'First image in the diagonal slice collage of the Our Story section.',
    },
    {
      key: 'story_image_2',
      label: 'Our Story Photo 2 (Middle)',
      type: 'image_url',
      defaultValue: '',
      description: 'Second image in the diagonal slice collage of the Our Story section.',
    },
    {
      key: 'story_image_3',
      label: 'Our Story Photo 3 (Right)',
      type: 'image_url',
      defaultValue: '',
      description: 'Third image in the diagonal slice collage of the Our Story section.',
    },
    {
      key: 'journey_title',
      label: 'Journey Section Title',
      type: 'text',
      defaultValue:
        'Our journey began with a simple question: why has eating healthy become so difficult?',
    },
    {
      key: 'journey_body',
      label: 'Journey Section Body',
      type: 'textarea',
      defaultValue:
        "And then we discovered the extraordinary nutritional power of microgreens, and we realized something surprising. Nature had already created one of the most nutrient-rich foods. Most people had simply never experienced it. That realization became our purpose. Sometimes the smallest ingredients can create the biggest impact. Adding one handful of fresh greens to today's meal is enough to begin.",
    },
    {
      key: 'belief_eyebrow',
      label: 'Belief Section Eyebrow',
      type: 'text',
      defaultValue: 'Our Belief',
    },
    {
      key: 'belief_title',
      label: 'Belief Section Headline',
      type: 'text',
      defaultValue: 'We believe food should look alive, taste alive, and nourish life.',
    },
    {
      key: 'belief_image',
      label: 'Belief Section Image',
      type: 'image_url',
      defaultValue: '',
      description: 'Right photo for the Our Belief section.',
    },
    {
      key: 'principles_title',
      label: 'Principles Section Title',
      type: 'text',
      defaultValue: 'Every tray we harvest is a reminder of why we began.',
    },
    {
      key: 'sampler_banner_title',
      label: 'Sampler Pack Banner Title',
      type: 'text',
      defaultValue: 'New to microgreens?',
    },
    {
      key: 'sampler_banner_subtitle',
      label: 'Sampler Pack Banner Subtitle',
      type: 'textarea',
      defaultValue:
        'Start small. One sampler tray, different ways to use it, zero commitment.',
    },
    {
      key: 'sampler_banner_cta_text',
      label: 'Sampler Pack CTA Button',
      type: 'text',
      defaultValue: 'Try the sampler pack →',
    },
    {
      key: 'newsletter_title',
      label: 'Newsletter Section Title / Headline',
      type: 'text',
      defaultValue: 'Want 15% off and the inside scoop?',
      description: 'Main headline. Tip: wrap words in *asterisks* (e.g. *inside scoop?*) to highlight them in lime green italics.',
    },
    {
      key: 'newsletter_subtitle',
      label: 'Newsletter Section Subtitle / Description',
      type: 'textarea',
      defaultValue:
        'Get 15% off your first order, plus early access to new varieties, growing tips and exclusive seasonal drops.',
    },
    {
      key: 'newsletter_button_text',
      label: 'Newsletter Button Label',
      type: 'text',
      defaultValue: 'Sign Up',
      description: 'Call-to-action text on the subscribe button.',
    },
    {
      key: 'newsletter_placeholder',
      label: 'Newsletter Email Placeholder',
      type: 'text',
      defaultValue: 'your@email.com',
      description: 'Placeholder text shown inside the email input field.',
    },
    {
      key: 'newsletter_disclaimer',
      label: 'Newsletter Disclaimer Note',
      type: 'text',
      defaultValue: 'No spam. Unsubscribe anytime.',
      description: 'Reassurance note displayed underneath the form.',
    },
  ],
  'emails': [
    // Order Confirmation (Resend)
    {
      key: 'order_confirmation_subject',
      label: 'Order Confirmation Email Subject',
      type: 'text',
      defaultValue: 'Wild About Greens: Order #{order_number} Confirmed! 🌱',
      description: 'Subject line for the order confirmation email. Supports {order_number} and {customer_name}.',
    },
    {
      key: 'order_confirmation_heading',
      label: 'Order Confirmation Greeting / Heading',
      type: 'text',
      defaultValue: 'Thanks for your order, {customer_name}!',
      description: 'Main greeting at top of the order confirmation email.',
    },
    {
      key: 'order_confirmation_intro',
      label: 'Order Confirmation Introductory Message',
      type: 'textarea',
      defaultValue: "We've received your order and payment. Our urban farm team will harvest and prepare your microgreens fresh for delivery.",
      description: 'Paragraph shown above the order number and items table.',
    },
    {
      key: 'order_confirmation_footer',
      label: 'Order Confirmation Support & Footer Note',
      type: 'textarea',
      defaultValue: 'Questions about your delivery? Reply directly to this email or reach us on WhatsApp. Thank you for supporting sustainable urban farming!',
      description: 'Note shown at the bottom of the email above the brand footer.',
    },

    // Newsletter Signup (Resend)
    {
      key: 'newsletter_thankyou_subject',
      label: 'Newsletter Welcome Email Subject',
      type: 'text',
      defaultValue: 'Welcome to Wild About Greens! 🌱',
      description: 'Subject line for the welcome email sent after newsletter signup.',
    },
    {
      key: 'newsletter_thankyou_heading',
      label: 'Newsletter Welcome Greeting / Heading',
      type: 'text',
      defaultValue: 'Welcome to the Wild About Greens Family!',
      description: 'Main greeting at top of the newsletter welcome email.',
    },
    {
      key: 'newsletter_thankyou_body',
      label: 'Newsletter Welcome Email Body',
      type: 'textarea',
      defaultValue: "Hi there!\n\nWelcome to Wild About Greens, we're thrilled to have you with us. 🌱\n\nHere is your exclusive 15% discount for your first order: USE CODE: WELCOME15\n\nStay fresh,\nThe Wild About Greens Team",
      description: 'Body content for the welcome email. Use plain text with line breaks.',
    },
    {
      key: 'newsletter_thankyou_footer',
      label: 'Newsletter Welcome Footer Note',
      type: 'textarea',
      defaultValue: 'Fresh harvest delivered straight from our indoor farm to your doorstep.',
      description: 'Footer text displayed at the bottom of the welcome email.',
    },
  ],
  'recipes': [
    {
      key: 'hero_image_url',
      label: 'Hero Banner Image (Full-Width Panoramic)',
      type: 'image_url',
      defaultValue: '',
      description: 'Upload a wide edge-to-edge panoramic food banner photo (~1920x600px recommended) for the Recipes page. Displayed full-bleed with no overlay text.',
    },
    {
      key: 'hero_title',
      label: 'Page Heading',
      type: 'text',
      defaultValue: 'All Recipes',
      description: 'Page title displayed centered in crisp uppercase tracked editorial styling below the banner.',
    },
    {
      key: 'hero_subtitle',
      label: 'Page Subtitle (Optional)',
      type: 'textarea',
      defaultValue: 'Explore delicious and nutritious recipes crafted with fresh microgreens.',
      description: 'Optional short introductory subtitle displayed centered below the heading.',
    },
  ],
  'recipe': [
    {
      key: 'hero_image_url',
      label: 'Hero Banner Image (Full-Width Panoramic)',
      type: 'image_url',
      defaultValue: '',
      description: 'Upload a wide edge-to-edge panoramic food banner photo (~1920x600px recommended) for the Recipe page. Displayed full-bleed with no overlay text.',
    },
    {
      key: 'hero_title',
      label: 'Page Heading',
      type: 'text',
      defaultValue: 'All Recipes',
      description: 'Page title displayed centered in crisp uppercase tracked editorial styling below the banner.',
    },
    {
      key: 'hero_subtitle',
      label: 'Page Subtitle (Optional)',
      type: 'textarea',
      defaultValue: 'Explore delicious and nutritious recipes crafted with fresh microgreens.',
      description: 'Optional short introductory subtitle displayed centered below the heading.',
    },
  ],
  'recipe-khazana': [
    {
      key: 'hero_image_url',
      label: 'Hero Banner Image (Full-Width Panoramic)',
      type: 'image_url',
      defaultValue: '',
      description: 'Upload a wide edge-to-edge panoramic food banner photo (~1920x600px recommended) for the Recipe Khazana page. Displayed full-bleed with no overlay text.',
    },
    {
      key: 'hero_title',
      label: 'Page Heading',
      type: 'text',
      defaultValue: 'All Recipes',
      description: 'Page title displayed centered in crisp uppercase tracked editorial styling below the banner.',
    },
    {
      key: 'hero_subtitle',
      label: 'Page Subtitle (Optional)',
      type: 'textarea',
      defaultValue: 'Explore delicious and nutritious recipes crafted with fresh microgreens.',
      description: 'Optional short introductory subtitle displayed centered below the heading.',
    },
  ],
  'pathshala': [
    {
      key: 'hero_image_url',
      label: 'Hero Banner Image (Full-Width Panoramic)',
      type: 'image_url',
      defaultValue: '',
      description: 'Upload a wide edge-to-edge panoramic banner photo (~1920x600px recommended) for the Pathshala page. Displayed full-bleed with no overlay text.',
    },
    {
      key: 'hero_title',
      label: 'Page Heading',
      type: 'text',
      defaultValue: 'Pathshala',
      description: 'Page title displayed centered in crisp uppercase tracked editorial styling below the banner.',
    },
    {
      key: 'hero_subtitle',
      label: 'Page Subtitle (Optional)',
      type: 'textarea',
      defaultValue: 'Nutritional deep dives, cellular antioxidant science, and insights from our vertical indoor farm.',
      description: 'Optional short introductory subtitle displayed centered below the heading.',
    },
  ],
  'blog': [
    {
      key: 'hero_image_url',
      label: 'Hero Banner Image (Full-Width Panoramic)',
      type: 'image_url',
      defaultValue: '',
      description: 'Upload a wide edge-to-edge panoramic banner photo (~1920x600px recommended) for the Pathshala page. Displayed full-bleed with no overlay text.',
    },
    {
      key: 'hero_title',
      label: 'Page Heading',
      type: 'text',
      defaultValue: 'Pathshala',
      description: 'Page title displayed centered in crisp uppercase tracked editorial styling below the banner.',
    },
    {
      key: 'hero_subtitle',
      label: 'Page Subtitle (Optional)',
      type: 'textarea',
      defaultValue: 'Nutritional deep dives, cellular antioxidant science, and insights from our vertical indoor farm.',
      description: 'Optional short introductory subtitle displayed centered below the heading.',
    },
  ],
  'cart-drawer': [
    {
      key: 'cart_empty_title',
      label: 'Empty Cart Headline',
      type: 'text',
      defaultValue: 'This cart is empty inside!',
      description: 'Main heading displayed when the customer opens an empty cart drawer.',
    },
    {
      key: 'cart_empty_subtitle',
      label: 'Empty Cart Punchline / Humor Text',
      type: 'textarea',
      defaultValue: 'Fill it with fresh greens, before this poor cart decides to compost itself out of pure loneliness.',
      description: 'Quirky cursive humor line displayed below the empty cart cartoon mascot.',
    },
    {
      key: 'cart_mascot_variant',
      label: 'Cartoon Mascot Variation',
      type: 'mascot_select',
      defaultValue: 'pleading',
      description: 'Choose the cartoon character personality displayed in the empty cart drawer.',
    },
    {
      key: 'cart_rec_eyebrow',
      label: 'Recommendations Eyebrow',
      type: 'text',
      defaultValue: 'START WITH',
      description: 'Small uppercase tracking eyebrow above the recommendations title.',
    },
    {
      key: 'cart_rec_title',
      label: 'Recommendations Section Title',
      type: 'text',
      defaultValue: 'Our Bestsellers',
      description: 'Heading for the recommended products carousel inside the cart drawer.',
    },
    {
      key: 'cart_rec_product_1',
      label: 'Recommended Product #1',
      type: 'product_select',
      defaultValue: 'broccoli-microgreens',
      description: 'Select the 1st product to feature in the cart recommendations carousel.',
    },
    {
      key: 'cart_rec_badge_1',
      label: 'Product #1 Custom Badge (Optional Override)',
      type: 'text',
      defaultValue: '',
      description: 'Optional custom badge. If left blank, automatically syncs the badge label from the Products page.',
    },
    {
      key: 'cart_rec_product_2',
      label: 'Recommended Product #2',
      type: 'product_select',
      defaultValue: 'sunflower-microgreens',
      description: 'Select the 2nd product to feature in the cart recommendations carousel.',
    },
    {
      key: 'cart_rec_badge_2',
      label: 'Product #2 Custom Badge (Optional Override)',
      type: 'text',
      defaultValue: '',
      description: 'Optional custom badge. If left blank, automatically syncs the badge label from the Products page.',
    },
    {
      key: 'cart_rec_product_3',
      label: 'Recommended Product #3',
      type: 'product_select',
      defaultValue: 'radish-microgreens',
      description: 'Select the 3rd product to feature in the cart recommendations carousel.',
    },
    {
      key: 'cart_rec_badge_3',
      label: 'Product #3 Custom Badge (Optional Override)',
      type: 'text',
      defaultValue: '',
      description: 'Optional custom badge. If left blank, automatically syncs the badge label from the Products page.',
    },
    {
      key: 'cart_rec_product_4',
      label: 'Recommended Product #4',
      type: 'product_select',
      defaultValue: 'classic-trio-bundle',
      description: 'Select the 4th product to feature in the cart recommendations carousel.',
    },
    {
      key: 'cart_rec_badge_4',
      label: 'Product #4 Custom Badge (Optional Override)',
      type: 'text',
      defaultValue: '',
      description: 'Optional custom badge. If left blank, automatically syncs the badge label from the Products page.',
    },
  ],
  'track-order': [
    {
      key: 'track_eyebrow',
      label: 'Page Pill / Eyebrow',
      type: 'text',
      defaultValue: 'Real-Time Harvest & Delivery Tracking',
      description: 'The small pill badge above the headline on the track order page.',
    },
    {
      key: 'track_title',
      label: 'Page Headline',
      type: 'text',
      defaultValue: 'Track Your Order',
      description: 'Main editorial heading on the track order page.',
    },
    {
      key: 'track_subtitle',
      label: 'Page Subtitle',
      type: 'textarea',
      defaultValue:
        'Enter your order number along with your phone number and email address to view the live harvest and delivery status.',
      description: 'The descriptive sentence under the headline.',
    },
    {
      key: 'track_support_phone',
      label: 'Support Phone / WhatsApp Number',
      type: 'text',
      defaultValue: '+91 98XXXXXXXX',
      description: 'Phone or WhatsApp number displayed in the help and delivery inquiries section.',
    },
    {
      key: 'track_support_email',
      label: 'Support Email Address',
      type: 'text',
      defaultValue: 'hello@wildaboutgreens.com',
      description: 'Contact email displayed in the customer help section.',
    },
    {
      key: 'track_harvest_note',
      label: 'Harvest Promise Note',
      type: 'text',
      defaultValue: 'Grown with mineral water & clean air · Harvested morning of delivery',
      description: 'Short trust badge displayed on the tracking result card.',
    },
  ],
  'terms-and-conditions': [
    {
      key: 'page_title',
      label: 'Page Title',
      type: 'text',
      defaultValue: 'Terms & Conditions',
      description: 'Main heading displayed at the top left of the page.',
    },
    {
      key: 'doc_heading',
      label: 'Document Subheading',
      type: 'text',
      defaultValue: 'TERMS OF SERVICE',
      description: 'Centered uppercase underlined title below the main heading.',
    },
    {
      key: 'preamble',
      label: 'Legal Preamble / Electronic Record Notice',
      type: 'textarea',
      defaultValue:
        'THIS DOCUMENT IS AN ELECTRONIC RECORD IN TERMS OF THE INFORMATION TECHNOLOGY ACT, 2000 AND RULES MADE THEREUNDER. THIS ELECTRONIC RECORD IS GENERATED BY A COMPUTER SYSTEM AND DOES NOT REQUIRE ANY PHYSICAL OR DIGITAL SIGNATURES.',
      description: 'Bold uppercase disclaimer paragraph displayed before the terms.',
    },
    {
      key: 'body_content',
      label: 'Terms & Conditions Content (Markdown / Text)',
      type: 'textarea',
      defaultValue: `OVERVIEW
The domain name https://wildaboutgreens.com/ and its related sub-domains, sites, services, and tools (collectively, "Website") is owned and operated by Wild About Greens. Throughout the Website, the terms "we", "us" and "our" refer to Wild About Greens. We offer this Website, including all information, tools and services available from this Website to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.

By visiting our site and/or purchasing fresh microgreens or subscriptions from us, you engage in our "Service" and agree to be bound by the following terms and conditions ("Terms of Service", "Terms"), including those additional terms and policies referenced herein and/or available by hyperlink.

SECTION 1 - ONLINE STORE TERMS
By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority and have given us your consent to allow any of your minor dependents to use this site.
You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction.

SECTION 2 - GENERAL CONDITIONS & FRESH PRODUCE NATURE
Wild About Greens provides freshly harvested microgreens grown on indoor vertical racks using RO mineral drinking water, clean air, and zero chemical pesticides.
Because microgreens are freshly cut perishable produce with finite shelf life, all orders are harvested and prepared specifically for your scheduled delivery window. Microgreens must be promptly received, unboxed, and stored refrigerated at 4°C–7°C in accordance with provided care instructions.

SECTION 3 - ACCURACY, COMPLETENESS AND TIMELINESS OF INFORMATION
We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary or more timely sources of information. Any reliance on the material on this site is at your own risk.

SECTION 4 - MODIFICATIONS TO THE SERVICE AND PRICES
Prices for our microgreens and subscription bundles are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.

SECTION 5 - PRODUCTS AND HARVEST FULFILLMENT
Certain products or subscription plans may be available exclusively online through the Website. These products may have limited quantities based on our weekly indoor vertical rack capacity.
We reserve the right, but are not obligated, to limit the sales of our products to any person, geographic region or jurisdiction. We fulfill morning deliveries across designated serviceable pin codes only.

SECTION 6 - ACCURACY OF BILLING AND ACCOUNT INFORMATION
We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. In the event that we make a change to or cancel an order, we will attempt to notify you by contacting the e-mail, billing address, or phone number provided at the time the order was made.
Payments are processed securely via RBI-licensed payment gateways (Razorpay). We do not store credit card, debit card, or UPI credentials on our servers.

SECTION 7 - RETURNS, REFUNDS AND CANCELLATIONS
Due to the perishable nature of fresh microgreens, returns, replacements, and refunds are governed strictly by our Shipping & Returns Policy:
- Any quality concerns, delivery damages, or missing items must be reported within 24 hours of delivery with photographic evidence.
- Approved claims will receive a fresh replacement tray in our subsequent morning harvest or a full refund back to the original payment source.
- Once harvested or dispatched, orders cannot be cancelled. Subscriptions may be paused or modified with at least 24 hours advance notice before the next scheduled harvest run.

SECTION 8 - LIMITATION OF LIABILITY
In no case shall Wild About Greens, our directors, officers, employees, affiliates, agents, contractors, or suppliers be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, arising from your use of any of the service or any products procured using the service, including improper post-delivery storage or undisclosed individual dietary allergies.

SECTION 9 - INDEMNIFICATION
You agree to indemnify, defend and hold harmless Wild About Greens and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, and employees, harmless from any claim or demand, including reasonable attorneys' fees, made by any third-party due to or arising out of your breach of these Terms of Service or the documents they incorporate by reference, or your violation of any law or the rights of a third-party.

SECTION 10 - SEVERABILITY
In the event that any provision of these Terms of Service is determined to be unlawful, void or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed to be severed from these Terms of Service, such determination shall not affect the validity and enforceability of any other remaining provisions.

SECTION 11 - GOVERNING LAW & JURISDICTION
These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the competent courts in the Tricity area (Chandigarh / Mohali / Panchkula).

SECTION 12 - CONTACT INFORMATION
Questions about the Terms of Service should be sent to us at:
Wild About Greens Customer Care
Email: hello@wildaboutgreens.com
WhatsApp / Phone: +91 98XXXXXXXX
Operating Hours: Monday – Sunday, 7:00 AM – 7:00 PM`,
      description:
        'Full legal content. All-caps lines automatically become bold uppercase underlined section headers. Lines starting with "-" or "*" become bullet points.',
    },
    {
      key: 'last_updated',
      label: 'Last Updated Date',
      type: 'text',
      defaultValue: 'October 2026',
      description: 'Optional date note displayed at the bottom of the page.',
    },
  ],
  'privacy-policy': [
    {
      key: 'page_title',
      label: 'Page Title',
      type: 'text',
      defaultValue: 'Privacy Policy',
      description: 'Main heading displayed at the top left of the page.',
    },
    {
      key: 'doc_heading',
      label: 'Document Subheading',
      type: 'text',
      defaultValue: 'PRIVACY POLICY',
      description: 'Centered uppercase underlined title below the main heading.',
    },
    {
      key: 'preamble',
      label: 'Legal Preamble / Electronic Record Notice',
      type: 'textarea',
      defaultValue:
        'THIS PRIVACY POLICY IS AN ELECTRONIC RECORD UNDER THE INFORMATION TECHNOLOGY ACT, 2000 AND THE RULES MADE THEREUNDER. THIS ELECTRONIC RECORD IS GENERATED BY A COMPUTER SYSTEM AND DOES NOT REQUIRE ANY PHYSICAL OR DIGITAL SIGNATURES.',
      description: 'Bold uppercase disclaimer paragraph displayed before the policy.',
    },
    {
      key: 'body_content',
      label: 'Privacy Policy Content (Markdown / Text)',
      type: 'textarea',
      defaultValue: `OVERVIEW
This Privacy Policy describes how Wild About Greens ("we", "us", or "our") collects, uses, stores, and discloses your personal information when you visit, use our services, or make a purchase from https://wildaboutgreens.com/ (the "Website").
We respect your privacy and are committed to protecting personal data in compliance with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 and other applicable Indian laws.

SECTION 1 - WHAT PERSONAL INFORMATION WE COLLECT
When you visit the Website or place an order for fresh microgreens, we collect certain information to provide and fulfill our services:
- Contact Information: Full name, phone number, and email address.
- Delivery Information: Shipping street address, landmark, and delivery pincode.
- Order History: Varieties selected, tray sizes, subscription frequencies, order dates, and payment identifiers.
- Device & Browser Information: IP address, browser type, operating system, and timestamp logs collected for security and fraud prevention.

SECTION 2 - HOW WE COLLECT INFORMATION
We collect information directly from you when you:
- Place an order or start a subscription on the Website.
- Create an account or sign up for our newsletter.
- Contact customer support via email, phone, or WhatsApp.
- Track an existing harvest order using our order lookup tool.

SECTION 3 - HOW WE USE YOUR PERSONAL INFORMATION
We use your personal information strictly for legitimate business and operational purposes:
- To harvest, pack, and deliver fresh microgreens to your designated address.
- To send transactional order confirmations, harvest schedules, and delivery notifications.
- To process payments securely through certified payment gateways.
- To manage and fulfill recurring weekly subscription schedules.
- To provide customer support, handle replacements, and process refunds.
- To prevent fraudulent transactions and safeguard our store infrastructure.
- To send promotional updates, seasonal recipes, and farming insights (only if you have opted into our newsletter, with a 1-click unsubscribe option in every email).

SECTION 4 - PAYMENT SECURITY
All online payments are securely processed through Razorpay, a PCI-DSS Level 1 compliant, RBI-licensed payment gateway.
Wild About Greens does not capture, store, or process your credit card numbers, debit card details, net banking credentials, or UPI PINs on our servers. All payment information is encrypted and transmitted directly to the payment processor.

SECTION 5 - COOKIES AND LOCAL STORAGE
We use standard cookies and browser local storage strictly for essential store functionality:
- Cart persistence: Remembering your selected trays while you browse.
- Session authentication: Keeping you securely logged in if you hold an account.
- Security tokens: Protecting against Cross-Site Request Forgery (CSRF) and bot attacks via Cloudflare Turnstile.
We do not use invasive tracking cookies or sell your browsing history to third-party data brokers.

SECTION 6 - DISCLOSURE OF YOUR INFORMATION
We never sell, rent, or trade your personal data. We only share information with third-party service providers who assist us in fulfilling orders:
- Logistics & Delivery Partners: To transport morning harvest orders to your doorstep.
- Payment Gateways (Razorpay): To securely authorize transactions.
- Transactional Email Services: To send receipts and tracking notifications.
All third-party partners are bound by strict non-disclosure obligations and are permitted to use your information solely to provide their specified service to us.

SECTION 7 - DATA RETENTION & SECURITY
We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy and to satisfy accounting, tax, and legal requirements.
We implement industry-standard technical and organizational security measures, including HTTPS encryption in transit, strict access controls, and secure database hosting, to protect your data against unauthorized access, alteration, or disclosure.

SECTION 8 - YOUR RIGHTS
You have the right to:
- Access the personal information we hold about you.
- Request correction of inaccurate or incomplete contact or delivery information.
- Opt out of marketing communications at any time via the unsubscribe link in our emails or by contacting customer support.
- Request deletion of your customer profile, subject to statutory retention obligations under Indian tax and accounting laws.

SECTION 9 - CHANGES TO THIS PRIVACY POLICY
We reserve the right to modify this Privacy Policy at any time. Changes and clarifications will take effect immediately upon their posting on the Website. If we make material changes to this policy, we will update the "Last Updated" date at the bottom of this page.

SECTION 10 - CONTACT INFORMATION & GRIEVANCE OFFICER
If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal data, please contact our Grievance Officer:
Wild About Greens
Attn: Privacy & Grievance Officer
Email: hello@wildaboutgreens.com
WhatsApp / Phone: +91 98XXXXXXXX
Operating Hours: Monday – Sunday, 7:00 AM – 7:00 PM`,
      description:
        'Full privacy policy content. All-caps lines automatically become bold uppercase underlined section headers. Lines starting with "-" or "*" become bullet points.',
    },
    {
      key: 'last_updated',
      label: 'Last Updated Date',
      type: 'text',
      defaultValue: 'October 2026',
      description: 'Optional date note displayed at the bottom of the page.',
    },
  ],
  'shipping-and-returns': [
    {
      key: 'page_title',
      label: 'Page Title',
      type: 'text',
      defaultValue: 'Shipping & Returns',
      description: 'Main heading displayed at the top left of the page.',
    },
    {
      key: 'doc_heading',
      label: 'Document Subheading',
      type: 'text',
      defaultValue: 'SHIPPING & RETURNS POLICY',
      description: 'Centered uppercase underlined title below the main heading.',
    },
    {
      key: 'preamble',
      label: 'Policy Preamble / Quality Guarantee Notice',
      type: 'textarea',
      defaultValue:
        'THIS DOCUMENT SETS FORTH THE SHIPPING, HARVEST DELIVERY, AND RETURN POLICIES FOR ALL ORDERS PLACED ON WILD ABOUT GREENS. BY PLACING AN ORDER, YOU AGREE TO THE TERMS OUTLINED BELOW.',
      description: 'Bold uppercase notice paragraph displayed before the policy.',
    },
    {
      key: 'body_content',
      label: 'Shipping & Returns Content (Markdown / Text)',
      type: 'textarea',
      defaultValue: `OVERVIEW
Wild About Greens operates an indoor vertical urban farm. Unlike traditional produce that sits in refrigerated distribution chains for days, our microgreens are cut to order on the morning of delivery to ensure you receive produce at peak biological vitality. Because fresh microgreens are highly perishable, our shipping and return policies are crafted to be prompt, transparent, and fair.

SECTION 1 - SERVICEABLE DELIVERY AREAS
We currently fulfill morning harvest deliveries across designated pin codes within the Tricity area (Chandigarh, Mohali, Panchkula, and immediate surroundings).
You can verify whether your location is serviceable by entering your 6-digit delivery pincode at checkout or on any product page. Orders placed for addresses outside our active delivery zone will be cancelled and promptly refunded in full.

SECTION 2 - HARVEST & DELIVERY SCHEDULE
- Morning Delivery Window: Deliveries take place between 7:00 AM and 1:00 PM on your scheduled harvest day.
- Cut-to-Order Process: Trays are harvested in the early morning hours preceding dispatch to preserve moisture, flavor, and nutrient density.
- Delivery Handover: Please ensure that a valid 10-digit phone number is provided and that someone is available to receive the package during the morning delivery window. If no one is available, our delivery partner will attempt to reach you by phone.

SECTION 3 - POST-DELIVERY STORAGE & CARE
Microgreens are delicate, fresh produce. To enjoy 7 to 10 days of peak freshness:
- Unpack immediately upon delivery.
- Place the tray or clamshell into your refrigerator (optimal temperature: 4°C–7°C).
- For fresh root trays, keep the roots lightly hydrated as instructed on the packaging sleeve.
- Do not leave delivered packages in direct sunlight, warm cars, or outside doorways.

SECTION 4 - RETURN & REPLACEMENT POLICY (24-HOUR GUARANTEE)
We take pride in our harvest standards. However, because our produce is perishable, standard e-commerce return windows do not apply. We offer a 24-Hour Freshness Guarantee under the following conditions:
- Eligible Situations:
  1. Transit damage to the packaging resulting in crushed or unhygienic produce.
  2. Produce that arrives spoiled, wilted, or failing our quality standards upon initial delivery.
  3. Incorrect microgreen variety or package size delivered.
- Notice Requirement: You must report any quality issue or damage within 24 hours of delivery.
- Evidence Required: Send a clear photograph of the affected tray and packaging label to our customer support team via WhatsApp or Email.

SECTION 5 - RESOLUTION OPTIONS: FRESH REPLACEMENT OR REFUND
Upon verifying your claim:
- Free Fresh Replacement (Recommended): We will harvest a fresh replacement tray and dispatch it on our subsequent morning delivery run at zero extra charge.
- Full Refund: If you prefer a refund, we will credit the amount back to your original payment method (UPI, credit/debit card, net banking) via Razorpay. Refund processing typically takes 5–7 business days to reflect in your account.

SECTION 6 - NON-ELIGIBLE SCENARIOS
We cannot offer replacements or refunds for:
- Claims reported more than 24 hours after delivery.
- Quality degradation caused by improper storage (e.g. failure to refrigerate, leaving produce in hot environments, over-watering root beds).
- Deliveries delayed or missed due to incorrect delivery address or unreachable recipient contact numbers provided at checkout.
- Subjective taste preference (microgreens have distinct, bold natural flavor profiles).

SECTION 7 - ORDER CANCELLATIONS & SUBSCRIPTION MODIFICATIONS
- One-Time Orders: Harvesting begins in the early morning hours according to scheduled orders. You may cancel your order at no penalty provided harvesting has not commenced. Once harvested or dispatched with the morning delivery partner, orders cannot be cancelled.
- Weekly Subscriptions: Subscribers can pause, skip a delivery, change variety preferences, or cancel their subscription by notifying us at least 24 hours prior to the upcoming delivery day. Subscription refunds for unused cycles will be prorated.

SECTION 8 - CUSTOMER SUPPORT CONTACT
To request a replacement, refund, or delivery inquiry:
Wild About Greens Customer Care
Email: hello@wildaboutgreens.com
WhatsApp / Phone: +91 98XXXXXXXX
Operating Hours: Monday – Sunday, 7:00 AM – 7:00 PM`,
      description:
        'Full shipping and returns policy content. All-caps lines automatically become bold uppercase underlined section headers. Lines starting with "-" or "*" become bullet points.',
    },
    {
      key: 'last_updated',
      label: 'Last Updated Date',
      type: 'text',
      defaultValue: 'October 2026',
      description: 'Optional date note displayed at the bottom of the page.',
    },
  ],
};
