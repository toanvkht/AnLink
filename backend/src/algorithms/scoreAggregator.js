/**
 * Score Aggregator for URL Phishing Detection
 * AnLink Anti-Phishing System
 * 
 * Aggregates component scores into final risk assessment.
 */

// ============================================
// DEFAULT WEIGHTS (as per design document)
// ============================================
const DEFAULT_WEIGHTS = {
  domain: 0.40,      // 40% - Most critical indicator
  subdomain: 0.25,   // 25% - Attackers often add misleading subdomains
  path: 0.15,        // 15% - Suspicious paths indicate phishing intent
  query: 0.10,       // 10% - Can contain redirect attacks
  heuristics: 0.10   // 10% - Catch edge cases and obvious patterns
};

// ============================================
// CLASSIFICATION THRESHOLDS
// ============================================
const THRESHOLDS = {
  safe: { min: 0, max: 0.29 },
  suspicious: { min: 0.30, max: 0.59 },
  dangerous: { min: 0.60, max: 1.0 }
};

/**
 * Aggregate component scores into final risk score
 * @param {object} analysisResults - Results from all analyzers
 * @param {object} customWeights - Optional custom weights
 * @returns {object} - Aggregated score and classification
 */
function aggregateScore(analysisResults, customWeights = null) {
  // Use custom weights or defaults
  const weights = customWeights || DEFAULT_WEIGHTS;

  // Calculate weighted score
  let finalScore = 0;
  const breakdown = {};

  for (const [component, weight] of Object.entries(weights)) {
    const componentResult = analysisResults[component];
    if (componentResult && componentResult.score !== undefined) {
      const rawScore = parseFloat(componentResult.score) || 0;
      const weightedScore = rawScore * weight;
      
      finalScore += weightedScore;
      
      breakdown[component] = {
        raw_score: parseFloat(rawScore.toFixed(4)),
        weight: weight,
        weighted_score: parseFloat(weightedScore.toFixed(4)),
        flags: componentResult.flags || []
      };
    } else {
      // Component not analyzed - use zero score
      breakdown[component] = {
        raw_score: 0,
        weight: weight,
        weighted_score: 0,
        flags: ['not_analyzed']
      };
    }
  }

  // Check for definitely dangerous patterns BEFORE classification
  const dangerCheck = isDefinitelyDangerous(analysisResults);
  
  if (dangerCheck.dangerous) {
    // Override to dangerous classification with high score
    finalScore = Math.max(finalScore, 0.75);
    
    // Add the override reason to breakdown
    breakdown.override = {
      reason: dangerCheck.reason,
      original_score: parseFloat(finalScore.toFixed(4)),
      applied: true
    };
  }

  // Ensure final score is within bounds
  finalScore = Math.max(0, Math.min(1, finalScore));
  finalScore = parseFloat(finalScore.toFixed(4));

  // Classify based on thresholds (or use override)
  let classification;
  if (dangerCheck.dangerous) {
    classification = {
      classification: 'dangerous',
      recommendation: 'block',
      confidence: 'high'
    };
  } else {
    classification = classifyScore(finalScore);
  }

  // Build summary
  const summary = buildSummary(breakdown, finalScore, classification);
  
  // Add override info to summary if applicable
  if (dangerCheck.dangerous) {
    summary.override_reason = dangerCheck.reason;
  }

  return {
    final_score: finalScore,
    classification: classification.classification,
    recommendation: classification.recommendation,
    confidence: classification.confidence,
    breakdown: breakdown,
    weights_used: weights,
    summary: summary
  };
}

/**
 * Classify score into risk categories
 * @param {number} score - Final score (0-1)
 * @returns {object} - Classification details
 */
function classifyScore(score) {
  if (score < THRESHOLDS.suspicious.min) {
    return {
      classification: 'safe',
      recommendation: 'safe',
      confidence: 'high'
    };
  } else if (score < THRESHOLDS.dangerous.min) {
    return {
      classification: 'suspicious',
      recommendation: 'suspicious',
      confidence: 'medium'
    };
  } else {
    return {
      classification: 'dangerous',
      recommendation: 'block',
      confidence: 'high'
    };
  }
}

/**
 * Build analysis summary
 * @param {object} breakdown - Score breakdown by component
 * @param {number} finalScore - Final aggregated score
 * @param {object} classification - Classification result
 * @returns {object} - Summary object
 */
function buildSummary(breakdown, finalScore, classification) {
  // Count total flags
  const totalFlags = Object.values(breakdown).reduce(
    (sum, comp) => sum + (comp.flags ? comp.flags.length : 0), 
    0
  );

  // Find highest scoring component
  let highestComponent = { component: null, score: 0 };
  for (const [comp, data] of Object.entries(breakdown)) {
    if (data.weighted_score > highestComponent.score) {
      highestComponent = { component: comp, score: data.weighted_score };
    }
  }

  // Determine risk level
  let riskLevel = 'low';
  if (classification.classification === 'suspicious') {
    riskLevel = 'medium';
  } else if (classification.classification === 'dangerous') {
    riskLevel = 'high';
  }

  return {
    total_flags: totalFlags,
    highest_scoring_component: highestComponent,
    risk_level: riskLevel,
    score_percentage: Math.round(finalScore * 100)
  };
}

/**
 * Get classification display information for UI
 * @param {string} classification - Classification type ('safe', 'suspicious', 'dangerous')
 * @returns {object} - UI display information
 */
