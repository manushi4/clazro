// Customer Branding Types for White-Label Support

export type CustomerBranding = {
  // App Identity
  appName: string;
  appTagline?: string;

  // Logos & Assets
  logoUrl?: string;
  logoSmallUrl?: string;
  logoDarkUrl?: string;
  splashImageUrl?: string;
  loginHeroUrl?: string;
  faviconUrl?: string;

  // Feature Naming (White-Label)
  aiTutorName: string;
  doubtSectionName: string;
  assignmentName: string;
  testName: string;
  liveClassName: string;

  // Contact Information
  supportEmail?: string;
  supportPhone?: string;
  whatsappNumber?: string;
  helpCenterUrl?: string;

  // Legal Links
  termsUrl?: string;
  privacyUrl?: string;
  refundUrl?: string;

  // Text Overrides (flexible key-value for any UI text)
  textOverrides: Record<string, string>;
};

export const DEFAULT_BRANDING: CustomerBranding = {
  appName: "Learning App",
  appTagline: "Learn Smarter",
  aiTutorName: "AI Tutor",
  doubtSectionName: "Ask Doubts",
  assignmentName: "Assignment",
  testName: "Test",
  liveClassName: "Live Class",
  textOverrides: {},
};
