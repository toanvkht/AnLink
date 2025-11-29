/**
 * Path Analyzer for URL Phishing Detection
 * AnLink Anti-Phishing System
 * 
 * Analyzes URL path components for phishing indicators.
 */

// ============================================
// SUSPICIOUS PATH KEYWORDS
// ============================================
const SUSPICIOUS_PATH_KEYWORDS = [
  // Authentication
  'verify', 'confirm', 'update', 'secure', 'account',
  'signin', 'sign-in', 'login', 'log-in', 'logon',
  'password', 'passwd', 'reset', 'recover', 'recovery',
  
  // Account status
  'suspended', 'locked', 'blocked', 'limited', 'restricted',
  'unusual', 'activity', 'alert', 'warning', 'notice',
  
  // Financial
  'billing', 'payment', 'invoice', 'transaction', 'transfer',
  'wallet', 'credit', 'debit', 'refund',
  
  // Verification
  'validate', 'authentication', 'authorize', 'authorization',
  'identity', 'verification', 'kyc',
  
  // Forms
  'form', 'submit', 'webscr', 'cgi-bin'
];

// ============================================
// DANGEROUS FILE EXTENSIONS
// ============================================
const DANGEROUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.com', '.pif',
  '.js', '.vbs', '.wsf', '.hta', '.jar',
  '.php', '.asp', '.aspx', '.jsp'
];

/**
 * Analyze URL path for suspicious patterns
 * @param {string} path - URL path
 * @param {object} components - Full URL components (optional)
 * @returns {object} - Analysis results
 */
function analyzePath(path, components = {}) {
  const results = {
    component: 'path',
    value: path || '/',
    score: 0,
    flags: [],
    details: {}
  };

  // If root path or empty, return safe
  if (!path || path === '/' || path === '') {
    results.flags.push('root_path');
    return results;
  }

  const pathLower = path.toLowerCase();

  // ============================================
  // CHECK 1: Suspicious Keywords
  // ============================================
  let keywordCount = 0;
  const foundKeywords = [];

  for (const keyword of SUSPICIOUS_PATH_KEYWORDS) {
    if (pathLower.includes(keyword)) {
      keywordCount++;
      foundKeywords.push(keyword);
    }
  }

  if (keywordCount > 0) {
    results.flags.push(`contains_${keywordCount}_suspicious_keywords`);
    results.score += Math.min(keywordCount * 0.20, 0.60);
    results.details.keywords_found = foundKeywords;
  }

  // ============================================
  // CHECK 2: Path Depth
  // ============================================
  const pathSegments = path.split('/').filter(p => p.length > 0);
  const pathDepth = pathSegments.length;
  
  if (pathDepth > 5) {
    results.flags.push(`deep_path_structure_${pathDepth}_levels`);
    results.score += 0.20;
    results.details.depth = pathDepth;
  }

  // ============================================
  // CHECK 3: Encoded Characters
  // ============================================
  const encodedMatches = path.match(/%[0-9A-Fa-f]{2}/g) || [];
  const encodedCount = encodedMatches.length;
  
  if (encodedCount > 0) {
    results.flags.push(`contains_${encodedCount}_encoded_characters`);
    results.score += Math.min(encodedCount * 0.05, 0.20);
    results.details.encoded_chars = encodedCount;
  }

  // ============================================
  // CHECK 4: Path Traversal Patterns
  // ============================================
  if (/\.\.\//.test(path) || /\.\.\\/.test(path)) {
    results.flags.push('path_traversal_pattern');
    results.score += 0.30;
  }

  // ============================================
  // CHECK 5: Dangerous File Extensions
  // ============================================
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (pathLower.endsWith(ext)) {
      results.flags.push(`dangerous_extension_${ext}`);
      results.score += 0.25;
      results.details.extension = ext;
      break;
    }
  }

  // ============================================
  // CHECK 6: Double Extensions (e.g., .pdf.exe)
  // ============================================
  const doubleExtMatch = pathLower.match(/\.[a-z]{2,4}\.[a-z]{2,4}$/);
  if (doubleExtMatch) {
    results.flags.push('double_extension_detected');
    results.score += 0.35;
    results.details.double_extension = doubleExtMatch[0];
  }

  // ============================================
  // CHECK 7: Random String Detection
  // ============================================
  // Check for segments that look like random strings (common in phishing)
  for (const segment of pathSegments) {
    // Long segment with no vowels (likely random)
    if (segment.length > 15 && !/[aeiou]/i.test(segment)) {
      results.flags.push('random_path_segment');
      results.score += 0.15;
      break;
    }
    
    // Very long hex-like strings
    if (/^[a-f0-9]{20,}$/i.test(segment)) {
      results.flags.push('hex_string_in_path');
      results.score += 0.10;
      break;
    }
  }

  // ============================================
  // CHECK 8: Suspicious Directory Names
  // ============================================
  const suspiciousDirs = ['wp-admin', 'admin', 'administrator', 'includes', 'tmp', 'temp'];
  for (const dir of suspiciousDirs) {
    if (pathSegments.includes(dir)) {
      results.flags.push(`suspicious_directory_${dir}`);
      results.score += 0.10;
      break;
    }
  }

  // ============================================
  // CHECK 9: Long Path
  // ============================================
  if (path.length > 100) {
    results.flags.push(`very_long_path_${path.length}_chars`);
    results.score += 0.15;
  }

  // ============================================
  // CHECK 10: Hidden Files/Directories
  // ============================================
  if (pathSegments.some(seg => seg.startsWith('.'))) {
    results.flags.push('hidden_file_or_directory');
    results.score += 0.20;
  }

  // ============================================
  // FINAL: Cap score at 1.0
  // ============================================
  results.score = Math.min(results.score, 1.0);
  results.score = parseFloat(results.score.toFixed(4));

  return results;
}

module.exports = { 
  analyzePath,
  SUSPICIOUS_PATH_KEYWORDS,
  DANGEROUS_EXTENSIONS
};
