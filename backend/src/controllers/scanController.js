const { parseURL, isValidURL } = require('../algorithms/urlParser');
const { analyzeDomain } = require('../algorithms/domainAnalyzer');
const { analyzeSubdomain } = require('../algorithms/subdomainAnalyzer');
const { analyzePath } = require('../algorithms/pathAnalyzer');
const { analyzeQuery } = require('../algorithms/queryAnalyzer');
const { analyzeHeuristics } = require('../algorithms/heuristicAnalyzer');
const { aggregateScore, getClassificationDisplay } = require('../algorithms/scoreAggregator');
const { query } = require('../config/database');

/**
 * Main URL scanning endpoint
 */
exports.scanURL = async (req, res) => {
  const startTime = Date.now();

  try {
    const { url } = req.body;
    const userId = req.user ? req.user.userId : null;

    // Validation
    if (!url) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'URL is required'
      });
    }

    // Validate URL format
    if (!isValidURL(url)) {
      return res.status(400).json({
        service: 'AnLink API',
        success: false,
        error: 'Invalid URL format'
      });
    }

    console.log(`🔍 AnLink scanning URL: ${url}`);

    // Step 1: Parse URL
    const components = parseURL(url);
    console.log('✅ URL parsed:', components.domain);

    // Step 2: Check if URL already exists
    let urlRecord = await query(
      'SELECT url_id, status FROM suspicious_urls WHERE url_hash = $1',
      [components.url_hash]
    );

    let urlId;

    if (urlRecord.rows.length > 0) {
      urlId = urlRecord.rows[0].url_id;
      console.log('✅ URL exists in database:', urlId);
    } else {
      // Insert new URL
      const insertResult = await query(`
        INSERT INTO suspicious_urls 
        (original_url, normalized_url, url_hash, scheme, domain, subdomain, path, query_params, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING url_id
      `, [
        components.original_url,
        components.normalized_url,
        components.url_hash,
        components.scheme,
        components.domain,
        components.subdomain || null,
        components.path,
        components.query || null
      ]);

      urlId = insertResult.rows[0].url_id;
      console.log('✅ URL inserted:', urlId);
    }

    // Step 3: Run component analysis
    console.log('🔬 Running component analysis...');

    const analysisResults = {
      domain: await analyzeDomain(components.domain, components),
      subdomain: analyzeSubdomain(components.subdomain, components.domain, components),
      path: analyzePath(components.path, components),
      query: analyzeQuery(components.query, components),
      heuristics: analyzeHeuristics(components)
    };

    console.log('✅ Component analysis complete');

    // Step 4: Aggregate scores
    const aggregated = aggregateScore(analysisResults);
    console.log(`✅ Final score: ${aggregated.final_score} (${aggregated.classification})`);

