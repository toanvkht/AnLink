/**
 * Heuristic Analyzer for URL Phishing Detection
 * AnLink Anti-Phishing System
 * 
 * Performs additional pattern-based checks on URLs.
 */

// ============================================
// URL SHORTENER DOMAINS
// ============================================
const URL_SHORTENERS = [
  'bit.ly', 'bitly.com', 'tinyurl.com', 'goo.gl', 't.co',
  'ow.ly', 'is.gd', 'buff.ly', 'j.mp', 'adf.ly',
  'tiny.cc', 'lnkd.in', 'db.tt', 'qr.ae', 'cur.lv',
  'rb.gy', 'shorturl.at', 'v.gd', 'clk.sh', 'yourls.org',
  'bl.ink', 'short.link', 'rebrand.ly', 'cutt.ly', 's.id',
  'vk.cc', 'u.to', 'soo.gd', 'x.co', 'su.pr'
];

// ============================================
// SUSPICIOUS TLDS
// ============================================
const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq',  // Free domains
  '.xyz', '.top', '.club', '.pw', '.cc',
  '.work', '.date', '.racing', '.win', '.bid',
  '.stream', '.download', '.trade', '.webcam', '.party',
  '.review', '.science', '.cricket', '.accountant', '.loan'
];

// ============================================
// FINANCIAL KEYWORDS
// ============================================
const FINANCIAL_KEYWORDS = [
  'bank', 'banking', 'pay', 'payment', 'wallet', 'credit', 
  'finance', 'financial', 'visa', 'mastercard', 'paypal',
  'transfer', 'money', 'cash', 'atm', 'transaction'
];

// ============================================
// PHISHING KEYWORDS
// ============================================
const PHISHING_KEYWORDS = [
  'verify', 'secure', 'account', 'update', 'login', 'signin',
  'confirm', 'suspended', 'locked', 'unusual', 'activity',
  'password', 'credential', 'authenticate', 'validation'
];

/**
 * Detect if URL is a shortener
 * @param {string} domain - Domain to check
 * @returns {object} - Detection result
 */
function detectURLShortener(domain) {
  const domainLower = domain.toLowerCase();
  
  for (const shortener of URL_SHORTENERS) {
    if (domainLower === shortener || domainLower.endsWith('.' + shortener)) {
      return {
        detected: true,
        shortener: shortener,
        reason: 'url_shortener_detected',
        score: 0.50,  // Moderate risk - cannot verify destination
        message: 'URL shortener detected. Cannot verify destination.'
      };
    }
  }

  return { detected: false };
}

/**
 * Detect Data URI schemes
 * @param {string} url - URL to check
 * @returns {object} - Detection result
 */
function detectDataURI(url) {
  if (url.startsWith('data:')) {
    // Check for potentially malicious content types
    const dangerousTypes = [
      'text/html',
      'text/javascript',
      'application/javascript',
      'image/svg+xml'  // Can contain scripts
    ];

    for (const type of dangerousTypes) {
      if (url.toLowerCase().includes(`data:${type}`)) {
        return {
          detected: true,
          content_type: type,
          reason: 'dangerous_data_uri',
          score: 0.90,
          message: 'Data URI with potentially dangerous content detected.'
        };
      }
    }

    return {
      detected: true,
      reason: 'data_uri_detected',
      score: 0.80,
      message: 'Data URI detected. May contain malicious code.'
    };
  }

  return { detected: false };
}

/**
 * Detect private/localhost IP addresses
 * @param {string} hostname - Hostname to check
 * @returns {object} - Detection result
 */
function detectPrivateIP(hostname) {
  // IPv4 patterns for private networks
  const privatePatterns = [
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,        // Localhost
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,         // Class A private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/, // Class B private
    /^192\.168\.\d{1,3}\.\d{1,3}$/,            // Class C private
    /^169\.254\.\d{1,3}\.\d{1,3}$/,            // Link-local
    /^0\.0\.0\.0$/                              // All interfaces
  ];

  // Check localhost names
  if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
    return {
      detected: true,
      type: 'localhost',
      reason: 'localhost_detected',
      score: 0.00,  // Safe for development
      message: 'Localhost address detected.'
    };
  }

  for (const pattern of privatePatterns) {
    if (pattern.test(hostname)) {
      return {
        detected: true,
        type: 'private_ip',
        reason: 'private_ip_detected',
        score: 0.00,  // Generally safe (internal use)
        message: 'Private IP address detected.'
      };
    }
  }

  return { detected: false };
}

