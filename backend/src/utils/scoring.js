/**
 * Classify risk based on final score
 */
function classifyRisk(finalScore) {
  if (finalScore < 0.3) {
    return {
      classification: 'safe',
      action: 'allow',
      confidence: 'high',
      message: '✅ No significant phishing indicators detected. This site appears safe.',
      color: 'green',
      icon: '✅',
    };
  } else if (finalScore < 0.6) {
    return {
      classification: 'suspicious',
      action: 'warn',
      confidence: 'medium',
      message: '⚠️ Some phishing indicators detected. Proceed with caution.',
      color: 'orange',
      icon: '⚠️',
    };
  } else {
    return {
      classification: 'dangerous',
      action: 'block',
      confidence: 'high',
      message: '🚫 Strong phishing indicators detected. This site is likely dangerous!',
      color: 'red',
      icon: '🚫',
    };
  }
}

module.exports = {
  classifyRisk,
};