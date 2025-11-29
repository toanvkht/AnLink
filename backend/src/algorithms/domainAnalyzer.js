/**
 * Domain Analyzer for URL Phishing Detection
 * AnLink Anti-Phishing System
 * 
 * Analyzes domain components for phishing indicators using multiple techniques.
 */

const { 
  combinedSimilarity, 
  detectTyposquatting,
  detectHomoglyphs,
  normalizeHomoglyphs
} = require('./similarityMetrics');
const { query } = require('../config/database');
const { KNOWN_BRANDS, ALL_BRAND_NAMES, SUSPICIOUS_TLDS } = require('./constants');

/**
 * Detect Punycode/IDN homograph attacks
 * @param {string} domain - Domain to check
 * @returns {object} - Detection result
 */
function detectPunycodeIDN(domain) {
  const result = {
    detected: false,
    punycode: null,
    decoded: null,
    mixed_scripts: false,
    scripts_found: [],
    score: 0
  };

  // Check if domain starts with xn-- (Punycode prefix)
  if (domain.startsWith('xn--') || domain.includes('.xn--')) {
    result.detected = true;
    result.punycode = domain;
    result.reason = 'punycode_idn_detected';
    result.score = 0.80;

    // Try to decode the punycode
    try {
      // Simple punycode detection - in production, use a proper punycode library
      result.decoded = domain; // Would decode here with proper library
    } catch (e) {
      result.decoded = domain;
    }

    return result;
  }

  // Check for mixed scripts (Latin + Cyrillic, etc.)
  const scripts = new Set();
  
  for (const char of domain) {
    const code = char.charCodeAt(0);
    
    // Cyrillic range: U+0400 to U+04FF
    if (code >= 0x0400 && code <= 0x04FF) {
      scripts.add('cyrillic');
    }
    // Greek range: U+0370 to U+03FF
    else if (code >= 0x0370 && code <= 0x03FF) {
      scripts.add('greek');
    }
    // Basic Latin: U+0041 to U+007A (A-Z, a-z)
    else if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A)) {
      scripts.add('latin');
    }
    // Latin Extended
    else if (code >= 0x00C0 && code <= 0x024F) {
      scripts.add('latin_extended');
    }
  }

  result.scripts_found = Array.from(scripts);

  // Mixed scripts are highly suspicious
  if (scripts.size > 1 && (scripts.has('cyrillic') || scripts.has('greek'))) {
    result.detected = true;
    result.mixed_scripts = true;
    result.reason = 'mixed_character_scripts';
    result.score = 0.70;
  }

  return result;
}

/**
 * Detect brand impersonation in domain
 * @param {string} domain - Domain to check
 * @param {string} subdomain - Subdomain to check
 * @returns {object} - Detection result
 */
function detectBrandImpersonation(domain, subdomain = '') {
  const result = {
    detected: false,
    brand: null,
    reason: null,
    score: 0
  };

  const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;
  const domainLower = domain.toLowerCase();
  const subdomainLower = (subdomain || '').toLowerCase();

  for (const brand of ALL_BRAND_NAMES) {
    // Check if brand name appears in subdomain but not in main domain
    if (subdomainLower.includes(brand) && !domainLower.includes(brand)) {
      result.detected = true;
      result.brand = brand;
      result.reason = 'brand_in_subdomain_not_domain';
      result.score = 0.70;
      return result;
    }

    // Check for brand + suspicious keywords combinations
    if (domainLower.includes(brand)) {
      const suspiciousCombos = [
        `${brand}-secure`,
        `${brand}-verify`,
        `${brand}-login`,
        `${brand}-update`,
        `${brand}-account`,
        `secure-${brand}`,
        `verify-${brand}`,
        `login-${brand}`,
        `my${brand}`,
        `${brand}online`,
        `${brand}support`,
        `${brand}help`
      ];

      for (const combo of suspiciousCombos) {
        if (fullDomain.toLowerCase().includes(combo)) {
          result.detected = true;
          result.brand = brand;
          result.reason = 'brand_with_suspicious_keyword';
          result.score = 0.65;
          return result;
        }
      }
    }
  }

  return result;
}

/**
 * Analyze domain against known phishing patterns and legitimate brands
 * @param {string} domain - Domain to analyze
 * @param {object} components - Full URL components
 * @returns {object} - Analysis results
 */
