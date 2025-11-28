/**
 * Analyze URL query parameters for suspicious patterns
 * @param {string} query - Query string
 * @param {object} components - Full URL components
 * @returns {object} - Analysis results
 */
function analyzeQuery(query, components) {
  const results = {
    component: 'query',
    value: query || '',
    score: 0,
    flags: []
  };

  // If no query params, return safe
  if (!query || query.length === 0) {
    results.flags.push('no_query_params');
    return results;
  }

  // Parse query parameters
  const params = new URLSearchParams(query);
  const paramCount = Array.from(params.keys()).length;

  // Suspicious parameter names
  const suspiciousParams = [
    'redirect', 'return', 'goto', 'url', 'link', 'next',
    'continue', 'target', 'destination', 'forward', 'redir'
  ];

  const foundSuspicious = [];

  for (const [key, value] of params.entries()) {
    const keyLower = key.toLowerCase();

    // Check suspicious param names
    if (suspiciousParams.includes(keyLower)) {
      results.flags.push(`suspicious_param_name_${key}`);
      results.score += 0.25;
      foundSuspicious.push(key);
    }

    // Check for very long values
    if (value.length > 100) {
      results.flags.push(`very_long_param_value_${key}`);
      results.score += 0.15;
    }

    // Check if value looks like a URL (open redirect risk)
    if (value.startsWith('http://') || value.startsWith('https://')) {
      results.flags.push(`url_in_param_${key}`);
      results.score += 0.30;
    }
  }

  if (foundSuspicious.length > 0) {
    results.suspicious_params = foundSuspicious;
  }

  // Check total number of parameters
  if (paramCount > 10) {
    results.flags.push(`many_parameters_${paramCount}`);
    results.score += 0.20;
  }

  // Cap score at 1.0
  results.score = Math.min(results.score, 1.0);
  results.score = parseFloat(results.score.toFixed(4));

  return results;
}

module.exports = { analyzeQuery };