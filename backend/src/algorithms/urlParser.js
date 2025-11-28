const crypto = require('crypto');

/**
 * Parse URL into components for analysis
 * @param {string} url - The URL to parse
 * @returns {object} - Parsed URL components
 */
function parseURL(url) {
  try {
    // Normalize URL
    let normalizedUrl = url.trim().toLowerCase();
    
    // Add https:// if no protocol specified
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Parse using URL object
    const parsedUrl = new URL(normalizedUrl);

    // Extract domain and subdomain
    const hostnameParts = parsedUrl.hostname.split('.');
    let domain, subdomain, tld;

    if (hostnameParts.length >= 2) {
      // Get TLD (last part)
      tld = hostnameParts[hostnameParts.length - 1];
      
      // Get domain (second to last + TLD)
      domain = hostnameParts[hostnameParts.length - 2] + '.' + tld;
      
      // Get subdomain (everything before domain)
      if (hostnameParts.length > 2) {
        subdomain = hostnameParts.slice(0, -2).join('.');
      } else {
        subdomain = '';
      }
    } else {
      domain = parsedUrl.hostname;
      subdomain = '';
      tld = '';
    }

    // Generate URL hash
    const urlHash = crypto
      .createHash('sha256')
      .update(normalizedUrl)
      .digest('hex');

    // Return parsed components
    return {
      original_url: url,
      normalized_url: normalizedUrl,
      url_hash: urlHash,
      scheme: parsedUrl.protocol.replace(':', ''),
      hostname: parsedUrl.hostname,
      domain: domain,
      subdomain: subdomain,
      tld: tld,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80'),
      path: parsedUrl.pathname || '/',
      query: parsedUrl.search.replace('?', ''),
      fragment: parsedUrl.hash.replace('#', ''),
      
      // Additional metadata
      full_domain: parsedUrl.hostname,
      has_subdomain: subdomain.length > 0,
      is_ip: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname),
      url_length: normalizedUrl.length
    };

  } catch (error) {
    throw new Error(`Failed to parse URL: ${error.message}`);
  }
}

/**
 * Validate if string is a valid URL
 * @param {string} url - String to validate
 * @returns {boolean} - True if valid URL
 */
function isValidURL(url) {
  try {
    let testUrl = url.trim();
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = 'https://' + testUrl;
    }
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  parseURL,
  isValidURL
};