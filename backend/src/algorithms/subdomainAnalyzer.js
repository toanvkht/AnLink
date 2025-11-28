/**
 * Analyze subdomain for suspicious patterns
 * @param {string} subdomain - Subdomain to analyze
 * @param {string} domain - Main domain
 * @param {object} components - Full URL components
 * @returns {object} - Analysis results
 */
function analyzeSubdomain(subdomain, domain, components) {
  const results = {
    component: 'subdomain',
    value: subdomain || '',
    score: 0,
    flags: []
  };

  // If no subdomain, return safe
  if (!subdomain || subdomain.length === 0) {
    results.flags.push('no_subdomain');
    return results;
  }

  const subdomainLower = subdomain.toLowerCase();

  // Suspicious keywords commonly used in phishing
  const suspiciousKeywords = [
    'secure', 'login', 'verify', 'account', 'update',
    'confirm', 'banking', 'wallet', 'authentication',
    'signin', 'password', 'security', 'validation',
    'support', 'help', 'customer', 'service'
  ];

  let keywordCount = 0;
  const foundKeywords = [];

  for (const keyword of suspiciousKeywords) {
    if (subdomainLower.includes(keyword)) {
      keywordCount++;
      foundKeywords.push(keyword);
    }
  }

  if (keywordCount > 0) {
    results.flags.push(`contains_${keywordCount}_suspicious_keywords`);
    results.score += Math.min(keywordCount * 0.15, 0.45);
    results.keywords_found = foundKeywords;
  }

  // Check subdomain length
  if (subdomain.length > 30) {
    results.flags.push('unusually_long_subdomain');
    results.score += 0.20;
  }

  // Check for multiple subdomain levels (e.g., secure.login.example.com)
  const subdomainLevels = subdomain.split('.').length;
  if (subdomainLevels >= 2) {
    results.flags.push(`multiple_subdomain_levels_${subdomainLevels}`);
    results.score += subdomainLevels * 0.10;
  }

  // Check for numbers
  if (/\d{2,}/.test(subdomain)) {
    results.flags.push('contains_multiple_digits');
    results.score += 0.15;
  }

  // Check for hyphens
  const hyphenCount = (subdomain.match(/-/g) || []).length;
  if (hyphenCount >= 2) {
    results.flags.push('multiple_hyphens');
    results.score += 0.10;
  }

  // Cap score at 1.0
  results.score = Math.min(results.score, 1.0);
  results.score = parseFloat(results.score.toFixed(4));

  return results;
}

module.exports = { analyzeSubdomain };