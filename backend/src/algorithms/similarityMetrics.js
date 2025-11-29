/**
 * Similarity Metrics for URL Component Analysis
 * AnLink Anti-Phishing System
 * 
 * Implements multiple string similarity algorithms for phishing detection.
 */

// ============================================
// HOMOGLYPH MAP - Characters that look similar
// ============================================
const HOMOGLYPHS = {
  'a': ['à', 'á', 'â', 'ã', 'ä', 'å', 'ª', 'α', 'а', '@', '4'],
  'b': ['ß', 'β', 'ь', '6', '8'],
  'c': ['ç', 'с', 'ϲ', '(', '¢'],
  'd': ['đ', 'ð', 'δ'],
  'e': ['è', 'é', 'ê', 'ë', 'е', 'ε', '3', '€'],
  'f': ['ƒ'],
  'g': ['9', 'q', 'ğ'],
  'h': ['н', 'һ'],
  'i': ['ì', 'í', 'î', 'ï', 'ı', 'і', 'ι', '1', 'l', '|', '!'],
  'j': ['ј'],
  'k': ['κ', 'к'],
  'l': ['1', 'ı', 'l', '|', 'ł', 'і'],
  'm': ['м', 'rn'],
  'n': ['ñ', 'η', 'п'],
  'o': ['ò', 'ó', 'ô', 'õ', 'ö', 'о', 'ο', '0', 'ø'],
  'p': ['ρ', 'р'],
  'q': ['9', 'g'],
  'r': ['г', 'ř'],
  's': ['5', '$', 'ѕ', 'ș'],
  't': ['τ', 'т', '+', '7'],
  'u': ['ù', 'ú', 'û', 'ü', 'μ', 'υ', 'ц'],
  'v': ['ν', 'υ'],
  'w': ['ω', 'ш', 'vv'],
  'x': ['х', '×'],
  'y': ['ý', 'ÿ', 'у', 'γ'],
  'z': ['2', 'ž', 'ż']
};

// Reverse homoglyph map for quick lookup
const REVERSE_HOMOGLYPHS = {};
Object.entries(HOMOGLYPHS).forEach(([ascii, lookalikes]) => {
  lookalikes.forEach(lookalike => {
    REVERSE_HOMOGLYPHS[lookalike] = ascii;
  });
});

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create 2D array
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate normalized Levenshtein similarity (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function levenshteinSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  
  return 1 - (distance / maxLen);
}

/**
 * Calculate Jaro similarity
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Jaro similarity (0-1)
 */
function jaroSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const len1 = str1.length;
  const len2 = str2.length;

  // Maximum allowed distance
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
  );
}

/**
 * Calculate Jaro-Winkler similarity
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @param {number} scalingFactor - Scaling factor (default 0.1)
 * @returns {number} - Jaro-Winkler similarity (0-1)
 */
function jaroWinklerSimilarity(str1, str2, scalingFactor = 0.1) {
  const jaro = jaroSimilarity(str1, str2);

  // Calculate common prefix length (max 4)
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
  
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  return jaro + (prefixLength * scalingFactor * (1 - jaro));
}

/**
 * Calculate token-based similarity (Jaccard)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Jaccard similarity (0-1)
 */
function tokenSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  // Split by common delimiters
  const tokens1 = new Set(str1.toLowerCase().split(/[-._]/));
  const tokens2 = new Set(str2.toLowerCase().split(/[-._]/));

  // Calculate intersection
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  
  // Calculate union
  const union = new Set([...tokens1, ...tokens2]);

  return intersection.size / union.size;
}

/**
 * Calculate longest common substring ratio
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - LCS similarity (0-1)
 */
function lcsSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  let maxLen = 0;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
        maxLen = Math.max(maxLen, matrix[i][j]);
      }
    }
  }

  return (2 * maxLen) / (len1 + len2);
}

/**
 * Detect homoglyphs in a string
 * @param {string} str - String to check
 * @returns {object} - Detection result with normalized string and found homoglyphs
 */
function detectHomoglyphs(str) {
  if (!str) return { detected: false, homoglyphs: [], normalized: str };

  const homoglyphsFound = [];
  let normalized = str;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const asciiEquivalent = REVERSE_HOMOGLYPHS[char];
    
    if (asciiEquivalent) {
      homoglyphsFound.push({
        char: char,
        position: i,
        looks_like: asciiEquivalent
      });
      normalized = normalized.substring(0, i) + asciiEquivalent + normalized.substring(i + 1);
    }
  }

  // Calculate score based on number of homoglyphs found
  const score = homoglyphsFound.length > 0 
    ? Math.min(homoglyphsFound.length * 0.25, 0.75) 
    : 0;

  return {
    detected: homoglyphsFound.length > 0,
    homoglyphs: homoglyphsFound,
    normalized: normalized,
    score: score
  };
}

/**
 * Normalize homoglyphs in a string to ASCII equivalents
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 */
function normalizeHomoglyphs(str) {
  if (!str) return str;
  
  let normalized = str;
  for (const char of str) {
    const asciiEquivalent = REVERSE_HOMOGLYPHS[char];
    if (asciiEquivalent) {
      normalized = normalized.replace(char, asciiEquivalent);
    }
  }
  return normalized;
}