/**
 * Detect Base64 encoded URLs in query parameters
 * @param {string} queryString - Query string to check
 * @returns {object} - Detection result
 */
function detectBase64URLs(queryString) {
  if (!queryString) return { detected: false };

  // Base64 pattern - looks for long base64-like strings
  const base64Pattern = /[A-Za-z0-9+/=]{40,}/g;
  const matches = queryString.match(base64Pattern);

  if (matches) {
    for (const match of matches) {
      try {
        // Try to decode and check if it's a URL
        const decoded = Buffer.from(match, 'base64').toString('utf-8');
        
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          return {
            detected: true,
            encoded_url: match.substring(0, 50) + '...',  // Truncate for safety
            decoded_url: decoded.substring(0, 100) + '...',
            reason: 'base64_encoded_url_detected',
            score: 0.60,
            message: 'Base64 encoded URL found in query parameters.'
          };
        }
      } catch (e) {
        // Not valid base64 or not decodable
      }
    }
  }

  return { detected: false };
}

/**
 * Perform heuristic checks on URL components
 * @param {object} components - Parsed URL components
 * @returns {object} - Heuristic analysis results
 */
function analyzeHeuristics(components) {
  const results = {
    component: 'heuristics',
    score: 0,
    flags: [],
    details: {}
  };

  const domain = components.domain || components.hostname || '';
  const fullUrl = components.original_url || components.normalized_url || '';

  // ============================================
  // CHECK 1: Data URI Detection
  // ============================================
  const dataURICheck = detectDataURI(fullUrl);
  if (dataURICheck.detected) {
    results.flags.push(dataURICheck.reason);
    results.score += dataURICheck.score;
    results.details.data_uri = dataURICheck;
    
    // Data URIs are dangerous - return early with high score
    if (dataURICheck.score >= 0.80) {
      results.score = Math.min(results.score, 1.0);
      return results;
    }
  }

  // ============================================
  // CHECK 2: URL Shortener Detection
  // ============================================
  const shortenerCheck = detectURLShortener(domain);
  if (shortenerCheck.detected) {
    results.flags.push('url_shortener_detected');
    results.score += shortenerCheck.score;
    results.details.url_shortener = shortenerCheck;
  }

  // ============================================
  // CHECK 3: Private/Localhost IP Detection
  // ============================================
  const privateIPCheck = detectPrivateIP(domain);
  if (privateIPCheck.detected) {
    results.flags.push(privateIPCheck.reason);
    results.details.private_ip = privateIPCheck;
    // Don't add to score - private IPs are generally safe
  }

  // ============================================
  // CHECK 4: HTTP instead of HTTPS for financial/sensitive domains
  // ============================================
  if (components.scheme === 'http') {
    const hasFinancialKeyword = FINANCIAL_KEYWORDS.some(keyword => 
      domain.includes(keyword) || 
      (components.subdomain && components.subdomain.includes(keyword)) ||
      (components.path && components.path.includes(keyword))
    );
    
    const hasPhishingKeyword = PHISHING_KEYWORDS.some(keyword =>
      domain.includes(keyword) ||
      (components.subdomain && components.subdomain.includes(keyword)) ||
      (components.path && components.path.includes(keyword))
    );
    
    if (hasFinancialKeyword) {
      results.flags.push('http_on_financial_domain');
      results.score += 0.50;
    } else if (hasPhishingKeyword) {
      results.flags.push('http_on_sensitive_domain');
      results.score += 0.35;
    } else {
      results.flags.push('http_protocol_used');
      results.score += 0.20;
    }
  }

  // ============================================
  // CHECK 5: IP address instead of domain name
  // ============================================
  if (components.is_ip || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    // Only flag if not a private IP
    if (!privateIPCheck.detected) {
      results.flags.push('ip_address_used');
      results.score += 0.50;
    }
  }

  // ============================================
  // CHECK 6: Suspicious TLD
  // ============================================
  const matchedTLD = SUSPICIOUS_TLDS.find(tld => domain.endsWith(tld));
  if (matchedTLD) {
    results.flags.push('suspicious_tld');
    results.details.tld = matchedTLD;
    
    // Free TLDs are extremely high risk
    const freeTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (freeTLDs.includes(matchedTLD)) {
      results.score += 0.45;
      results.flags.push('free_tld_abuse');
    } else {
      results.score += 0.30;
    }
  }

  // ============================================
  // CHECK 7: Non-standard port
  // ============================================
  const standardPorts = ['80', '443', ''];
  if (components.port && !standardPorts.includes(components.port)) {
    results.flags.push(`non_standard_port_${components.port}`);
    results.score += 0.20;
  }

  // ============================================
  // CHECK 8: Excessive URL length
  // ============================================
  if (components.url_length && components.url_length > 75) {
    results.flags.push(`excessive_length_${components.url_length}_chars`);
    results.score += 0.15;
  }

  // ============================================
  // CHECK 9: @ symbol in URL (can hide real domain)
  // ============================================
  if (fullUrl.includes('@') && !fullUrl.startsWith('mailto:')) {
    results.flags.push('at_symbol_in_url');
    results.score += 0.50;
  }

  // ============================================
  // CHECK 10: Too many subdomains
  // ============================================
  const subdomainCount = components.subdomain ? components.subdomain.split('.').length : 0;
  if (subdomainCount > 3) {
    results.flags.push(`excessive_subdomains_${subdomainCount}`);
    results.score += 0.25;
  }

  // ============================================
  // CHECK 11: Excessive hyphens in full domain
  // ============================================
  const fullDomain = components.hostname || domain;
  const hyphenCount = (fullDomain.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    results.flags.push(`excessive_hyphens_${hyphenCount}`);
    results.score += 0.20;
  }

  // ============================================
  // CHECK 12: Multiple phishing keywords in URL
  // ============================================
  const normalizedUrl = (components.normalized_url || fullUrl).toLowerCase();
  let keywordCount = 0;
  
  for (const keyword of PHISHING_KEYWORDS) {
    if (normalizedUrl.includes(keyword)) {
      keywordCount++;
    }
  }
  
  if (keywordCount >= 3) {
    results.flags.push(`multiple_phishing_keywords_${keywordCount}`);
    results.score += 0.20;
  }

  // ============================================
  // CHECK 13: Base64 encoded URLs in query
  // ============================================
  const base64Check = detectBase64URLs(components.query);
  if (base64Check.detected) {
    results.flags.push(base64Check.reason);
    results.score += base64Check.score;
    results.details.base64_url = base64Check;
  }

  // ============================================
  // CHECK 14: Double extensions (e.g., .pdf.exe)
  // ============================================
  if (components.path) {
    const doubleExtPattern = /\.[a-z]{2,4}\.[a-z]{2,4}$/i;
    if (doubleExtPattern.test(components.path)) {
      results.flags.push('double_extension_detected');
      results.score += 0.35;
    }
  }

  // ============================================
  // CHECK 15: Unicode characters in visible URL
  // ============================================
  // Check for non-ASCII characters that might be used for deception
  const nonASCII = fullUrl.match(/[^\x00-\x7F]/g);
  if (nonASCII && nonASCII.length > 0) {
    results.flags.push('unicode_characters_detected');
    results.score += 0.20;
    results.details.unicode_chars = nonASCII.length;
  }

  // ============================================
  // CHECK 16: Combination of suspicious factors (multiplier)
  // ============================================
  // If we have multiple suspicious indicators, increase score
  const suspiciousIndicators = results.flags.filter(flag => 
    flag.includes('suspicious') || 
    flag.includes('phishing') || 
    flag.includes('http_') ||
    flag.includes('free_tld') ||
    flag.includes('double_extension') ||
    flag.includes('base64')
  ).length;
  
  if (suspiciousIndicators >= 3) {
    results.flags.push('multiple_risk_factors');
    results.score *= 1.3; // 30% boost for having 3+ indicators
  } else if (suspiciousIndicators >= 2) {
    results.score *= 1.15; // 15% boost for 2 indicators
  }

  // ============================================
  // FINAL: Cap score at 1.0
  // ============================================
  results.score = Math.min(results.score, 1.0);
  results.score = parseFloat(results.score.toFixed(4));

  return results;
}

module.exports = { 
  analyzeHeuristics,
  detectURLShortener,
  detectDataURI,
  detectPrivateIP,
  detectBase64URLs,
  URL_SHORTENERS,
  SUSPICIOUS_TLDS,
  FINANCIAL_KEYWORDS,
  PHISHING_KEYWORDS
};
