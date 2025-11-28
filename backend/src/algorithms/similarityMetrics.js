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

  // Weighted average (weights can be tuned)
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

module.exports = {
  levenshteinDistance,
  levenshteinSimilarity,
  jaroSimilarity,
  jaroWinklerSimilarity,
  tokenSimilarity,
  lcsSimilarity,
  combinedSimilarity
};