/**
 * Check if two strings are similar when homoglyphs are normalized
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {object} - Comparison result
 */
function compareWithHomoglyphNormalization(str1, str2) {
  const normalized1 = normalizeHomoglyphs(str1.toLowerCase());
  const normalized2 = normalizeHomoglyphs(str2.toLowerCase());
  
  const exactMatch = normalized1 === normalized2;
  const similarity = levenshteinSimilarity(normalized1, normalized2);
  
  return {
    original: { str1, str2 },
    normalized: { str1: normalized1, str2: normalized2 },
    exactMatch: exactMatch,
    similarity: similarity,
    potentialHomoglyphAttack: !exactMatch && str1.toLowerCase() !== normalized1 && similarity > 0.8
  };
}

/**
 * Detect keyboard proximity typosquatting
 * @param {string} domain - Domain to check
 * @param {string} brand - Brand to compare
 * @returns {object} - Detection result
 */
function detectKeyboardTyposquatting(domain, brand) {
  // QWERTY keyboard proximity map
  const keyboardProximity = {
    'q': ['w', 'a'],
    'w': ['q', 'e', 'a', 's'],
    'e': ['w', 'r', 's', 'd'],
    'r': ['e', 't', 'd', 'f'],
    't': ['r', 'y', 'f', 'g'],
    'y': ['t', 'u', 'g', 'h'],
    'u': ['y', 'i', 'h', 'j'],
    'i': ['u', 'o', 'j', 'k'],
    'o': ['i', 'p', 'k', 'l'],
    'p': ['o', 'l'],
    'a': ['q', 'w', 's', 'z'],
    's': ['a', 'w', 'e', 'd', 'z', 'x'],
    'd': ['s', 'e', 'r', 'f', 'x', 'c'],
    'f': ['d', 'r', 't', 'g', 'c', 'v'],
    'g': ['f', 't', 'y', 'h', 'v', 'b'],
    'h': ['g', 'y', 'u', 'j', 'b', 'n'],
    'j': ['h', 'u', 'i', 'k', 'n', 'm'],
    'k': ['j', 'i', 'o', 'l', 'm'],
    'l': ['k', 'o', 'p'],
    'z': ['a', 's', 'x'],
    'x': ['z', 's', 'd', 'c'],
    'c': ['x', 'd', 'f', 'v'],
    'v': ['c', 'f', 'g', 'b'],
    'b': ['v', 'g', 'h', 'n'],
    'n': ['b', 'h', 'j', 'm'],
    'm': ['n', 'j', 'k']
  };

  const domainLower = domain.toLowerCase();
  const brandLower = brand.toLowerCase();
  
  if (domainLower.length !== brandLower.length) {
    return { detected: false };
  }

  const typos = [];
  let differences = 0;

  for (let i = 0; i < domainLower.length; i++) {
    if (domainLower[i] !== brandLower[i]) {
      differences++;
      const proximityChars = keyboardProximity[brandLower[i]] || [];
      if (proximityChars.includes(domainLower[i])) {
        typos.push({
          position: i,
          expected: brandLower[i],
          found: domainLower[i],
          type: 'keyboard_proximity'
        });
      }
    }
  }

  return {
    detected: typos.length > 0 && differences <= 2,
    typos: typos,
    score: typos.length > 0 ? Math.min(typos.length * 0.3, 0.8) : 0
  };
}

/**
 * Detect character substitution typosquatting
 * @param {string} domain - Domain to check
 * @param {string} brand - Brand to compare
 * @returns {object} - Detection result
 */
function detectCharacterSubstitution(domain, brand) {
  // Common substitutions used in typosquatting
  const substitutions = {
    'l': ['1', 'i', '|'],
    '1': ['l', 'i', '|'],
    'i': ['1', 'l', '|', '!'],
    'o': ['0'],
    '0': ['o'],
    's': ['5', '$'],
    '5': ['s'],
    'a': ['4', '@'],
    '4': ['a'],
    'e': ['3'],
    '3': ['e'],
    'b': ['8'],
    '8': ['b'],
    'g': ['9', 'q'],
    '9': ['g']
  };

  const domainLower = domain.toLowerCase();
  const brandLower = brand.toLowerCase();
  
  if (domainLower.length !== brandLower.length) {
    return { detected: false };
  }

  const substitutionsFound = [];

  for (let i = 0; i < domainLower.length; i++) {
    if (domainLower[i] !== brandLower[i]) {
      const possibleSubs = substitutions[brandLower[i]] || [];
      if (possibleSubs.includes(domainLower[i])) {
        substitutionsFound.push({
          position: i,
          expected: brandLower[i],
          found: domainLower[i],
          type: 'character_substitution'
        });
      }
    }
  }

  return {
    detected: substitutionsFound.length > 0,
    substitutions: substitutionsFound,
    score: substitutionsFound.length > 0 ? Math.min(substitutionsFound.length * 0.35, 0.9) : 0
  };
}

