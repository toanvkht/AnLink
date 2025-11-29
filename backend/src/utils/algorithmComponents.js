/**
 * Analyze domain similarity
 */
function analyzeDomain(targetDomain, knownPhishingDomains, legitimateBrands) {
  let score = 0.0;
  const flags = [];

  // Check exact match in phishing database
  if (knownPhishingDomains.includes(targetDomain)) {
    return {
      score: 1.0,
      flags: ['exact_match_phishing_db'],
      reason: 'Domain found in phishing database',
    };
  }

  // Check exact match in legitimate brands
  if (legitimateBrands.includes(targetDomain)) {
    return {
      score: 0.0,
      flags: ['exact_match_legitimate'],
      reason: 'Domain is a known legitimate brand',
    };
  }

  // Check for suspicious patterns
  if (targetDomain.includes('-')) {
    score += 0.15;
    flags.push('contains_hyphen');
  }

  if (targetDomain.length > 20) {
    score += 0.1;
    flags.push('long_domain');
  }

  // Check for common phishing keywords
  const phishingKeywords = ['secure', 'verify', 'account', 'login', 'update', 'confirm'];
  phishingKeywords.forEach((keyword) => {
    if (targetDomain.toLowerCase().includes(keyword)) {
      score += 0.15;
      flags.push(`keyword_${keyword}`);
    }
  });

  return {
    score: Math.min(score, 1.0),
    flags,
    reason: flags.length > 0 ? 'Suspicious patterns detected' : 'No issues found',
  };
}

/**
 * Analyze subdomain
 */
function analyzeSubdomain(subdomain, domain, knownBrands) {
  let score = 0.0;
  const flags = [];

  if (!subdomain) {
    return { score: 0.0, flags: ['no_subdomain'] };
  }

  // Check for suspicious keywords
  const suspiciousKeywords = [
    'secure',
    'login',
    'verify',
    'account',
    'update',
    'confirm',
    'banking',
    'wallet',
  ];

  subdomain.toLowerCase().split('.').forEach((part) => {
    suspiciousKeywords.forEach((keyword) => {
      if (part.includes(keyword)) {
        score += 0.15;
        flags.push(`keyword_${keyword}`);
      }
    });
  });

  // Check if brand name appears in subdomain
  knownBrands.forEach((brand) => {
    if (subdomain.toLowerCase().includes(brand.toLowerCase()) && 
        !domain.toLowerCase().includes(brand.toLowerCase())) {
      score += 0.35;
      flags.push(`brand_in_subdomain_${brand}`);
    }
  });

  // Check subdomain length
  if (subdomain.length > 30) {
    score += 0.2;
    flags.push('unusually_long_subdomain');
  }

  // Check for multiple levels
  const levels = subdomain.split('.').length;
  if (levels >= 2) {
    score += levels * 0.1;
    flags.push(`multiple_subdomain_levels_${levels}`);
  }

  return {
    score: Math.min(score, 1.0),
    flags,
  };
}

/**
 * Analyze path
 */
function analyzePath(path, domain) {
  let score = 0.0;
  const flags = [];

  if (!path || path === '/') {
    return { score: 0.0, flags: ['root_path'] };
  }

  // Suspicious path keywords
  const suspiciousKeywords = [
    'verify',
    'confirm',
    'update',
    'secure',
    'account',
    'signin',
    'login',
    'password',
    'reset',
  ];

  suspiciousKeywords.forEach((keyword) => {
    if (path.toLowerCase().includes(keyword)) {
      score += 0.2;
      flags.push(`keyword_${keyword}`);
    }
  });

  // Check path depth
  const depth = path.split('/').filter((p) => p).length;
  if (depth > 5) {
    score += 0.2;
    flags.push(`deep_path_${depth}_levels`);
  }

  // Check for encoded characters
  if (path.includes('%')) {
    const encodedCount = (path.match(/%/g) || []).length;
    score += Math.min(encodedCount * 0.05, 0.2);
    flags.push(`encoded_characters_${encodedCount}`);
  }

  return {
    score: Math.min(score, 1.0),
    flags,
  };
}

/**
 * Analyze query parameters
 */
function analyzeQueryParams(queryString) {
  let score = 0.0;
  const flags = [];

  if (!queryString) {
    return { score: 0.0, flags: ['no_query_params'] };
  }

  // Suspicious parameter names
  const suspiciousParams = ['redirect', 'return', 'goto', 'url', 'link', 'next'];

  suspiciousParams.forEach((param) => {
    if (queryString.toLowerCase().includes(`${param}=`)) {
      score += 0.25;
      flags.push(`suspicious_param_${param}`);
    }
  });

  // Check if query contains URLs
  if (queryString.includes('http://') || queryString.includes('https://')) {
    score += 0.3;
    flags.push('url_in_params');
  }

  // Check query length
  if (queryString.length > 100) {
    score += 0.15;
    flags.push('very_long_query');
  }

  return {
    score: Math.min(score, 1.0),
    flags,
  };
}

/**
 * Heuristic checks
 */
function heuristicChecks(urlComponents, domain) {
  let score = 0.0;
  const flags = [];

  // Check if HTTP instead of HTTPS
  if (urlComponents.scheme === 'http') {
    const financialKeywords = ['bank', 'pay', 'wallet', 'credit', 'finance'];
    if (financialKeywords.some((kw) => domain.toLowerCase().includes(kw))) {
      score += 0.4;
      flags.push('http_on_financial_domain');
    }
  }

  // Check if IP address
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    score += 0.5;
    flags.push('ip_address_used');
  }

  // Check for suspicious TLDs
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
  if (suspiciousTlds.some((tld) => domain.endsWith(tld))) {
    score += 0.3;
    flags.push('suspicious_tld');
  }

  // Check for excessive hyphens
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    score += 0.2;
    flags.push(`excessive_hyphens_${hyphenCount}`);
  }

  return {
    score: Math.min(score, 1.0),
    flags,
  };
}

module.exports = {
  analyzeDomain,
  analyzeSubdomain,
  analyzePath,
  analyzeQueryParams,
  heuristicChecks,
};