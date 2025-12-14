export type CustomerBranding = {
  id?: string;
  customer_id: string;

  // App Identity
  app_name: string;
  app_tagline?: string;

  // Logos & Assets
  logo_url?: string;
  logo_small_url?: string;
  logo_dark_url?: string;
  splash_image_url?: string;
  login_hero_url?: string;
  favicon_url?: string;

  // Feature Naming (white-label)
  ai_tutor_name: string;
  doubt_section_name: string;
  assignment_name: string;
  test_name: string;
  live_class_name: string;

  // Contact Info
  support_email?: string;
  support_phone?: string;
  whatsapp_number?: string;
  help_center_url?: string;

  // Legal Links
  terms_url?: string;
  privacy_url?: string;
  refund_url?: string;

  // Flexible Text Overrides
  text_overrides: Record<string, string>;
};

export const DEFAULT_BRANDING: Omit<CustomerBranding, "customer_id"> = {
  app_name: "Learning App",
  ai_tutor_name: "AI Tutor",
  doubt_section_name: "Ask Doubts",
  assignment_name: "Assignment",
  test_name: "Test",
  live_class_name: "Live Class",
  text_overrides: {},
};