/**
 * Detect character insertion/deletion typosquatting
 * @param {string} domain - Domain to check
 * @param {string} brand - Brand to compare
 * @returns {object} - Detection result
 */
function detectInsertionDeletion(domain, brand) {
  const domainLower = domain.toLowerCase();
  const brandLower = brand.toLowerCase();
  
  const lengthDiff = Math.abs(domainLower.length - brandLower.length);
  
  if (lengthDiff > 2) {
    return { detected: false };
  }

  // Check for single character insertion
  if (domainLower.length === brandLower.length + 1) {
    for (let i = 0; i < domainLower.length; i++) {
      const withoutChar = domainLower.slice(0, i) + domainLower.slice(i + 1);
      if (withoutChar === brandLower) {
        return {
          detected: true,
          type: 'insertion',
          position: i,
          inserted_char: domainLower[i],
          score: 0.6
        };
      }
    }
  }

  // Check for single character deletion
  if (domainLower.length === brandLower.length - 1) {
    for (let i = 0; i < brandLower.length; i++) {
      const withoutChar = brandLower.slice(0, i) + brandLower.slice(i + 1);
      if (withoutChar === domainLower) {
        return {
          detected: true,
          type: 'deletion',
          position: i,
          deleted_char: brandLower[i],
          score: 0.6
        };
      }
    }
  }

  // Check for character transposition (adjacent swap)
  if (domainLower.length === brandLower.length) {
    for (let i = 0; i < domainLower.length - 1; i++) {
      const swapped = brandLower.slice(0, i) + brandLower[i + 1] + brandLower[i] + brandLower.slice(i + 2);
      if (swapped === domainLower) {
        return {
          detected: true,
          type: 'transposition',
          position: i,
          swapped_chars: [brandLower[i], brandLower[i + 1]],
          score: 0.5
        };
      }
    }
  }

  return { detected: false };
}

/**
 * Calculate combined similarity using multiple metrics
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {object} - All similarity scores
 */
function combinedSimilarity(str1, str2) {
  const levenshtein = levenshteinSimilarity(str1, str2);
  const jaroWinkler = jaroWinklerSimilarity(str1, str2);
  const token = tokenSimilarity(str1, str2);
  const lcs = lcsSimilarity(str1, str2);

  // Weighted average (weights as per design doc)
  const weighted = (
    levenshtein * 0.4 +
    jaroWinkler * 0.4 +
    lcs * 0.2
  );

  return {
    levenshtein: parseFloat(levenshtein.toFixed(4)),
    jaroWinkler: parseFloat(jaroWinkler.toFixed(4)),
    token: parseFloat(token.toFixed(4)),
    lcs: parseFloat(lcs.toFixed(4)),
    weighted: parseFloat(weighted.toFixed(4))
  };
}

/**
 * Comprehensive typosquatting detection
 * @param {string} domain - Domain to check
 * @param {string} brand - Brand to compare
 * @returns {object} - Complete typosquatting analysis
 */
function detectTyposquatting(domain, brand) {
  const homoglyphs = detectHomoglyphs(domain);
  const keyboard = detectKeyboardTyposquatting(domain, brand);
  const substitution = detectCharacterSubstitution(domain, brand);
  const insertionDeletion = detectInsertionDeletion(domain, brand);
  
  // Also check with normalized homoglyphs
  const normalizedDomain = homoglyphs.normalized;
  const normalizedSimilarity = combinedSimilarity(normalizedDomain, brand);

  const detected = homoglyphs.detected || keyboard.detected || 
                   substitution.detected || insertionDeletion.detected ||
                   normalizedSimilarity.weighted >= 0.85;

  // Calculate overall score
  let maxScore = 0;
  if (homoglyphs.detected) maxScore = Math.max(maxScore, homoglyphs.score);
  if (keyboard.detected) maxScore = Math.max(maxScore, keyboard.score);
  if (substitution.detected) maxScore = Math.max(maxScore, substitution.score);
  if (insertionDeletion.detected) maxScore = Math.max(maxScore, insertionDeletion.score);
  if (normalizedSimilarity.weighted >= 0.85) {
    maxScore = Math.max(maxScore, normalizedSimilarity.weighted);
  }

  return {
    detected: detected,
    score: maxScore,
    details: {
      homoglyphs: homoglyphs,
      keyboard_proximity: keyboard,
      character_substitution: substitution,
      insertion_deletion: insertionDeletion,
      normalized_similarity: normalizedSimilarity
    }
  };
}

module.exports = {
  // Basic similarity metrics
  levenshteinDistance,
  levenshteinSimilarity,
  jaroSimilarity,
  jaroWinklerSimilarity,
  tokenSimilarity,
  lcsSimilarity,
  combinedSimilarity,
  
  // Homoglyph detection
  HOMOGLYPHS,
  REVERSE_HOMOGLYPHS,
  detectHomoglyphs,
  normalizeHomoglyphs,
  compareWithHomoglyphNormalization,
  
  // Typosquatting detection
  detectKeyboardTyposquatting,
  detectCharacterSubstitution,
  detectInsertionDeletion,
  detectTyposquatting
};
