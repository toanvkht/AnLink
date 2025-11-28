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

    // Check exact match in known phishing URLs
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

    // Get legitimate brands for comparison
    const legitimateBrands = await query(`
      SELECT DISTINCT domain
      FROM suspicious_urls
      WHERE status = 'safe'
      LIMIT 100
    `);

    let maxSimilarity = 0;
    let bestMatch = null;

    // Compare against legitimate brands
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

    // Check pattern matches in known phishing
    const patternMatches = await query(`
      SELECT phishing_id, domain_pattern, severity, target_brand
      FROM known_phishing_urls
      WHERE active = TRUE
    `);

    for (const pattern of patternMatches.rows) {
      // Simple wildcard pattern matching
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

    // Typosquatting detection
    if (bestMatch && maxSimilarity >= 0.75) {
      results.flags.push('high_similarity_to_legitimate');
      results.matches.push(bestMatch);
      results.score = Math.max(results.score, maxSimilarity);
    }

    // Check for suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.club'];
    if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
      results.flags.push('suspicious_tld');
      results.score = Math.max(results.score, 0.3);
    }

    // Check for excessive hyphens
    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount >= 3) {
      results.flags.push('excessive_hyphens');
      results.score = Math.max(results.score, 0.2);
    }

    // Check for numbers in domain
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