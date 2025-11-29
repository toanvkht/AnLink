/**
 * Subdomain Analyzer for URL Phishing Detection
 * AnLink Anti-Phishing System
 * 
 * Analyzes subdomain components for phishing indicators.
 */

const { ALL_BRAND_NAMES } = require('./constants');

// ============================================
// SUSPICIOUS KEYWORDS
// ============================================
const SUSPICIOUS_KEYWORDS = [
  // Authentication keywords
  'secure', 'login', 'signin', 'sign-in', 'logon', 'log-on',
  'authentication', 'auth', 'authenticate', 'password', 'passwd',
  
  // Account keywords
  'account', 'myaccount', 'my-account', 'user', 'profile',
  'verify', 'verification', 'validate', 'validation', 'confirm',
  
  // Security keywords
  'security', 'safety', 'protection', 'protect', 'safe',
  'update', 'upgrade', 'renew', 'restore', 'recover', 'recovery',
  
  // Banking keywords
  'banking', 'bank', 'wallet', 'payment', 'pay', 'billing',
  
  // Support keywords
  'support', 'help', 'helpdesk', 'customer', 'service', 'care',
  
  // Action keywords
  'suspended', 'locked', 'blocked', 'limited', 'restricted',
  'unusual', 'activity', 'alert', 'warning', 'notice',
  
  // Admin keywords
  'admin', 'administrator', 'webmaster', 'web', 'mail', 'email'
];

/**
 * Check if subdomain contains brand name that doesn't match domain
 * @param {string} subdomain - Subdomain to check
 * @param {string} domain - Main domain
 * @param {Array} additionalBrands - Additional brand names to check
 * @returns {object} - Detection result
 */
function checkBrandInSubdomain(subdomain, domain, additionalBrands = []) {
  if (!subdomain) return { detected: false };

  const subdomainLower = subdomain.toLowerCase();
  const domainLower = domain.toLowerCase();
  
  // Combine default and additional brands
  const allBrands = [...new Set([...ALL_BRAND_NAMES, ...additionalBrands])];
  
  const detectedBrands = [];
  let maxScore = 0;

  for (const brand of allBrands) {
    // Check if brand appears in subdomain
    if (subdomainLower.includes(brand.toLowerCase())) {
      // Check if the brand is NOT the actual domain owner
      if (!domainLower.includes(brand.toLowerCase())) {
        detectedBrands.push({
          brand: brand,
          reason: 'brand_in_subdomain_not_domain',
          score: 0.35
        });
        maxScore = Math.max(maxScore, 0.35);
      }
    }
  }

  // Also check for common domain variations
  const domainParts = domain.split('.');
  const domainName = domainParts[0] || domain;

  // Check if subdomain contains variations of another well-known brand
  for (const brand of allBrands) {
    if (brand.toLowerCase() !== domainName.toLowerCase()) {
      // Check for typosquatting-style patterns in subdomain
      const brandPatterns = [
        brand,
        `${brand}-secure`,
        `${brand}-login`,
        `${brand}-verify`,
        `secure-${brand}`,
        `login-${brand}`,
        `my${brand}`,
        `${brand}online`
      ];

      for (const pattern of brandPatterns) {
        if (subdomainLower.includes(pattern.toLowerCase())) {
          if (!detectedBrands.some(d => d.brand === brand)) {
            detectedBrands.push({
              brand: brand,
              pattern: pattern,
              reason: 'suspicious_brand_pattern_in_subdomain',
              score: 0.45
            });
            maxScore = Math.max(maxScore, 0.45);
          }
        }
      }
    }
  }

  return {
    detected: detectedBrands.length > 0,
    brands: detectedBrands,
    score: maxScore
  };
}

/**
 * Analyze subdomain for suspicious patterns
 * @param {string} subdomain - Subdomain to analyze
 * @param {string} domain - Main domain
 * @param {object} components - Full URL components (optional)
 * @returns {object} - Analysis results
 */
