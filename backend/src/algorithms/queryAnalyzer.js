/**
 * Query Parameter Analyzer for URL Phishing Detection
 * AnLink Anti-Phishing System
 * 
 * Analyzes URL query parameters for phishing indicators.
 */

// ============================================
// SUSPICIOUS PARAMETER NAMES
// ============================================
const SUSPICIOUS_PARAM_NAMES = [
  // Redirect parameters (open redirect risk)
  'redirect', 'return', 'goto', 'url', 'link', 'next',
  'continue', 'target', 'destination', 'forward', 'redir',
  'returnurl', 'return_url', 'returnto', 'return_to',
  'redirect_uri', 'redirect_url', 'callback', 'callback_url',
  
  // Session/Auth parameters (session hijacking risk)
  'token', 'session', 'sid', 'sessionid', 'auth',
  'key', 'apikey', 'api_key', 'access_token',
  
  // User data parameters
  'email', 'mail', 'user', 'username', 'userid',
  'password', 'passwd', 'pwd', 'pass',
  
  // Action parameters
  'action', 'cmd', 'command', 'exec', 'do'
];

// ============================================
// DANGEROUS PARAMETER VALUE PATTERNS
// ============================================
const DANGEROUS_VALUE_PATTERNS = [
  /^javascript:/i,          // JavaScript injection
  /^data:/i,                // Data URI injection
  /^vbscript:/i,            // VBScript injection
  /<script/i,               // HTML script injection
  /on\w+=/i,                // Event handler injection
  /eval\(/i,                // Eval injection
  /document\./i,            // DOM manipulation
  /window\./i               // Window manipulation
];

/**
 * Analyze URL query parameters for suspicious patterns
 * @param {string} queryString - Query string (without leading '?')
 * @param {object} components - Full URL components (optional)
 * @returns {object} - Analysis results
 */
function analyzeQuery(queryString, components = {}) {
  const results = {
    component: 'query',
    value: queryString || '',
    score: 0,
    flags: [],
    details: {}
  };

  // If no query params, return safe
  if (!queryString || queryString.length === 0) {
    results.flags.push('no_query_params');
    return results;
  }

  // Parse query parameters
  let params;
  try {
    params = new URLSearchParams(queryString);
  } catch (e) {
    results.flags.push('malformed_query_string');
    results.score += 0.20;
    return results;
  }

  const paramEntries = Array.from(params.entries());
  const paramCount = paramEntries.length;
  
  const foundSuspiciousParams = [];
  const foundDangerousValues = [];

  // ============================================
  // CHECK 1: Suspicious Parameter Names
  // ============================================
  for (const [key, value] of paramEntries) {
    const keyLower = key.toLowerCase();

    // Check against suspicious names
    for (const suspiciousName of SUSPICIOUS_PARAM_NAMES) {
      if (keyLower === suspiciousName || keyLower.includes(suspiciousName)) {
        if (!foundSuspiciousParams.includes(key)) {
          foundSuspiciousParams.push(key);
          results.flags.push(`suspicious_param_name_${key}`);
          results.score += 0.25;
        }
        break;
      }
    }

    // ============================================
    // CHECK 2: URLs in Parameter Values
    // ============================================
    if (value.startsWith('http://') || value.startsWith('https://')) {
      results.flags.push(`url_in_param_${key}`);
      results.score += 0.30;
      results.details.url_param = key;
    }

    // ============================================
    // CHECK 3: Very Long Parameter Values
    // ============================================
    if (value.length > 100) {
      results.flags.push(`very_long_param_value_${key}`);
      results.score += 0.15;
    }

    // ============================================
    // CHECK 4: Dangerous Value Patterns
    // ============================================
    for (const pattern of DANGEROUS_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        foundDangerousValues.push(key);
        results.flags.push(`dangerous_value_in_${key}`);
        results.score += 0.40;
        break;
      }
    }

    // ============================================
    // CHECK 5: Base64-like Values
    // ============================================
    if (/^[A-Za-z0-9+/=]{30,}$/.test(value)) {
      // Try to decode and check if it's a URL
      try {
        const decoded = Buffer.from(value, 'base64').toString('utf-8');
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          results.flags.push(`base64_url_in_${key}`);
          results.score += 0.35;
        }
      } catch (e) {
        // Not valid base64
      }
    }

    // ============================================
    // CHECK 6: Encoded Characters in Values
    // ============================================
    const encodedCount = (value.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    if (encodedCount > 5) {
      results.flags.push(`heavily_encoded_param_${key}`);
      results.score += 0.15;
    }
  }

  // ============================================
  // CHECK 7: Excessive Number of Parameters
  // ============================================
  if (paramCount > 10) {
    results.flags.push(`many_parameters_${paramCount}`);
    results.score += 0.20;
  }

  // ============================================
  // CHECK 8: Duplicate Parameters
  // ============================================
  const paramNames = paramEntries.map(([k]) => k.toLowerCase());
  const uniqueNames = new Set(paramNames);
  if (paramNames.length !== uniqueNames.size) {
    results.flags.push('duplicate_parameters');
    results.score += 0.15;
  }

  // ============================================
  // CHECK 9: Very Long Query String
  // ============================================
  if (queryString.length > 500) {
    results.flags.push(`excessive_query_length_${queryString.length}`);
    results.score += 0.15;
  }

  // ============================================
  // CHECK 10: Email Addresses in Query
  // ============================================
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = queryString.match(emailPattern);
  if (emails && emails.length > 0) {
    results.flags.push('email_in_query');
    results.score += 0.15;
    results.details.emails_found = emails.length;
  }

  // Store details
  if (foundSuspiciousParams.length > 0) {
    results.details.suspicious_params = foundSuspiciousParams;
  }
  if (foundDangerousValues.length > 0) {
    results.details.dangerous_values = foundDangerousValues;
  }
  results.details.param_count = paramCount;

  // ============================================
  // FINAL: Cap score at 1.0
  // ============================================
  results.score = Math.min(results.score, 1.0);
  results.score = parseFloat(results.score.toFixed(4));

  return results;
}

module.exports = { 
  analyzeQuery,
  SUSPICIOUS_PARAM_NAMES,
  DANGEROUS_VALUE_PATTERNS
};
