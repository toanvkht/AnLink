/**
 * Analyze URL path for suspicious patterns
 * @param {string} path - URL path
 * @param {object} components - Full URL components
 * @returns {object} - Analysis results
 */
function analyzePath(path, components) {
  const results = {
    component: 'path',
    value: path || '/',
    score: 0,
    flags: []
  };

  // If root path, return safe
  if (!path || path === '/') {
    results.flags.push('root_path');
    return results;
  }

  const pathLower = path.toLowerCase();

  // Suspicious path keywords
  const suspiciousKeywords = [
    'verify', 'confirm', 'update', 'secure', 'account',
    'signin', 'login', 'password', 'reset', 'suspended',
    'locked', 'unusual', 'activity', 'validate', 'authentication',
    'billing', 'payment', 'invoice'
  ];

  let keywordCount = 0;
  const foundKeywords = [];

  for (const keyword of suspiciousKeywords) {
    if (pathLower.includes(keyword)) {
      keywordCount++;
      foundKeywords.push(keyword);
    }
  }

  if (keywordCount > 0) {
    results.flags.push(`contains_${keywordCount}_suspicious_keywords`);
    results.score += Math.min(keywordCount * 0.20, 0.60);
    results.keywords_found = foundKeywords;
  }

  // Check path depth
  const pathDepth = path.split('/').filter(p => p.length > 0).length;
  if (pathDepth > 5) {
    results.flags.push(`deep_path_structure_${pathDepth}_levels`);
    results.score += 0.20;
  }

  // Check for encoded characters
  const encodedCount = (path.match(/%/g) || []).length;
  if (encodedCount > 0) {
    results.flags.push(`contains_${encodedCount}_encoded_characters`);
    results.score += Math.min(encodedCount * 0.05, 0.20);
  }

  // Check for path traversal patterns
  if (/\.\.\//.test(path)) {
    results.flags.push('path_traversal_pattern');
    results.score += 0.30;
  }

  // Cap score at 1.0
  results.score = Math.min(results.score, 1.0);
  results.score = parseFloat(results.score.toFixed(4));

  return results;
}

module.exports = { analyzePath };