/**
 * Algorithm Module Index
 * AnLink Anti-Phishing System
 * 
 * Centralized exports for all algorithm components.
 */

// URL Parser
const urlParser = require('./urlParser');

// Similarity Metrics
const similarityMetrics = require('./similarityMetrics');

// Domain Analyzer
const domainAnalyzer = require('./domainAnalyzer');

// Subdomain Analyzer
const subdomainAnalyzer = require('./subdomainAnalyzer');

// Path Analyzer
const pathAnalyzer = require('./pathAnalyzer');

// Query Analyzer
const queryAnalyzer = require('./queryAnalyzer');

// Heuristic Analyzer
const heuristicAnalyzer = require('./heuristicAnalyzer');

// Score Aggregator
const scoreAggregator = require('./scoreAggregator');

// Re-export everything
module.exports = {
  // URL Parser
  parseURL: urlParser.parseURL,
  normalizeURL: urlParser.normalizeURL,
  generateURLHash: urlParser.generateURLHash,
  isValidURL: urlParser.isValidURL,
  getRegistrableDomain: urlParser.getRegistrableDomain,
  isIPAddress: urlParser.isIPAddress,
  
  // Similarity Metrics
  levenshteinDistance: similarityMetrics.levenshteinDistance,
  levenshteinSimilarity: similarityMetrics.levenshteinSimilarity,
  jaroSimilarity: similarityMetrics.jaroSimilarity,
  jaroWinklerSimilarity: similarityMetrics.jaroWinklerSimilarity,
  tokenSimilarity: similarityMetrics.tokenSimilarity,
  lcsSimilarity: similarityMetrics.lcsSimilarity,
  combinedSimilarity: similarityMetrics.combinedSimilarity,
  detectHomoglyphs: similarityMetrics.detectHomoglyphs,
  normalizeHomoglyphs: similarityMetrics.normalizeHomoglyphs,
  detectTyposquatting: similarityMetrics.detectTyposquatting,
  HOMOGLYPHS: similarityMetrics.HOMOGLYPHS,
  
  // Domain Analyzer
  analyzeDomain: domainAnalyzer.analyzeDomain,
  detectPunycodeIDN: domainAnalyzer.detectPunycodeIDN,
  detectBrandImpersonation: domainAnalyzer.detectBrandImpersonation,
  KNOWN_BRANDS: domainAnalyzer.KNOWN_BRANDS,
  ALL_BRAND_NAMES: domainAnalyzer.ALL_BRAND_NAMES,
  
  // Subdomain Analyzer
  analyzeSubdomain: subdomainAnalyzer.analyzeSubdomain,
  checkBrandInSubdomain: subdomainAnalyzer.checkBrandInSubdomain,
  SUSPICIOUS_KEYWORDS: subdomainAnalyzer.SUSPICIOUS_KEYWORDS,
  
  // Path Analyzer
  analyzePath: pathAnalyzer.analyzePath,
  SUSPICIOUS_PATH_KEYWORDS: pathAnalyzer.SUSPICIOUS_PATH_KEYWORDS,
  DANGEROUS_EXTENSIONS: pathAnalyzer.DANGEROUS_EXTENSIONS,
  
  // Query Analyzer
  analyzeQuery: queryAnalyzer.analyzeQuery,
  SUSPICIOUS_PARAM_NAMES: queryAnalyzer.SUSPICIOUS_PARAM_NAMES,
  
  // Heuristic Analyzer
  analyzeHeuristics: heuristicAnalyzer.analyzeHeuristics,
  detectURLShortener: heuristicAnalyzer.detectURLShortener,
  detectDataURI: heuristicAnalyzer.detectDataURI,
  detectPrivateIP: heuristicAnalyzer.detectPrivateIP,
  detectBase64URLs: heuristicAnalyzer.detectBase64URLs,
  URL_SHORTENERS: heuristicAnalyzer.URL_SHORTENERS,
  SUSPICIOUS_TLDS: heuristicAnalyzer.SUSPICIOUS_TLDS,
  
  // Score Aggregator
  aggregateScore: scoreAggregator.aggregateScore,
  classifyScore: scoreAggregator.classifyScore,
  getClassificationDisplay: scoreAggregator.getClassificationDisplay,
  generateExplanation: scoreAggregator.generateExplanation,
  isDefinitelyDangerous: scoreAggregator.isDefinitelyDangerous,
  DEFAULT_WEIGHTS: scoreAggregator.DEFAULT_WEIGHTS,
  THRESHOLDS: scoreAggregator.THRESHOLDS
};