// Step 5: Create url_check record
    const checkResult = await query(`
    INSERT INTO url_checks 
    (url_id, user_id, check_source, algorithm_score, algorithm_result, aggregated_recommendation)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING check_id
    `, [
    urlId,
    userId,
    userId ? 'web_form' : 'api',
    aggregated.final_score,
    aggregated.classification,
    aggregated.recommendation  
]);

    const checkId = checkResult.rows[0].check_id;

    // Step 6: Insert scan_results for each component
    for (const [componentType, result] of Object.entries(analysisResults)) {
      await query(`
        INSERT INTO scan_results 
        (check_id, component_type, component_value, similarity_score, heuristic_flags, details)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        checkId,
        componentType,
        result.value || '',
        result.score,
        JSON.stringify(result.flags || []),
        JSON.stringify(result)
      ]);
    }

    console.log('✅ Results saved to database');

    // Step 7: Log activity
    if (userId) {
      await query(`
        INSERT INTO user_activity_logs (user_id, action_type, action_details)
        VALUES ($1, 'scan', $2)
      `, [userId, JSON.stringify({ url: components.original_url, score: aggregated.final_score })]);
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Update response_time_ms in url_checks
    await query(
      'UPDATE url_checks SET response_time_ms = $1 WHERE check_id = $2',
      [responseTime, checkId]
    );

// Step 8: Build response
const displayInfo = getClassificationDisplay(aggregated.classification);

res.json({
  service: 'AnLink API',
  success: true,
  data: {
    url: components.original_url,
    normalized_url: components.normalized_url,
    url_id: urlId,
    check_id: checkId,
    
    // Main result
    result: {
      score: aggregated.final_score,
      classification: aggregated.classification,
      action: aggregated.action,  // ❌ This doesn't exist anymore
      confidence: aggregated.confidence,
      ...displayInfo
    },
        
        // Component breakdown
        components: {
          domain: {
            value: components.domain,
            score: analysisResults.domain.score,
            flags: analysisResults.domain.flags,
            matches: analysisResults.domain.matches || []
          },
          subdomain: {
            value: components.subdomain || '',
            score: analysisResults.subdomain.score,
            flags: analysisResults.subdomain.flags
          },
          path: {
            value: components.path,
            score: analysisResults.path.score,
            flags: analysisResults.path.flags
          },
          query: {
            value: components.query || '',
            score: analysisResults.query.score,
            flags: analysisResults.query.flags
          },
          heuristics: {
            score: analysisResults.heuristics.score,
            flags: analysisResults.heuristics.flags
          }
        },
        
        // Score breakdown
        score_breakdown: aggregated.breakdown,
        summary: aggregated.summary,
        
        // Metadata
        response_time_ms: responseTime,
        checked_at: new Date().toISOString()
      }
    });

    console.log(`✅ AnLink scan complete in ${responseTime}ms`);

  } catch (error) {
    console.error('❌ AnLink scan error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error scanning URL',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get scan history for user
 */
exports.getScanHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(`
      SELECT 
        uc.check_id,
        uc.checked_at,
        su.original_url,
        su.domain,
        uc.algorithm_score,
        uc.algorithm_result,
        uc.aggregated_recommendation,
        uc.response_time_ms
      FROM url_checks uc
      JOIN suspicious_urls su ON uc.url_id = su.url_id
      WHERE uc.user_id = $1
      ORDER BY uc.checked_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const countResult = await query(
      'SELECT COUNT(*) as total FROM url_checks WHERE user_id = $1',
      [userId]
    );

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        scans: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: limit,
          offset: offset,
          has_more: offset + result.rows.length < parseInt(countResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get scan history error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching scan history'
    });
  }
};

/**
 * Get detailed scan result by check_id
 */
exports.getScanDetails = async (req, res) => {
  try {
    const { checkId } = req.params;
    const userId = req.user ? req.user.userId : null;

    // Get check record
    const checkResult = await query(`
      SELECT 
        uc.*,
        su.original_url,
        su.normalized_url,
        su.domain,
        su.subdomain,
        su.path
      FROM url_checks uc
      JOIN suspicious_urls su ON uc.url_id = su.url_id
      WHERE uc.check_id = $1
    `, [checkId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        service: 'AnLink API',
        success: false,
        error: 'Scan not found'
      });
    }

    const check = checkResult.rows[0];

    // Verify user owns this scan (unless admin)
    if (userId && check.user_id && check.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        service: 'AnLink API',
        success: false,
        error: 'Access denied'
      });
    }

    // Get scan results
    const resultsData = await query(
      'SELECT * FROM scan_results WHERE check_id = $1',
      [checkId]
    );

    res.json({
      service: 'AnLink API',
      success: true,
      data: {
        check_id: check.check_id,
        url: check.original_url,
        checked_at: check.checked_at,
        score: check.algorithm_score,
        result: check.algorithm_result,
        recommendation: check.aggregated_recommendation,
        response_time_ms: check.response_time_ms,
        components: resultsData.rows
      }
    });

  } catch (error) {
    console.error('❌ Get scan details error:', error);
    res.status(500).json({
      service: 'AnLink API',
      success: false,
      error: 'Error fetching scan details'
    });
  }
};