function getClassificationDisplay(classification) {
  const displays = {
    safe: {
      classification: 'safe',
      action: 'allow',
      message: 'No significant phishing indicators detected',
      color: 'green',
      icon: '✓',
      emoji: '✅',
      description: 'This URL appears to be legitimate',
      bgColor: '#dcfce7',
      textColor: '#166534',
      borderColor: '#86efac'
    },
    suspicious: {
      classification: 'suspicious',
      action: 'warn',
      message: 'Some phishing indicators detected. Proceed with caution.',
      color: 'orange',
      icon: '⚠',
      emoji: '⚠️',
      description: 'This URL shows suspicious patterns but may be legitimate',
      bgColor: '#fef3c7',
      textColor: '#92400e',
      borderColor: '#fcd34d'
    },
    dangerous: {
      classification: 'dangerous',
      action: 'block',
      message: 'Strong phishing indicators detected. Access blocked for your safety.',
      color: 'red',
      icon: '✗',
      emoji: '🚫',
      description: 'This URL is likely a phishing attempt',
      bgColor: '#fee2e2',
      textColor: '#991b1b',
      borderColor: '#fca5a5'
    }
  };

  return displays[classification] || displays.suspicious;
}

/**
 * Generate detailed explanation of the analysis
 * @param {object} aggregatedResult - Result from aggregateScore
 * @returns {string} - Human-readable explanation
 */
function generateExplanation(aggregatedResult) {
  const { classification, final_score, breakdown, summary } = aggregatedResult;
  
  let explanation = '';

  // Overall assessment
  if (classification === 'safe') {
    explanation = '✅ This URL appears to be safe. ';
  } else if (classification === 'suspicious') {
    explanation = '⚠️ This URL has some suspicious characteristics. ';
  } else {
    explanation = '🚫 This URL shows strong indicators of being a phishing attempt. ';
  }

  // Add score
  explanation += `Risk score: ${summary.score_percentage}%. `;

  // Highlight main concerns
  if (summary.total_flags > 0) {
    explanation += `Found ${summary.total_flags} potential issue(s). `;
    
    if (summary.highest_scoring_component.component) {
      explanation += `Main concern: ${summary.highest_scoring_component.component} analysis. `;
    }
  }

  // Add specific flags for dangerous URLs
  if (classification === 'dangerous') {
    const dangerousFlags = [];
    for (const [comp, data] of Object.entries(breakdown)) {
      if (data.raw_score >= 0.5 && data.flags) {
        dangerousFlags.push(...data.flags.slice(0, 2)); // Top 2 flags per component
      }
    }
    if (dangerousFlags.length > 0) {
      explanation += `Key indicators: ${dangerousFlags.slice(0, 3).join(', ')}.`;
    }
  }

  return explanation;
}

/**
 * Quick check if URL is definitely dangerous
 * @param {object} analysisResults - Results from analyzers
 * @returns {object} - { dangerous: boolean, reason: string }
 */
function isDefinitelyDangerous(analysisResults) {
  const domainResult = analysisResults.domain || {};
  const heuristicsResult = analysisResults.heuristics || {};
  const domainFlags = domainResult.flags || [];
  const heuristicFlags = heuristicsResult.flags || [];

  // 1. Known phishing match
  if (domainFlags.includes('exact_phishing_match')) {
    return { dangerous: true, reason: 'known_phishing_url' };
  }

  // 2. Data URI (potentially dangerous)
  if (heuristicFlags.includes('dangerous_data_uri')) {
    return { dangerous: true, reason: 'dangerous_data_uri' };
  }

  // 3. IP address with financial keywords
  if (heuristicFlags.includes('ip_address_used') &&
      heuristicFlags.includes('http_on_financial_domain')) {
    return { dangerous: true, reason: 'ip_with_financial_keywords' };
  }

  // 4. Brand name with phishing keywords on suspicious TLD
  const hasBrandWithKeywords = domainFlags.includes('brand_with_phishing_keywords') || 
                                domainFlags.includes('brand_with_multiple_phishing_keywords');
  const hasSuspiciousTLD = domainFlags.includes('free_tld_high_risk') || 
                           domainFlags.includes('suspicious_tld');
  
  if (hasBrandWithKeywords && hasSuspiciousTLD) {
    return { dangerous: true, reason: 'brand_impersonation_on_suspicious_tld' };
  }

  // 5. Brand name + HTTP + suspicious TLD (classic phishing combo)
  const hasBrandInDomain = domainFlags.some(f => f.includes('brand_'));
  const hasHTTPFlag = heuristicFlags.includes('http_on_sensitive_domain') || 
                      heuristicFlags.includes('http_on_financial_domain');
  
  if (hasBrandInDomain && hasHTTPFlag && hasSuspiciousTLD) {
    return { dangerous: true, reason: 'brand_http_suspicious_tld_combo' };
  }

  // 6. High domain score (>= 0.65) + high heuristics score (>= 0.5)
  if ((domainResult.score || 0) >= 0.65 && (heuristicsResult.score || 0) >= 0.5) {
    return { dangerous: true, reason: 'multiple_high_risk_components' };
  }

  // 7. Very high individual component score
  if ((domainResult.score || 0) >= 0.85) {
    return { dangerous: true, reason: 'extreme_domain_risk' };
  }

  return { dangerous: false, reason: null };
}

module.exports = {
  aggregateScore,
  classifyScore,
  getClassificationDisplay,
  generateExplanation,
  isDefinitelyDangerous,
  buildSummary,
  DEFAULT_WEIGHTS,
  THRESHOLDS
};
