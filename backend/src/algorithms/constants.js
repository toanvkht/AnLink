/**
 * Algorithm Constants
 * AnLink Anti-Phishing System
 * 
 * Shared constants used across multiple algorithm modules.
 */

// ============================================
// KNOWN BRANDS DATABASE
// ============================================
const KNOWN_BRANDS = {
  financial: [
    'vietinbank', 'techcombank', 'bidv', 'vietcombank', 'agribank', 
    'mbbank', 'vpbank', 'acb', 'sacombank', 'hdbank', 'tpbank',
    'paypal', 'visa', 'mastercard', 'stripe', 'square',
    'chase', 'bankofamerica', 'wellsfargo', 'citibank', 'hsbc'
  ],
  tech: [
    'google', 'facebook', 'microsoft', 'apple', 'amazon',
    'netflix', 'spotify', 'twitter', 'instagram', 'linkedin',
    'github', 'gitlab', 'dropbox', 'zoom', 'slack', 'discord'
  ],
  ecommerce: [
    'shopee', 'lazada', 'tiki', 'sendo', 'thegioididong',
    'ebay', 'alibaba', 'aliexpress', 'walmart', 'target'
  ],
  social: [
    'twitter', 'instagram', 'linkedin', 'tiktok', 'snapchat',
    'reddit', 'pinterest', 'tumblr', 'whatsapp', 'telegram'
  ],
  government: [
    'gov', 'government', 'irs', 'ssa', 'dhs'
  ],
  email: [
    'gmail', 'outlook', 'yahoo', 'hotmail', 'protonmail'
  ]
};

// Flatten all brand names for quick lookup
const ALL_BRAND_NAMES = Object.values(KNOWN_BRANDS).flat();

// ============================================
// SUSPICIOUS TLD LIST
// ============================================
const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq',  // Free domains often abused
  '.xyz', '.top', '.club', '.pw', '.cc',
  '.work', '.date', '.racing', '.win', '.bid',
  '.stream', '.download', '.trade', '.webcam', '.party',
  '.review', '.science', '.cricket', '.accountant', '.loan'
];

// ============================================
// URL SHORTENER DOMAINS
// ============================================
const URL_SHORTENERS = [
  'bit.ly', 'bitly.com', 'tinyurl.com', 'goo.gl', 't.co',
  'ow.ly', 'is.gd', 'buff.ly', 'j.mp', 'adf.ly',
  'tiny.cc', 'lnkd.in', 'db.tt', 'qr.ae', 'cur.lv',
  'rb.gy', 'shorturl.at', 'v.gd', 'clk.sh', 'yourls.org',
  'bl.ink', 'short.link', 'rebrand.ly', 'cutt.ly', 's.id'
];

// ============================================
// SUSPICIOUS KEYWORDS
// ============================================
const SUSPICIOUS_KEYWORDS = {
  authentication: [
    'secure', 'login', 'signin', 'sign-in', 'logon', 'log-on',
    'authentication', 'auth', 'authenticate', 'password', 'passwd'
  ],
  account: [
    'account', 'myaccount', 'my-account', 'user', 'profile',
    'verify', 'verification', 'validate', 'validation', 'confirm'
  ],
  security: [
    'security', 'safety', 'protection', 'protect', 'safe',
    'update', 'upgrade', 'renew', 'restore', 'recover', 'recovery'
  ],
  financial: [
    'banking', 'bank', 'wallet', 'payment', 'pay', 'billing',
    'credit', 'debit', 'transfer', 'transaction'
  ],
  support: [
    'support', 'help', 'helpdesk', 'customer', 'service', 'care'
  ],
  status: [
    'suspended', 'locked', 'blocked', 'limited', 'restricted',
    'unusual', 'activity', 'alert', 'warning', 'notice'
  ]
};

// Flatten suspicious keywords
const ALL_SUSPICIOUS_KEYWORDS = Object.values(SUSPICIOUS_KEYWORDS).flat();

// ============================================
// HOMOGLYPH MAP - Characters that look similar
// ============================================
const HOMOGLYPHS = {
  'a': ['à', 'á', 'â', 'ã', 'ä', 'å', 'ª', 'α', 'а', '@', '4'],
  'b': ['ß', 'β', 'ь', '6', '8'],
  'c': ['ç', 'с', 'ϲ', '(', '¢'],
  'd': ['đ', 'ð', 'δ'],
  'e': ['è', 'é', 'ê', 'ë', 'е', 'ε', '3', '€'],
  'f': ['ƒ'],
  'g': ['9', 'q', 'ğ'],
  'h': ['н', 'һ'],
  'i': ['ì', 'í', 'î', 'ï', 'ı', 'і', 'ι', '1', 'l', '|', '!'],
  'j': ['ј'],
  'k': ['κ', 'к'],
  'l': ['1', 'ı', 'l', '|', 'ł', 'і'],
  'm': ['м', 'rn'],
  'n': ['ñ', 'η', 'п'],
  'o': ['ò', 'ó', 'ô', 'õ', 'ö', 'о', 'ο', '0', 'ø'],
  'p': ['ρ', 'р'],
  'q': ['9', 'g'],
  'r': ['г', 'ř'],
  's': ['5', '$', 'ѕ', 'ș'],
  't': ['τ', 'т', '+', '7'],
  'u': ['ù', 'ú', 'û', 'ü', 'μ', 'υ', 'ц'],
  'v': ['ν', 'υ'],
  'w': ['ω', 'ш', 'vv'],
  'x': ['х', '×'],
  'y': ['ý', 'ÿ', 'у', 'γ'],
  'z': ['2', 'ž', 'ż']
};

// ============================================
// DEFAULT WEIGHTS FOR SCORING
// ============================================
const DEFAULT_WEIGHTS = {
  domain: 0.40,      // 40% - Most critical indicator
  subdomain: 0.25,   // 25% - Attackers often add misleading subdomains
  path: 0.15,        // 15% - Suspicious paths indicate phishing intent
  query: 0.10,       // 10% - Can contain redirect attacks
  heuristics: 0.10   // 10% - Catch edge cases and obvious patterns
};

// ============================================
// CLASSIFICATION THRESHOLDS
// ============================================
const THRESHOLDS = {
  safe: { min: 0, max: 0.29 },
  suspicious: { min: 0.30, max: 0.59 },
  dangerous: { min: 0.60, max: 1.0 }
};

module.exports = {
  KNOWN_BRANDS,
  ALL_BRAND_NAMES,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS,
  SUSPICIOUS_KEYWORDS,
  ALL_SUSPICIOUS_KEYWORDS,
  HOMOGLYPHS,
  DEFAULT_WEIGHTS,
  THRESHOLDS
};
