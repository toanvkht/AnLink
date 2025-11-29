/**
 * Scan Controller for URL Phishing Detection
 * AnLink Anti-Phishing System
 * 
 * Handles URL scanning requests and coordinates analysis.
 */

const { pool } = require('../config/database');

// Import enhanced algorithms from /algorithms/ folder
const { parseURL, normalizeURL, generateURLHash, isValidURL } = require('../algorithms/urlParser');
const { analyzeDomain } = require('../algorithms/domainAnalyzer');
const { analyzeSubdomain } = require('../algorithms/subdomainAnalyzer');
const { analyzePath } = require('../algorithms/pathAnalyzer');
const { analyzeQuery } = require('../algorithms/queryAnalyzer');
const { analyzeHeuristics, detectURLShortener, detectDataURI } = require('../algorithms/heuristicAnalyzer');
const { aggregateScore, getClassificationDisplay, generateExplanation } = require('../algorithms/scoreAggregator');

/**
 * Check URL for phishing
 * POST /api/scan/check
 */
exports.scanURL = async (req, res) => {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    const { url } = req.body;
    const userId = req.user?.user_id || null;

    // ============================================
    // STEP 1: Validate URL Input
    // ============================================
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required and must be a string',
      });
    }

    const trimmedUrl = url.trim();
    
    if (trimmedUrl.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'URL is too short',
      });
    }

    if (!isValidURL(trimmedUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    console.log('🔍 Scanning URL:', trimmedUrl);

    // ============================================
    // STEP 2: Parse and Normalize URL
    // ============================================
    let components;
    try {
      components = parseURL(trimmedUrl);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse URL',
        details: parseError.message,
      });
    }

    const normalizedUrl = normalizeURL(trimmedUrl);
    const urlHash = generateURLHash(normalizedUrl);

    console.log('📊 URL Components:', {
      domain: components.domain,
      subdomain: components.subdomain,
      path: components.path,
      is_ip: components.is_ip,
      is_shortener: components.is_shortener,
      is_data_uri: components.is_data_uri
    });

    // ============================================
    // STEP 3: Quick Checks (Data URI, URL Shortener)
    // ============================================
    
    // Check for Data URI (potentially dangerous)
    if (components.is_data_uri) {
      const dataURICheck = detectDataURI(trimmedUrl);
      if (dataURICheck.detected && dataURICheck.score >= 0.80) {
        return res.json({
          success: true,
          data: {
            url: trimmedUrl,
            normalized_url: normalizedUrl,
            url_hash: urlHash,
            score: dataURICheck.score,
            classification: 'dangerous',
            action: 'block',
            confidence: 'high',
            message: '🚨 ' + dataURICheck.message,
            algorithm: {
              score: dataURICheck.score,
              result: 'dangerous',
              reason: 'data_uri_detected',
              components: {
                domain: 0,
                subdomain: 0,
                path: 0,
                query: 0,
                heuristics: dataURICheck.score,
              },
            },
            response_time_ms: Date.now() - startTime,
          },
        });
      }
    }

    // Check for URL Shortener
    if (components.is_shortener) {
      const shortenerInfo = detectURLShortener(components.domain);
      return res.json({
        success: true,
        data: {
          url: trimmedUrl,
          normalized_url: normalizedUrl,
          url_hash: urlHash,
          score: 0.50,
          classification: 'suspicious',
          action: 'warn',
          confidence: 'medium',
          message: '⚠️ URL shortener detected. Cannot verify the destination URL.',
          is_shortener: true,
          shortener: shortenerInfo.shortener,
          algorithm: {
            score: 0.50,
            result: 'suspicious',
            reason: 'url_shortener_detected',
            components: {
              domain: 0.50,
              subdomain: 0,
              path: 0,
              query: 0,
              heuristics: 0.50,
            },
          },
          recommendation: 'Expand the shortened URL to verify its destination before visiting.',
          response_time_ms: Date.now() - startTime,
        },
      });
    }

    // ============================================
    // STEP 4: Database Lookup - Insert/Update URL Record
    // ============================================
    let urlId;
    try {
      const urlResult = await client.query(
        `INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, scheme, domain, subdomain, path, query_params)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (url_hash) DO UPDATE SET 
           original_url = EXCLUDED.original_url,
           last_checked = CURRENT_TIMESTAMP,
           check_count = suspicious_urls.check_count + 1
         RETURNING url_id, check_count, status`,
        [
          trimmedUrl,
          normalizedUrl,
          urlHash,
          components.scheme,
          components.domain,
          components.subdomain || null,
          components.path || null,
          components.query || null,
        ]
      );
      urlId = urlResult.rows[0].url_id;
      
      // If URL is already marked as safe, return early
      if (urlResult.rows[0].status === 'safe') {
        console.log('✅ URL is marked as safe in database');
        return res.json({
          success: true,
          data: {
            url: trimmedUrl,
            normalized_url: normalizedUrl,
            url_hash: urlHash,
            score: 0,
            classification: 'safe',
            action: 'allow',
            confidence: 'high',
            message: '✅ This URL is verified as safe in our database.',
            algorithm: {
              score: 0,
              result: 'safe',
              reason: 'verified_safe_database',
            },
            response_time_ms: Date.now() - startTime,
          },
        });
      }
      
      console.log('✅ URL ID:', urlId);
    } catch (dbError) {
      console.log('⚠️ Database insert skipped:', dbError.message);
      urlId = null;
    }

    // ============================================
    // STEP 5: Check Known Phishing Database
    // ============================================
    if (urlId) {
      try {
        const knownPhishingResult = await client.query(
          `SELECT phishing_id, severity, phishing_type, target_brand 
           FROM known_phishing_urls 
           WHERE url_id = $1 AND active = TRUE`,
          [urlId]
        );

        if (knownPhishingResult.rows.length > 0) {
          const phishingData = knownPhishingResult.rows[0];
          console.log('🚨 Known phishing URL detected!');

          // Log the check
          await client.query(
            `INSERT INTO url_checks (url_id, user_id, check_source, algorithm_score, algorithm_result, aggregated_recommendation)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [urlId, userId, 'web_form', 1.0, 'dangerous', 'block']
          );

          return res.json({
            success: true,
            data: {
              url: trimmedUrl,
              normalized_url: normalizedUrl,
              url_hash: urlHash,
              score: 1.0,
              classification: 'dangerous',
              action: 'block',
              confidence: 'high',
              message: '🚨 This URL is confirmed as phishing in our database!',
              algorithm: {
                score: 1.0,
                result: 'dangerous',
                reason: 'known_phishing_database_match',
                components: {
                  domain: 1.0,
                  subdomain: 1.0,
                  path: 1.0,
                  query: 1.0,
                  heuristics: 1.0,
                },
              },
              phishing_info: {
                severity: phishingData.severity,
                type: phishingData.phishing_type,
                target_brand: phishingData.target_brand,
              },
              response_time_ms: Date.now() - startTime,
            },
          });
        }
      } catch (dbError) {
        console.log('⚠️ Phishing database check skipped:', dbError.message);
      }
    }

    // ============================================
    // STEP 6: Run Algorithm Analysis
    // ============================================
    console.log('🔬 Running algorithm analysis...');

    // Analyze each component
    const analysisResults = {};

    // Domain analysis (async - may query database)
    try {
      analysisResults.domain = await analyzeDomain(components.domain, components);
    } catch (e) {
      console.log('Domain analysis error:', e.message);
      analysisResults.domain = { score: 0, flags: ['analysis_error'] };
    }

    // Subdomain analysis
    analysisResults.subdomain = analyzeSubdomain(
      components.subdomain || '',
      components.domain,
      components
    );

    // Path analysis
    analysisResults.path = analyzePath(components.path || '/', components);

    // Query analysis
    analysisResults.query = analyzeQuery(components.query || '', components);

    // Heuristic analysis
    analysisResults.heuristics = analyzeHeuristics(components);

    // ============================================
    // STEP 7: Aggregate Scores
    // ============================================
    const aggregatedResult = aggregateScore(analysisResults);
    const displayInfo = getClassificationDisplay(aggregatedResult.classification);
    const explanation = generateExplanation(aggregatedResult);

    console.log('📈 Analysis Results:', {
      domain: analysisResults.domain.score,
      subdomain: analysisResults.subdomain.score,
      path: analysisResults.path.score,
      query: analysisResults.query.score,
      heuristics: analysisResults.heuristics.score,
      final: aggregatedResult.final_score,
      classification: aggregatedResult.classification
    });

    // ============================================
    // STEP 8: Store Results in Database
    // ============================================
    let checkId = null;
    
    if (urlId) {
      try {
        const checkResult = await client.query(
          `INSERT INTO url_checks (
            url_id, user_id, check_source, 
            algorithm_score, algorithm_result, 
            safebrowsing_status, aggregated_recommendation,
            response_time_ms
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING check_id, checked_at`,
          [
            urlId,
            userId,
            'web_form',
            aggregatedResult.final_score,
            aggregatedResult.classification,
            'not_checked',
            aggregatedResult.recommendation,
            Date.now() - startTime,
          ]
        );

        checkId = checkResult.rows[0].check_id;

        // Insert scan_results for each component
        for (const [componentType, analysis] of Object.entries(analysisResults)) {
          await client.query(
            `INSERT INTO scan_results (
              check_id, component_type, component_value, 
              similarity_score, heuristic_flags, details
            )
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              checkId,
              componentType,
              components[componentType] || '',
              analysis.score,
              JSON.stringify(analysis.flags || []),
              JSON.stringify(analysis),
            ]
          );
        }

        // Log user activity
        if (userId) {
          await client.query(
            `INSERT INTO user_activity_logs (user_id, action_type, action_details)
             VALUES ($1, $2, $3)`,
            [
              userId,
              'url_check',
              JSON.stringify({ 
                url: trimmedUrl, 
                check_id: checkId, 
                result: aggregatedResult.classification 
              }),
            ]
          );
        }
      } catch (dbError) {
        console.log('⚠️ Failed to store results:', dbError.message);
      }
    }

    // ============================================
    // STEP 9: Build and Return Response
    // ============================================
    const responseTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        check_id: checkId,
        url: trimmedUrl,
        normalized_url: normalizedUrl,
        url_hash: urlHash,
        
        // Main results
        score: aggregatedResult.final_score,
        classification: aggregatedResult.classification,
        action: displayInfo.action,
        confidence: aggregatedResult.confidence,
        message: displayInfo.emoji + ' ' + displayInfo.message,
        explanation: explanation,
        
        // Display information
        display: {
          color: displayInfo.color,
          icon: displayInfo.icon,
          emoji: displayInfo.emoji,
          bgColor: displayInfo.bgColor,
          textColor: displayInfo.textColor,
          borderColor: displayInfo.borderColor,
          description: displayInfo.description
        },
        
        // Algorithm details
        algorithm: {
          score: aggregatedResult.final_score,
          result: aggregatedResult.classification,
          breakdown: aggregatedResult.breakdown,
          summary: aggregatedResult.summary,
          components: {
            domain: analysisResults.domain.score,
            subdomain: analysisResults.subdomain.score,
            path: analysisResults.path.score,
            query: analysisResults.query.score,
            heuristics: analysisResults.heuristics.score,
          },
          details: {
            domain: analysisResults.domain,
            subdomain: analysisResults.subdomain,
            path: analysisResults.path,
            query: analysisResults.query,
            heuristics: analysisResults.heuristics,
          },
        },
        
        // Third-party status
        google_safe_browsing: {
          status: 'not_checked',
          message: 'Google Safe Browsing integration coming soon',
        },
        
        // Metadata
        response_time_ms: responseTimeMs,
        checked_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error in scanURL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check URL',
      details: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Get user's scan history
 * GET /api/scan/history
 */
