const { combinedSimilarity } = require('./similarityMetrics');
const { query } = require('../config/database');

/**
 * Analyze domain against known phishing patterns and legitimate brands
 * @param {string} domain - Domain to analyze
 * @param {object} components - Full URL components
 * @returns {object} - Analysis results
 */
async function analyzeDomain(domain, components) {
  try {
    const results = {
      component: 'domain',
      value: domain,
      score: 0,
      flags: [],
      matches: []
    };

    // ✅ STEP 1: Check if domain is in legitimate brands FIRST
    const legitimateCheck = await query(`
      SELECT domain
      FROM suspicious_urls
      WHERE domain = $1 AND status = 'safe'
      LIMIT 1
    `, [domain]);

    if (legitimateCheck.rows.length > 0) {
      // This is a known legitimate domain - mark as safe immediately
      results.score = 0;
      results.flags.push('known_legitimate_domain');
      results.matches.push({
        type: 'exact_legitimate',
        domain: legitimateCheck.rows[0].domain
      });
      return results;  // ✅ Return early - don't check phishing patterns
    }

    // ✅ STEP 2: Check exact match in known phishing URLs (only if not legitimate)
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

    // ✅ STEP 3: Get ALL legitimate brands for similarity comparison
    const legitimateBrands = await query(`
      SELECT DISTINCT domain
      FROM suspicious_urls
      WHERE status = 'safe'
      ORDER BY domain
    `);

    // Create a Set for quick lookup
    const legitimateDomainSet = new Set(legitimateBrands.rows.map(b => b.domain));

    let maxSimilarity = 0;
    let bestMatch = null;

    // ✅ STEP 4: Compare against legitimate brands
    for (const brand of legitimateBrands.rows) {
      const similarity = combinedSimilarity(domain, brand.domain);
      
      if (similarity.weighted > maxSimilarity) {
        maxSimilarity = similarity.weighted;
        bestMatch = {
          legitimate_domain: brand.domain,
          similarity: similarity,
          score: similarity.weighted
        };
      }
    }

    // ✅ STEP 5: Check pattern matches (only if domain is NOT in legitimate set)
    const patternMatches = await query(`
      SELECT phishing_id, domain_pattern, severity, target_brand
      FROM known_phishing_urls
      WHERE active = TRUE
    `);

    for (const pattern of patternMatches.rows) {
      // Skip if the domain is a known legitimate domain
      if (legitimateDomainSet.has(domain)) {
        continue;
      }

      // Convert wildcard pattern to regex
      const regexPattern = pattern.domain_pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      try {
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        
        // Only flag as phishing if:
        // 1. Pattern matches AND
        // 2. Domain is NOT in the legitimate set
        if (regex.test(domain) && !legitimateDomainSet.has(domain)) {
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

    // ✅ STEP 6: Typosquatting detection (high similarity to legitimate but NOT exact)
    if (bestMatch && maxSimilarity >= 0.75 && maxSimilarity < 1.0) {
      // High similarity but NOT exact match = likely typosquatting
      results.flags.push('high_similarity_to_legitimate');
      results.matches.push(bestMatch);
      results.score = Math.max(results.score, maxSimilarity);
    }

    // ✅ STEP 7: Check for suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.club'];
    if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
      results.flags.push('suspicious_tld');
      results.score = Math.max(results.score, 0.3);
    }

    // ✅ STEP 8: Check for excessive hyphens
    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
      results.flags.push('excessive_hyphens');
      results.score = Math.max(results.score, 0.2);
    }

    // ✅ STEP 9: Check for numbers in domain
    if (/\d{2,}/.test(domain)) {
      results.flags.push('contains_multiple_digits');
      results.score = Math.max(results.score, 0.15);
    }

    return results;

  } catch (error) {
    console.error('❌ Domain analysis error:', error);
    throw error;
  }
}

module.exports = { analyzeDomain };