/**
 * Test Runner for AnLink API
 * Executes tests and updates test log
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Import functions to test directly
const { parseURL, normalizeURL, generateURLHash, isValidURL } = require('./src/algorithms/urlParser');
const { analyzeSubdomain } = require('./src/algorithms/subdomainAnalyzer');
const { analyzePath } = require('./src/algorithms/pathAnalyzer');
const { analyzeQuery } = require('./src/algorithms/queryAnalyzer');
const { analyzeHeuristics, detectURLShortener, detectDataURI } = require('./src/algorithms/heuristicAnalyzer');
const { aggregateScore } = require('./src/algorithms/scoreAggregator');
const { levenshteinDistance, jaroWinklerSimilarity } = require('./src/algorithms/similarityMetrics');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_LOG_PATH = path.join(__dirname, '..', 'TEST_LOG.csv');

// Read test log
function readTestLog() {
  const content = fs.readFileSync(TEST_LOG_PATH, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  const tests = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 7) {
        tests.push({
          testCaseId: values[0],
          testLogId: values[1],
          description: values[2],
          data: values[3],
          expectedResult: values[4],
          actualResult: values[5],
          status: values[6]
        });
      }
    }
  }
  return { headers, tests };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function writeTestLog(headers, tests) {
  const lines = [headers.join(',')];
  for (const test of tests) {
    lines.push([
      test.testCaseId,
      test.testLogId,
      `"${test.description}"`,
      `"${test.data}"`,
      `"${test.expectedResult}"`,
      `"${test.actualResult}"`,
      test.status
    ].join(','));
  }
  fs.writeFileSync(TEST_LOG_PATH, lines.join('\n'), 'utf-8');
}

// Test functions
async function testURLParserFunctions() {
  const results = {};
  
  // TC-036-01: parseURL with HTTP URL
  try {
    const result = parseURL('http://example.com/path');
    if (result && result.scheme === 'http' && result.domain === 'example.com' && result.path === '/path') {
      results['TC-036-01'] = { status: 'Pass', actual: 'Function correctly extracts all components' };
    } else {
      results['TC-036-01'] = { status: 'Fail', actual: 'Function did not extract components correctly' };
    }
  } catch (e) {
    results['TC-036-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-037-01: parseURL with HTTPS URL
  try {
    const result = parseURL('https://example.com');
    if (result && result.scheme === 'https') {
      results['TC-037-01'] = { status: 'Pass', actual: 'Function correctly extracts HTTPS scheme' };
    } else {
      results['TC-037-01'] = { status: 'Fail', actual: 'Function did not extract HTTPS correctly' };
    }
  } catch (e) {
    results['TC-037-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-038-01: parseURL without protocol
  try {
    const result = parseURL('example.com/path');
    if (result && result.scheme === 'https') {
      results['TC-038-01'] = { status: 'Pass', actual: 'Function automatically adds https:// prefix' };
    } else {
      results['TC-038-01'] = { status: 'Fail', actual: 'Function did not add protocol' };
    }
  } catch (e) {
    results['TC-038-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-039-01: parseURL with subdomain
  try {
    const result = parseURL('https://subdomain.example.com');
    if (result && result.subdomain === 'subdomain' && result.domain === 'example.com') {
      results['TC-039-01'] = { status: 'Pass', actual: 'Function correctly extracts subdomain and domain' };
    } else {
      results['TC-039-01'] = { status: 'Fail', actual: 'Function did not extract subdomain correctly' };
    }
  } catch (e) {
    results['TC-039-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-044-01: normalizeURL trailing slash
  try {
    const result1 = normalizeURL('https://example.com/path/');
    const result2 = normalizeURL('https://example.com/path');
    if (result1 === result2) {
      results['TC-044-01'] = { status: 'Pass', actual: 'Both URLs normalize to same result' };
    } else {
      results['TC-044-01'] = { status: 'Fail', actual: 'URLs did not normalize to same result' };
    }
  } catch (e) {
    results['TC-044-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-046-01: normalizeURL case sensitivity
  try {
    const result1 = normalizeURL('HTTPS://EXAMPLE.COM');
    const result2 = normalizeURL('https://example.com');
    if (result1 === result2) {
      results['TC-046-01'] = { status: 'Pass', actual: 'Both URLs normalize to lowercase' };
    } else {
      results['TC-046-01'] = { status: 'Fail', actual: 'URLs did not normalize to same case' };
    }
  } catch (e) {
    results['TC-046-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-047-01: generateURLHash consistency
  try {
    const hash1 = generateURLHash('HTTPS://EXAMPLE.COM/path/');
    const hash2 = generateURLHash('https://example.com/path');
    if (hash1 === hash2) {
      results['TC-047-01'] = { status: 'Pass', actual: 'Same URL variations generate same hash' };
    } else {
      results['TC-047-01'] = { status: 'Fail', actual: 'URL variations generated different hashes' };
    }
  } catch (e) {
    results['TC-047-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-048-01: isValidURL valid URLs
  try {
    const valid1 = isValidURL('https://example.com');
    const valid2 = isValidURL('http://example.com/path?query=value');
    if (valid1 && valid2) {
      results['TC-048-01'] = { status: 'Pass', actual: 'Function returns true for valid URLs' };
    } else {
      results['TC-048-01'] = { status: 'Fail', actual: 'Function did not validate URLs correctly' };
    }
  } catch (e) {
    results['TC-048-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-049-01: isValidURL invalid URLs
  try {
    const invalid1 = isValidURL('');
    const invalid2 = isValidURL('not a url');
    if (!invalid1 && !invalid2) {
      results['TC-049-01'] = { status: 'Pass', actual: 'Function returns false for invalid URLs' };
    } else {
      results['TC-049-01'] = { status: 'Fail', actual: 'Function did not reject invalid URLs' };
    }
  } catch (e) {
    results['TC-049-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  return results;
}

async function testSimilarityMetrics() {
  const results = {};
  
  // TC-077-01: Levenshtein distance
  try {
    const distance = levenshteinDistance('kitten', 'sitting');
    if (distance === 3) {
      results['TC-077-01'] = { status: 'Pass', actual: `Edit distance calculated correctly: ${distance}` };
    } else {
      results['TC-077-01'] = { status: 'Fail', actual: `Expected distance 3, got ${distance}` };
    }
  } catch (e) {
    results['TC-077-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-078-01: Jaro-Winkler similarity
  try {
    const sim1 = jaroWinklerSimilarity('hello', 'hello');
    const sim2 = jaroWinklerSimilarity('hello', 'xyzabc');
    if (sim1 > 0.9 && sim2 < 0.5) {
      results['TC-078-01'] = { status: 'Pass', actual: 'Similarity scores are in expected range' };
    } else {
      results['TC-078-01'] = { status: 'Fail', actual: `Similarity scores unexpected: ${sim1}, ${sim2}` };
    }
  } catch (e) {
    results['TC-078-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  return results;
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    try {
      const baseUrl = API_BASE_URL.replace('http://', '').replace('https://', '');
      const [host, portStr] = baseUrl.includes(':') ? baseUrl.split(':') : [baseUrl, '5000'];
      const [hostname, ...pathParts] = host.split('/');
      const basePath = pathParts.length > 0 ? '/' + pathParts.join('/') : '';
      const fullPath = basePath + (path.startsWith('/') ? path : '/' + path);
      
      const options = {
        hostname: hostname,
        port: parseInt(portStr) || 5000,
        path: fullPath,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: body, headers: res.headers });
          }
        });
      });
      
      req.on('error', (err) => {
        reject(new Error(`Connection error: ${err.message}`));
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function testAPIEndpoints() {
  const results = {};
  
  // TC-146-01: Health check
  try {
    const response = await makeRequest('GET', '/api/health');
    if (response.status === 200 && response.data.status === 'running') {
      results['TC-146-01'] = { status: 'Pass', actual: `Health check returned status: ${response.data.status}` };
    } else {
      results['TC-146-01'] = { status: 'Fail', actual: `Unexpected response: ${response.status}` };
    }
  } catch (e) {
    results['TC-146-01'] = { status: 'Fail', actual: `Server not running or error: ${e.message}` };
  }
  
  // TC-148-01: 404 Not Found
  try {
    const response = await makeRequest('GET', '/api/nonexistent');
    if (response.status === 404) {
      results['TC-148-01'] = { status: 'Pass', actual: 'Correctly returned 404 for non-existent endpoint' };
    } else {
      results['TC-148-01'] = { status: 'Fail', actual: `Expected 404 but got ${response.status}` };
    }
  } catch (e) {
    results['TC-148-01'] = { status: 'Fail', actual: `Server not running or error: ${e.message}` };
  }
  
  // TC-022-01: Invalid URL format
  try {
    const response = await makeRequest('POST', '/api/scan/check', { url: 'not a url' });
    if (response.status === 400) {
      results['TC-022-01'] = { status: 'Pass', actual: 'Correctly returned 400 for invalid URL format' };
    } else {
      results['TC-022-01'] = { status: 'Fail', actual: `Expected 400 but got ${response.status}` };
    }
  } catch (e) {
    results['TC-022-01'] = { status: 'Fail', actual: `Server not running or error: ${e.message}` };
  }
  
  // TC-023-01: Empty URL
  try {
    const response = await makeRequest('POST', '/api/scan/check', { url: '' });
    if (response.status === 400) {
      results['TC-023-01'] = { status: 'Pass', actual: 'Correctly returned 400 for empty URL' };
    } else {
      results['TC-023-01'] = { status: 'Fail', actual: `Expected 400 but got ${response.status}` };
    }
  } catch (e) {
    results['TC-023-01'] = { status: 'Fail', actual: `Server not running or error: ${e.message}` };
  }
  
  // TC-024-01: URL too short
  try {
    const response = await makeRequest('POST', '/api/scan/check', { url: 'abc' });
    if (response.status === 400) {
      results['TC-024-01'] = { status: 'Pass', actual: 'Correctly returned 400 for URL too short' };
    } else {
      results['TC-024-01'] = { status: 'Fail', actual: `Expected 400 but got ${response.status}` };
    }
  } catch (e) {
    results['TC-024-01'] = { status: 'Fail', actual: `Server not running or error: ${e.message}` };
  }
  
  // TC-019-01: Valid URL scan (safe)
  try {
    const response = await makeRequest('POST', '/api/scan/check', { url: 'https://www.google.com' });
    if (response.status === 200 && response.data && response.data.data && response.data.data.classification) {
      results['TC-019-01'] = { status: 'Pass', actual: `URL scanned successfully, classification: ${response.data.data.classification}` };
    } else {
      results['TC-019-01'] = { status: 'Fail', actual: 'Unexpected response format' };
    }
  } catch (e) {
    results['TC-019-01'] = { status: 'Fail', actual: `Server not running or error: ${e.message}` };
  }
  
  // TC-025-01: Data URI detection
  try {
    const response = await makeRequest('POST', '/api/scan/check', { url: 'data:text/html,<script>alert("xss")</script>' });
    if (response.status === 200 && response.data && response.data.data && response.data.data.classification === 'dangerous') {
      results['TC-025-01'] = { status: 'Pass', actual: 'Data URI correctly detected as dangerous' };
    } else {
      results['TC-025-01'] = { status: 'Fail', actual: 'Data URI not detected as dangerous' };
    }
  } catch (e) {
    results['TC-025-01'] = { status: 'Fail', actual: `Server not running or error: ${e.message}` };
  }
  
  // TC-026-01: URL shortener detection
  try {
    const response = await makeRequest('POST', '/api/scan/check', { url: 'https://bit.ly/abc123' });
    if (response.status === 200 && response.data && response.data.data && response.data.data.is_shortener) {
      results['TC-026-01'] = { status: 'Pass', actual: 'URL shortener correctly detected' };
    } else {
      results['TC-026-01'] = { status: 'Fail', actual: 'URL shortener not detected' };
    }
  } catch (e) {
    results['TC-026-01'] = { status: 'Fail', actual: `Server not running or error: ${e.message}` };
  }
  
  return results;
}

// Main test execution
async function runTests() {
  console.log('🧪 Starting AnLink Test Execution...\n');
  
  try {
    const { headers, tests } = readTestLog();
    console.log(`📋 Loaded ${tests.length} test cases from test log\n`);
    const allResults = {};
  
  // Test URL Parser Functions (Unit Tests)
  console.log('📋 Testing URL Parser Functions...');
  const parserResults = await testURLParserFunctions();
  Object.assign(allResults, parserResults);
  
  // Test Similarity Metrics (Unit Tests)
  console.log('📋 Testing Similarity Metrics...');
  const similarityResults = await testSimilarityMetrics();
  Object.assign(allResults, similarityResults);
  
  // Test API Endpoints (Integration Tests)
  console.log('📋 Testing API Endpoints...');
  try {
    const apiResults = await testAPIEndpoints();
    Object.assign(allResults, apiResults);
  } catch (e) {
    console.log(`⚠️  API tests skipped (server may not be running): ${e.message}`);
  }
  
  // Update test log
  console.log('\n📝 Updating test log...');
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    if (allResults[test.testCaseId]) {
      test.actualResult = allResults[test.testCaseId].actual;
      test.status = allResults[test.testCaseId].status;
      console.log(`  ✓ ${test.testCaseId}: ${test.status}`);
    }
  }
  
  writeTestLog(headers, tests);
  
  // Summary
  const passed = tests.filter(t => t.status === 'Pass').length;
  const failed = tests.filter(t => t.status === 'Fail').length;
  const executed = passed + failed;
  const total = tests.length;
  
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${total}`);
  console.log(`   Executed: ${executed}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Not Executed: ${total - executed}`);
  console.log(`   Pass Rate: ${executed > 0 ? ((passed / executed) * 100).toFixed(1) : 0}%`);
  console.log('\n✅ Test execution complete!');
  } catch (error) {
    console.error('❌ Error during test execution:', error);
    console.error(error.stack);
  }
}

// Run tests
runTests().catch(console.error);