exports.getScanHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT 
        uc.check_id,
        uc.checked_at,
        uc.algorithm_score,
        uc.algorithm_result,
        uc.aggregated_recommendation,
        uc.check_source,
        uc.response_time_ms,
        su.original_url,
        su.domain,
        su.subdomain
      FROM url_checks uc
      JOIN suspicious_urls su ON uc.url_id = su.url_id
      WHERE uc.user_id = $1
      ORDER BY uc.checked_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM url_checks WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        checks: result.rows.map(row => ({
          ...row,
          display: getClassificationDisplay(row.algorithm_result)
        })),
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error in getScanHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scan history',
    });
  }
};

/**
 * Get detailed scan results
 * GET /api/scan/details/:checkId
 */
exports.getScanDetails = async (req, res) => {
  try {
    const { checkId } = req.params;
    const userId = req.user.user_id;

    // Get check details
    const checkResult = await pool.query(
      `SELECT 
        uc.*,
        su.original_url,
        su.normalized_url,
        su.url_hash,
        su.domain,
        su.subdomain,
        su.path,
        su.query_params,
        su.scheme
      FROM url_checks uc
      JOIN suspicious_urls su ON uc.url_id = su.url_id
      WHERE uc.check_id = $1 AND uc.user_id = $2`,
      [checkId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Check not found',
      });
    }

    // Get component analysis
    const componentsResult = await pool.query(
      `SELECT * FROM scan_results WHERE check_id = $1 ORDER BY component_type`,
      [checkId]
    );

    const check = checkResult.rows[0];
    
    res.json({
      success: true,
      data: {
        check: {
          ...check,
          display: getClassificationDisplay(check.algorithm_result)
        },
        components: componentsResult.rows.map(comp => ({
          ...comp,
          details: typeof comp.details === 'string' ? JSON.parse(comp.details) : comp.details,
          heuristic_flags: typeof comp.heuristic_flags === 'string' ? JSON.parse(comp.heuristic_flags) : comp.heuristic_flags
        })),
      },
    });
  } catch (error) {
    console.error('Error in getScanDetails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scan details',
    });
  }
};

/**
 * Quick URL check (lightweight, no database storage)
 * POST /api/scan/quick
 */
exports.quickCheck = async (req, res) => {
  const startTime = Date.now();

  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    const trimmedUrl = url.trim();

    if (!isValidURL(trimmedUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    // Parse URL
    const components = parseURL(trimmedUrl);

    // Run quick analysis (no database queries)
    const analysisResults = {
      domain: { score: 0, flags: [] },
      subdomain: analyzeSubdomain(components.subdomain || '', components.domain, components),
      path: analyzePath(components.path || '/', components),
      query: analyzeQuery(components.query || '', components),
      heuristics: analyzeHeuristics(components),
    };

    // Aggregate
    const aggregatedResult = aggregateScore(analysisResults);
    const displayInfo = getClassificationDisplay(aggregatedResult.classification);

    res.json({
      success: true,
      data: {
        url: trimmedUrl,
        score: aggregatedResult.final_score,
        classification: aggregatedResult.classification,
        message: displayInfo.message,
        response_time_ms: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('Error in quickCheck:', error);
    res.status(500).json({
      success: false,
      error: 'Quick check failed',
    });
  }
};
