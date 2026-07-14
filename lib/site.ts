// Single source of truth for the production domain — imported anywhere a
// canonical/absolute URL is needed (metadata, robots.txt, sitemap) instead
// of repeating the literal string.
export const SITE_URL = "https://dapanglobal.com";

// Public contact details. Import these anywhere the site shows a way to reach
// the business — never hardcode the number/email a second place.
export const CONTACT_EMAIL = "admin@dapanglobal.com";
// E.164 for links (tel:/wa.me); human-formatted for display.
export const CONTACT_PHONE = "+17739937444";
export const CONTACT_PHONE_DISPLAY = "+1 (773) 993-7444";
// WhatsApp deep-link uses the number with no "+" or separators.
export const WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE.replace(/[^\d]/g, "")}`;
