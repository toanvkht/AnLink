/**
 * URL Parser Utility
 * AnLink Anti-Phishing System
 * 
 * Handles URL parsing, normalization, and hashing for phishing detection.
 */

const crypto = require('crypto');

/**
 * Parse a URL into its components
 * @param {string} urlString - The URL to parse
 * @returns {object} - Parsed URL components
 */
function parseURL(urlString) {
  try {
    // Add protocol if missing
    let normalizedInput = urlString.trim();
    if (!normalizedInput.match(/^https?:\/\//i)) {
      normalizedInput = 'https://' + normalizedInput;
    }

    const urlObj = new URL(normalizedInput);
    
    // Extract domain parts
    const hostnameParts = urlObj.hostname.toLowerCase().split('.');
    const tld = hostnameParts.length >= 2 ? hostnameParts.slice(-1).join('.') : '';
    const domain = hostnameParts.length >= 2 ? hostnameParts.slice(-2).join('.') : urlObj.hostname;
    const subdomain = hostnameParts.length > 2 ? hostnameParts.slice(0, -2).join('.') : '';

    return {
      original: urlString,
      normalized: normalizedInput.toLowerCase(),
      scheme: urlObj.protocol.replace(':', ''),
      hostname: urlObj.hostname.toLowerCase(),
      domain: domain,
      subdomain: subdomain,
      tld: tld,
      port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
      path: urlObj.pathname || '/',
      query: urlObj.search ? urlObj.search.substring(1) : '',
      fragment: urlObj.hash ? urlObj.hash.substring(1) : '',
      username: urlObj.username || '',
      password: urlObj.password || ''
    };
  } catch (error) {
    console.error('URL parsing error:', error.message);
    return null;
  }
}

/**
 * Normalize a URL for consistent comparison
 * @param {string} urlString - The URL to normalize
 * @returns {string} - Normalized URL
 */
function normalizeURL(urlString) {
  try {
    let normalized = urlString.trim().toLowerCase();
    
    // Add protocol if missing
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }

    const urlObj = new URL(normalized);
    
    // Remove trailing slash from path (except root)
    let path = urlObj.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Sort query parameters for consistent comparison
    const params = new URLSearchParams(urlObj.search);
    const sortedParams = new URLSearchParams([...params.entries()].sort());
    const queryString = sortedParams.toString();

    // Rebuild normalized URL (without fragment)
    let result = `${urlObj.protocol}//${urlObj.hostname}`;
    if (urlObj.port && urlObj.port !== '443' && urlObj.port !== '80') {
      result += `:${urlObj.port}`;
    }
    result += path;
    if (queryString) {
      result += `?${queryString}`;
    }

    return result;
  } catch (error) {
    console.error('URL normalization error:', error.message);
    return urlString.toLowerCase().trim();
  }
}

/**
 * Generate SHA-256 hash of a URL
 * @param {string} urlString - The URL to hash
 * @returns {string} - SHA-256 hash (64 characters)
 */
function generateURLHash(urlString) {
  const normalized = normalizeURL(urlString);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Validate if a string is a valid URL
 * @param {string} urlString - The string to validate
 * @returns {boolean} - True if valid URL
 */
function isValidURL(urlString) {
  try {
    let testUrl = urlString.trim();
    if (!testUrl.match(/^https?:\/\//i)) {
      testUrl = 'https://' + testUrl;
    }
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract the registrable domain (domain + TLD)
 * @param {string} hostname - The hostname to process
 * @returns {string} - Registrable domain
 */
function getRegistrableDomain(hostname) {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

/**
 * Check if hostname is an IP address
 * @param {string} hostname - The hostname to check
 * @returns {boolean} - True if IP address
 */
function isIPAddress(hostname) {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
}

/**
 * Parse query string into object
 * @param {string} queryString - Query string without leading '?'
 * @returns {object} - Key-value pairs
 */
function parseQueryString(queryString) {
  if (!queryString) return {};
  
  const params = {};
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(decodeURIComponent);
    if (key) {
      params[key] = value || '';
    }
  }
  
  return params;
}

module.exports = {
  parseURL,
  normalizeURL,
  generateURLHash,
  isValidURL,
  getRegistrableDomain,
  isIPAddress,
  parseQueryString
};