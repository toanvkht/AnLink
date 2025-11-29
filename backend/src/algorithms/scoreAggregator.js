/**
 * Aggregate component scores into final risk score
 * @param {object} analysisResults - Results from all analyzers
 * @returns {object} - Aggregated score and classification
 */
function aggregateScore(analysisResults) {
  // Default weights (can be adjusted based on testing)
  const weights = {
    domain: 0.40,      
    subdomain: 0.25,   
    path: 0.15,        
    query: 0.10,       
    heuristics: 0.10   
  };

  // Calculate weighted score
  let finalScore = 0;
  const breakdown = {};

  for (const [component, weight] of Object.entries(weights)) {
    const componentResult = analysisResults[component];
    if (componentResult && componentResult.score !== undefined) {
      const weightedScore = componentResult.score * weight;
      finalScore += weightedScore;
      breakdown[component] = {
        raw_score: componentResult.score,
        weight: weight,
        weighted_score: parseFloat(weightedScore.toFixed(4)),
        flags: componentResult.flags || []
      };
    }
  }

  finalScore = parseFloat(finalScore.toFixed(4));

  // Classify based on thresholds
  // Database ENUM values: 'safe', 'suspicious', 'block'
  let classification, recommendation, confidence;

  if (finalScore < 0.30) {
    classification = 'safe';
    recommendation = 'safe';  // 
    confidence = 'high';
  } else if (finalScore >= 0.30 && finalScore < 0.60) {
    classification = 'suspicious';
    recommendation = 'suspicious';  //
    confidence = 'medium';
  } else {
    classification = 'dangerous';
    recommendation = 'block';  // 
    confidence = 'high';
  }

  return {
    final_score: finalScore,
    classification: classification,
    recommendation: recommendation,  // ✅ Added recommendation field
    confidence: confidence,
    breakdown: breakdown,
    weights_used: weights,
    
    // Summary
    summary: {
      total_flags: Object.values(breakdown).reduce((sum, comp) => sum + comp.flags.length, 0),
      highest_scoring_component: Object.entries(breakdown)
        .reduce((max, [comp, data]) => data.weighted_score > max.score ? { component: comp, score: data.weighted_score } : max, { component: null, score: 0 }),
      risk_level: classification === 'safe' ? 'low' : classification === 'suspicious' ? 'medium' : 'high'
    }
  };
}

/**
 * Get classification with color and icon for UI
 * @param {string} classification - Classification type
 * @returns {object} - UI display information
 */
function getClassificationDisplay(classification) {
  const displays = {
    safe: {
      classification: 'safe',
      action: 'allow',  // ✅ This is for UI display only
      message: 'No significant phishing indicators detected',
      color: 'green',
      icon: '✓',
      description: 'This URL appears to be legitimate'
    },
    suspicious: {
      classification: 'suspicious',
      action: 'warn', 
      message: 'Some phishing indicators detected. Proceed with caution.',
      color: 'orange',
      icon: '⚠',
      description: 'This URL shows suspicious patterns but may be legitimate'
    },
    dangerous: {
      classification: 'dangerous',
      action: 'block',  
      message: 'Strong phishing indicators detected. Access blocked for your safety.',
      color: 'red',
      icon: '✗',
      description: 'This URL is likely a phishing attempt'
    }
  };

  return displays[classification] || displays.suspicious;
}

module.exports = {
  aggregateScore,
  getClassificationDisplay
};

/**
 * Get classification with color and icon for UI
 * @param {string} classification - Classification type
 * @returns {object} - UI display information
 */
function getClassificationDisplay(classification) {
  const displays = {
    safe: {
      classification: 'safe',
      message: 'No significant phishing indicators detected',
      color: 'green',
      icon: '✓',
      description: 'This URL appears to be legitimate'
    },
    suspicious: {
      classification: 'suspicious',
      message: 'Some phishing indicators detected. Proceed with caution.',
      color: 'orange',
      icon: '⚠',
      description: 'This URL shows suspicious patterns but may be legitimate'
    },
    dangerous: {
      classification: 'dangerous',
      message: 'Strong phishing indicators detected. Access blocked for your safety.',
      color: 'red',
      icon: '✗',
      description: 'This URL is likely a phishing attempt'
    }
  };

  return displays[classification] || displays.suspicious;
}

module.exports = {
  aggregateScore,
  getClassificationDisplay
};