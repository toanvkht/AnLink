/**
 * Perform heuristic checks on URL components
 * @param {object} components - Parsed URL components
 * @returns {object} - Heuristic analysis results
 */
function analyzeHeuristics(components) {
  const results = {
    component: 'heuristics',
    score: 0,
    flags: []
  };

  // Check 1: HTTP instead of HTTPS for banking/financial keywords
  if (components.scheme === 'http') {
    const financialKeywords = ['bank', 'pay', 'wallet', 'credit', 'finance', 'visa', 'mastercard'];
    const hasFinancialKeyword = financialKeywords.some(keyword => 
      components.domain.includes(keyword) || 
      components.subdomain.includes(keyword) ||
      components.path.includes(keyword)
    );
    
    if (hasFinancialKeyword) {
      results.flags.push('http_on_financial_domain');
      results.score += 0.40;
    } else {
      results.flags.push('http_protocol_used');
      results.score += 0.15;
    }
  }

  // Check 2: IP address instead of domain name
  if (components.is_ip) {
    results.flags.push('ip_address_used');
    results.score += 0.50;
  }

  // Check 3: Suspicious TLD
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.club', '.pw'];
  if (suspiciousTLDs.some(tld => components.domain.endsWith(tld))) {
    results.flags.push('suspicious_tld');
    results.score += 0.30;
  }

  // Check 4: Non-standard port
  const standardPorts = ['80', '443'];
  if (!standardPorts.includes(components.port)) {
    results.flags.push(`non_standard_port_${components.port}`);
    results.score += 0.20;
  }

  // Check 5: Excessive URL length
  if (components.url_length > 75) {
    results.flags.push(`excessive_length_${components.url_length}_chars`);
    results.score += 0.15;
  }

  // Check 6: @ symbol in URL (can hide real domain)
  if (components.original_url.includes('@')) {
    results.flags.push('at_symbol_in_url');
    results.score += 0.50;
  }

  // Check 7: Too many subdomains
  const subdomainCount = components.subdomain ? components.subdomain.split('.').length : 0;
  if (subdomainCount > 3) {
    results.flags.push(`excessive_subdomains_${subdomainCount}`);
    results.score += 0.25;
  }

  // Check 8: Excessive hyphens in full domain
  const hyphenCount = (components.full_domain.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    results.flags.push(`excessive_hyphens_${hyphenCount}`);
    results.score += 0.20;
  }

  // Check 9: Mixed case in domain (unusual)
  if (components.original_url !== components.normalized_url) {
    const domainPart = components.original_url.split('/')[2] || '';
    if (domainPart && domainPart !== domainPart.toLowerCase()) {
      results.flags.push('mixed_case_domain');
      results.score += 0.10;
    }
  }

  // Check 10: Common phishing keywords in full URL
  const phishingKeywords = ['verify', 'secure', 'account', 'update', 'login', 'signin', 'confirm', 'suspended', 'locked'];
  const fullUrl = components.normalized_url.toLowerCase();
  let keywordCount = 0;
  
  for (const keyword of phishingKeywords) {
    if (fullUrl.includes(keyword)) {
      keywordCount++;
    }
  }
  
  if (keywordCount >= 3) {
    results.flags.push(`multiple_phishing_keywords_${keywordCount}`);
    results.score += 0.20;
  }

  // Cap score at 1.0
  results.score = Math.min(results.score, 1.0);
  results.score = parseFloat(results.score.toFixed(4));

  return results;
}

module.exports = { analyzeHeuristics };