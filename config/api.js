import { 
  GOOGLE_PLACES_API_KEY, 
  YELP_API_KEY,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
} from '@env';

// Validate Google Places API key
if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your-google-places-api-key') {
  console.warn(
    '⚠️ Google Places API key is missing or using placeholder value.\n',
    'Please add GOOGLE_PLACES_API_KEY to your .env file.'
  );
}

// Validate Yelp API key (optional - will fallback to generated menus)
// Note: This uses Spoonacular API backend but is configured as YELP_API_KEY
if (!YELP_API_KEY || YELP_API_KEY === 'your-yelp-api-key') {
  console.warn(
    '⚠️ Yelp API key is missing. Menu service will use generated menus.\n',
    'To get real menu data, add YELP_API_KEY to your .env file.'
  );
}

export const GOOGLE_PLACES_CONFIG = {
  apiKey: GOOGLE_PLACES_API_KEY || 'your-google-places-api-key',
  language: 'en',
  // Removed country restriction to allow worldwide addresses
};

// Yelp API configuration (uses Spoonacular API backend)
export const YELP_CONFIG = {
  apiKey: YELP_API_KEY || null,
  baseUrl: 'https://api.spoonacular.com', // Spoonacular API endpoint
};

// Email API Configuration
export const EMAIL_CONFIG = {
  RESEND: {
    apiKey: RESEND_API_KEY || null,
    fromEmail: RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  },
  SENDGRID: {
    apiKey: SENDGRID_API_KEY || null,
    fromEmail: SENDGRID_FROM_EMAIL || null,
  },
};

// Validate email API keys
if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
  console.warn(
    '⚠️ No email API key configured.\n',
    'To enable email notifications:\n',
    '1. Sign up at https://resend.com (recommended) or https://sendgrid.com\n',
    '2. Get your API key\n',
    '3. Add RESEND_API_KEY or SENDGRID_API_KEY to your .env file\n',
    '4. Add RESEND_FROM_EMAIL or SENDGRID_FROM_EMAIL to your .env file'
  );
}

export default {
  GOOGLE_PLACES_CONFIG,
  YELP_CONFIG,
  EMAIL_CONFIG,
};