function analyzeSubdomain(subdomain, domain, components = {}) {
  const results = {
    component: 'subdomain',
    value: subdomain || '',
    score: 0,
    flags: [],
    details: {}
  };

  // If no subdomain, return safe
  if (!subdomain || subdomain.length === 0) {
    results.flags.push('no_subdomain');
    return results;
  }

  const subdomainLower = subdomain.toLowerCase();

  // ============================================
  // CHECK 1: Suspicious Keywords
  // ============================================
  let keywordCount = 0;
  const foundKeywords = [];

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (subdomainLower.includes(keyword)) {
      keywordCount++;
      foundKeywords.push(keyword);
    }
  }

  if (keywordCount > 0) {
    results.flags.push(`contains_${keywordCount}_suspicious_keywords`);
    results.score += Math.min(keywordCount * 0.15, 0.45);
    results.details.keywords_found = foundKeywords;
  }

  // ============================================
  // CHECK 2: Brand Name in Subdomain
  // ============================================
  const brandCheck = checkBrandInSubdomain(subdomain, domain);
  if (brandCheck.detected) {
    results.flags.push('brand_name_in_subdomain');
    results.score += brandCheck.score;
    results.details.brand_impersonation = brandCheck;
  }

  // ============================================
  // CHECK 3: Subdomain Length
  // ============================================
  if (subdomain.length > 30) {
    results.flags.push('unusually_long_subdomain');
    results.score += 0.20;
    results.details.length = subdomain.length;
  }

  // ============================================
  // CHECK 4: Multiple Subdomain Levels
  // ============================================
  const subdomainParts = subdomain.split('.');
  const subdomainLevels = subdomainParts.length;
  
  if (subdomainLevels >= 2) {
    results.flags.push(`multiple_subdomain_levels_${subdomainLevels}`);
    results.score += subdomainLevels * 0.10;
    results.details.levels = subdomainLevels;
  }

  // ============================================
  // CHECK 5: Multiple Digits
  // ============================================
  if (/\d{2,}/.test(subdomain)) {
    results.flags.push('contains_multiple_digits');
    results.score += 0.15;
  }

  // ============================================
  // CHECK 6: Multiple Hyphens
  // ============================================
  const hyphenCount = (subdomain.match(/-/g) || []).length;
  if (hyphenCount >= 2) {
    results.flags.push('multiple_hyphens');
    results.score += 0.10;
    results.details.hyphen_count = hyphenCount;
  }

  // ============================================
  // CHECK 7: Random-looking Subdomain
  // ============================================
  // Check for high consonant ratio (often indicates randomly generated strings)
  const consonants = subdomain.replace(/[aeiou\d\-\.]/gi, '').length;
  const ratio = consonants / subdomain.length;
  
  if (subdomain.length > 10 && ratio > 0.7) {
    results.flags.push('random_looking_subdomain');
    results.score += 0.15;
    results.details.consonant_ratio = ratio;
  }

  // ============================================
  // CHECK 8: Suspicious Patterns
  // ============================================
  const suspiciousPatterns = [
    /^www\d+$/,              // www1, www2, etc.
    /^secure\d*-/,           // secure-, secure1-, etc.
    /^login\d*-/,            // login-, login1-, etc.
    /^account\d*-/,          // account-, etc.
    /^verify\d*-/,           // verify-, etc.
    /-login$/,               // ends with -login
    /-secure$/,              // ends with -secure
    /-verify$/,              // ends with -verify
    /-update$/,              // ends with -update
    /^m-/,                   // mobile fake prefix
    /^mobile-/,              // mobile fake prefix
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(subdomainLower)) {
      results.flags.push('suspicious_pattern');
      results.score += 0.15;
      break; // Only add once
    }
  }

  // ============================================
  // CHECK 9: All Caps or Mixed Case Abuse
  // ============================================
  // Check for unusual capitalization in original value
  if (components.subdomain && components.subdomain !== components.subdomain.toLowerCase()) {
    const upperCount = (components.subdomain.match(/[A-Z]/g) || []).length;
    const lowerCount = (components.subdomain.match(/[a-z]/g) || []).length;
    
    if (upperCount > 0 && lowerCount > 0 && upperCount >= lowerCount / 2) {
      results.flags.push('suspicious_capitalization');
      results.score += 0.10;
    }
  }

  // ============================================
  // FINAL: Cap score at 1.0
  // ============================================
  results.score = Math.min(results.score, 1.0);
  results.score = parseFloat(results.score.toFixed(4));

  return results;
}

module.exports = { 
  analyzeSubdomain,
  checkBrandInSubdomain,
  SUSPICIOUS_KEYWORDS
};
