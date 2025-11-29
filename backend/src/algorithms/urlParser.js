/**
 * URL Parser for Phishing Detection
 * AnLink Anti-Phishing System
 * 
 * Handles URL parsing, normalization, and hashing with improved features.
 */

const crypto = require('crypto');

// ============================================
// URL SHORTENER LIST (for detection)
// ============================================
const URL_SHORTENERS = [
  'bit.ly', 'bitly.com', 'tinyurl.com', 'goo.gl', 't.co',
  'ow.ly', 'is.gd', 'buff.ly', 'j.mp', 'adf.ly',
  'tiny.cc', 'lnkd.in', 'db.tt', 'qr.ae', 'cur.lv'
];

/**
 * Parse URL into components for analysis
 * @param {string} url - The URL to parse
 * @returns {object} - Parsed URL components
 */
function parseURL(url) {
  try {
    // Normalize URL
    let normalizedUrl = url.trim();
    
    // Check for data URI
    if (normalizedUrl.toLowerCase().startsWith('data:')) {
      return {
        original_url: url,
        normalized_url: normalizedUrl,
        is_data_uri: true,
        scheme: 'data',
        domain: '',
        subdomain: '',
        hostname: '',
        tld: '',
        port: '',
        path: '',
        query: '',
        fragment: '',
        url_length: normalizedUrl.length,
        is_ip: false,
        is_shortener: false,
        url_hash: crypto.createHash('sha256').update(normalizedUrl).digest('hex')
      };
    }

    // Add https:// if no protocol specified
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Parse using URL object
    const parsedUrl = new URL(normalizedUrl);

    // Extract domain and subdomain
    const hostnameParts = parsedUrl.hostname.toLowerCase().split('.');
    let domain, subdomain, tld;

    if (hostnameParts.length >= 2) {
      // Get TLD (last part)
      tld = hostnameParts[hostnameParts.length - 1];
      
      // Handle special TLDs like .co.uk, .com.vn
      const specialTLDs = ['co.uk', 'com.vn', 'com.au', 'org.uk', 'net.au', 'com.br'];
      const lastTwo = hostnameParts.slice(-2).join('.');
      
      if (specialTLDs.includes(lastTwo) && hostnameParts.length > 2) {
        tld = lastTwo;
        domain = hostnameParts[hostnameParts.length - 3] + '.' + tld;
        subdomain = hostnameParts.length > 3 ? hostnameParts.slice(0, -3).join('.') : '';
      } else {
        domain = hostnameParts[hostnameParts.length - 2] + '.' + tld;
        subdomain = hostnameParts.length > 2 ? hostnameParts.slice(0, -2).join('.') : '';
      }
    } else {
      domain = parsedUrl.hostname;
      subdomain = '';
      tld = '';
    }

    // Check if IP address
    const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname);

    // Check if URL shortener
    const isShortener = URL_SHORTENERS.some(shortener => 
      parsedUrl.hostname === shortener || parsedUrl.hostname.endsWith('.' + shortener)
    );

    // Generate URL hash from normalized URL
    const urlHash = crypto
      .createHash('sha256')
      .update(normalizeURL(normalizedUrl))
      .digest('hex');

    // Return parsed components
    return {
      original_url: url,
      normalized_url: normalizedUrl.toLowerCase(),
      url_hash: urlHash,
      scheme: parsedUrl.protocol.replace(':', ''),
      hostname: parsedUrl.hostname.toLowerCase(),
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
      is_ip: isIP,
      is_shortener: isShortener,
      is_data_uri: false,
      url_length: normalizedUrl.length,
      
      // Username/password (rarely used legitimately)
      username: parsedUrl.username || '',
      password: parsedUrl.password || '',
      has_auth: !!(parsedUrl.username || parsedUrl.password)
    };

  } catch (error) {
    console.error('URL parsing error:', error.message);
    throw new Error(`Failed to parse URL: ${error.message}`);
  }
}

/**
 * Normalize a URL for consistent comparison
 * Implements all normalization rules from the design doc
 * @param {string} urlString - The URL to normalize
 * @returns {string} - Normalized URL
 */
function normalizeURL(urlString) {
  try {
    let normalized = urlString.trim();

    // Handle data URIs
    if (normalized.toLowerCase().startsWith('data:')) {
      return normalized.toLowerCase();
    }

    // 1. Convert to lowercase
    normalized = normalized.toLowerCase();

    // Add protocol if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    const urlObj = new URL(normalized);

    // 2. Remove trailing slash from path (except root)
    let path = urlObj.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // 3. Sort query parameters alphabetically
    const params = new URLSearchParams(urlObj.search);
    const sortedParams = new URLSearchParams([...params.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    const queryString = sortedParams.toString();

    // 4. Decode percent-encoding for safe characters
    // (We keep the query params encoded but sort them)
    
    // 5. Remove fragment
    // (Not included in normalized URL)

    // 6. Build normalized URL
    let result = `${urlObj.protocol}//${urlObj.hostname}`;
    
    // Add port only if non-standard
    if (urlObj.port && urlObj.port !== '443' && urlObj.port !== '80') {
      result += `:${urlObj.port}`;
    }
    
    result += path || '/';
    
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
 * Validate if string is a valid URL
 * @param {string} url - String to validate
 * @returns {boolean} - True if valid URL
 */
function isValidURL(url) {
  try {
    // Allow data URIs
    if (url.trim().toLowerCase().startsWith('data:')) {
      return true;
    }

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

/**
 * Extract the registrable domain (domain + TLD)
 * @param {string} hostname - The hostname to process
 * @returns {string} - Registrable domain
 */
function getRegistrableDomain(hostname) {
  const parts = hostname.toLowerCase().split('.');
  
  // Handle special TLDs
  const specialTLDs = ['co.uk', 'com.vn', 'com.au', 'org.uk', 'net.au', 'com.br'];
  const lastTwo = parts.slice(-2).join('.');
  
  if (specialTLDs.includes(lastTwo) && parts.length > 2) {
    return parts.slice(-3).join('.');
  }
  
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
  const urlParams = new URLSearchParams(queryString);
  
  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Decode URL-encoded string
 * @param {string} str - String to decode
 * @returns {string} - Decoded string
 */
function decodeURLComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Extract all URLs from a string (useful for finding hidden URLs)
 * @param {string} text - Text to search
 * @returns {Array} - Array of found URLs
 */
function extractURLs(text) {
  const urlPattern = /https?:\/\/[^\s<>"']+/gi;
  const matches = text.match(urlPattern) || [];
  return [...new Set(matches)];
}

module.exports = {
  parseURL,
  normalizeURL,
  generateURLHash,
  isValidURL,
  getRegistrableDomain,
  isIPAddress,
  parseQueryString,
  decodeURLComponent,
  extractURLs,
  URL_SHORTENERS
};