async function analyzeDomain(domain, components = {}) {
  try {
    const results = {
      component: 'domain',
      value: domain,
      score: 0,
      flags: [],
      matches: [],
      details: {}
    };

    // ============================================
    // STEP 1: Check if domain is a known legitimate site
    // ============================================
    try {
      const legitimateCheck = await query(`
        SELECT domain
        FROM suspicious_urls
        WHERE domain = $1 AND status = 'safe'
        LIMIT 1
      `, [domain]);

      if (legitimateCheck.rows.length > 0) {
        results.score = 0;
        results.flags.push('known_legitimate_domain');
        results.matches.push({
          type: 'exact_legitimate',
          domain: legitimateCheck.rows[0].domain
        });
        return results;
      }
    } catch (dbError) {
      console.log('Database check skipped:', dbError.message);
    }

    // ============================================
    // STEP 2: Check exact match in known phishing database
    // ============================================
    try {
      const exactPhishing = await query(`
        SELECT phishing_id, domain_pattern, severity, target_brand
        FROM known_phishing_urls
        WHERE active = TRUE AND domain_pattern = $1
      `, [domain]);

      if (exactPhishing.rows.length > 0) {
        const match = exactPhishing.rows[0];
        results.score = 1.0;
        results.flags.push('exact_phishing_match');
        results.matches.push({
          type: 'exact',
          pattern: match.domain_pattern,
          severity: match.severity,
          target_brand: match.target_brand,
          phishing_id: match.phishing_id
        });
        return results;
      }
    } catch (dbError) {
      console.log('Phishing database check skipped:', dbError.message);
    }

    // ============================================
    // STEP 3: Punycode/IDN Detection
    // ============================================
    const punycodeResult = detectPunycodeIDN(domain);
    if (punycodeResult.detected) {
      results.flags.push(punycodeResult.reason);
      results.score = Math.max(results.score, punycodeResult.score);
      results.details.punycode = punycodeResult;
    }

    // ============================================
    // STEP 4: Homoglyph Detection
    // ============================================
    const homoglyphResult = detectHomoglyphs(domain);
    if (homoglyphResult.detected) {
      results.flags.push('homoglyph_characters_detected');
      results.score = Math.max(results.score, homoglyphResult.score);
      results.details.homoglyphs = homoglyphResult;
    }

    // ============================================
    // STEP 5: Brand Impersonation Detection
    // ============================================
    const brandResult = detectBrandImpersonation(domain, components.subdomain || '');
    if (brandResult.detected) {
      results.flags.push(brandResult.reason);
      results.score = Math.max(results.score, brandResult.score);
      results.details.brand_impersonation = brandResult;
    }

    // ============================================
    // STEP 6: Typosquatting Detection against all known brands
    // ============================================
    let maxTyposquattingScore = 0;
    let bestTyposquattingMatch = null;

    // Get domain name without TLD for comparison
    const domainParts = domain.split('.');
    const domainName = domainParts.length > 1 ? domainParts.slice(0, -1).join('.') : domain;
    const normalizedDomainName = normalizeHomoglyphs(domainName);

    for (const brand of ALL_BRAND_NAMES) {
      // Check with original domain name
      const typoResult = detectTyposquatting(domainName, brand);
      if (typoResult.detected && typoResult.score > maxTyposquattingScore) {
        maxTyposquattingScore = typoResult.score;
        bestTyposquattingMatch = {
          brand: brand,
          ...typoResult
        };
      }

      // Check with normalized (homoglyph-corrected) domain name
      const normalizedTypoResult = detectTyposquatting(normalizedDomainName, brand);
      if (normalizedTypoResult.detected && normalizedTypoResult.score > maxTyposquattingScore) {
        maxTyposquattingScore = normalizedTypoResult.score;
        bestTyposquattingMatch = {
          brand: brand,
          normalized: true,
          ...normalizedTypoResult
        };
      }

      // Also check full similarity
      const similarity = combinedSimilarity(domainName, brand);
      if (similarity.weighted >= 0.75 && similarity.weighted > maxTyposquattingScore) {
        maxTyposquattingScore = similarity.weighted;
        bestTyposquattingMatch = {
          brand: brand,
          similarity: similarity,
          score: similarity.weighted
        };
      }
    }

    if (bestTyposquattingMatch && maxTyposquattingScore >= 0.5) {
      results.flags.push('typosquatting_detected');
      results.score = Math.max(results.score, maxTyposquattingScore);
      results.details.typosquatting = bestTyposquattingMatch;
      results.matches.push({
        type: 'typosquatting',
        target_brand: bestTyposquattingMatch.brand,
        score: maxTyposquattingScore
      });
    }

    // ============================================
    // STEP 7: Suspicious TLD Check
    // ============================================
    if (SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld))) {
      results.flags.push('suspicious_tld');
      results.score = Math.max(results.score, 0.30);
    }

    // ============================================
    // STEP 8: Excessive Hyphens Check
    // ============================================
    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
      results.flags.push('excessive_hyphens');
      results.score = Math.max(results.score, 0.20);
    }

    // ============================================
    // STEP 9: Multiple Digits Check
    // ============================================
    if (/\d{2,}/.test(domain)) {
      results.flags.push('contains_multiple_digits');
      results.score = Math.max(results.score, 0.15);
    }

    // ============================================
    // STEP 10: Domain Length Check
    // ============================================
    if (domain.length > 30) {
      results.flags.push('unusually_long_domain');
      results.score = Math.max(results.score, 0.15);
    }

    // ============================================
    // STEP 11: Database Pattern Matching
    // ============================================
    try {
      const patternMatches = await query(`
        SELECT phishing_id, domain_pattern, severity, target_brand
        FROM known_phishing_urls
        WHERE active = TRUE
      `);

      for (const pattern of patternMatches.rows) {
        // Convert wildcard pattern to regex
        const regexPattern = pattern.domain_pattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        
        try {
          const regex = new RegExp(`^${regexPattern}$`, 'i');
          
          if (regex.test(domain)) {
            results.flags.push('pattern_match');
            results.matches.push({
              type: 'pattern',
              pattern: pattern.domain_pattern,
              severity: pattern.severity,
              target_brand: pattern.target_brand,
              phishing_id: pattern.phishing_id
            });
            results.score = Math.max(results.score, 0.85);
          }
        } catch (e) {
          // Invalid regex, skip
        }
      }
    } catch (dbError) {
      console.log('Pattern matching skipped:', dbError.message);
    }

    // Ensure score doesn't exceed 1.0
    results.score = Math.min(results.score, 1.0);
    results.score = parseFloat(results.score.toFixed(4));

    return results;

  } catch (error) {
    console.error('❌ Domain analysis error:', error);
    // Return safe defaults on error
    return {
      component: 'domain',
      value: domain,
      score: 0,
      flags: ['analysis_error'],
      matches: [],
      error: error.message
    };
  }
}

module.exports = { 
  analyzeDomain,
  detectPunycodeIDN,
  detectBrandImpersonation,
  KNOWN_BRANDS,
  ALL_BRAND_NAMES,
  SUSPICIOUS_TLDS
};
