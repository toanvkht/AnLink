/**
 * Simple Test Runner - Executes tests and updates test log
 */

const fs = require('fs');
const path = require('path');

// Import functions to test
const { parseURL, normalizeURL, generateURLHash, isValidURL } = require('./src/algorithms/urlParser');
const { levenshteinDistance, jaroWinklerSimilarity } = require('./src/algorithms/similarityMetrics');
const { detectDataURI, detectURLShortener } = require('./src/algorithms/heuristicAnalyzer');
const { analyzeSubdomain } = require('./src/algorithms/subdomainAnalyzer');
const { analyzePath } = require('./src/algorithms/pathAnalyzer');
const { analyzeQuery } = require('./src/algorithms/queryAnalyzer');

const TEST_LOG_PATH = path.join(__dirname, '..', 'TEST_LOG.csv');

// Read and parse CSV
function readCSV() {
  const content = fs.readFileSync(TEST_LOG_PATH, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= 7) {
      rows.push({
        testCaseId: values[0],
        testLogId: values[1],
        description: values[2].replace(/^"|"$/g, ''),
        data: values[3].replace(/^"|"$/g, ''),
        expectedResult: values[4].replace(/^"|"$/g, ''),
        actualResult: values[5].replace(/^"|"$/g, ''),
        status: values[6]
      });
    }
  }
  return { headers, rows };
}

function writeCSV(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push([
      row.testCaseId,
      row.testLogId,
      `"${row.description}"`,
      `"${row.data}"`,
      `"${row.expectedResult}"`,
      `"${row.actualResult}"`,
      row.status
    ].join(','));
  }
  fs.writeFileSync(TEST_LOG_PATH, lines.join('\n'), 'utf-8');
}

// Test execution functions
function testURLParser() {
  const results = {};
  
  // TC-036-01
  try {
    const r = parseURL('http://example.com/path');
    if (r && r.scheme === 'http' && r.domain === 'example.com' && r.path === '/path') {
      results['TC-036-01'] = { status: 'Pass', actual: 'Function correctly extracts all components' };
    } else {
      results['TC-036-01'] = { status: 'Fail', actual: `Got: scheme=${r?.scheme}, domain=${r?.domain}, path=${r?.path}` };
    }
  } catch (e) {
    results['TC-036-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-037-01
  try {
    const r = parseURL('https://example.com');
    if (r && r.scheme === 'https') {
      results['TC-037-01'] = { status: 'Pass', actual: 'Function correctly extracts HTTPS scheme' };
    } else {
      results['TC-037-01'] = { status: 'Fail', actual: `Got scheme: ${r?.scheme}` };
    }
  } catch (e) {
    results['TC-037-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-038-01
  try {
    const r = parseURL('example.com/path');
    if (r && r.scheme === 'https') {
      results['TC-038-01'] = { status: 'Pass', actual: 'Function automatically adds https:// prefix' };
    } else {
      results['TC-038-01'] = { status: 'Fail', actual: `Got scheme: ${r?.scheme}` };
    }
  } catch (e) {
    results['TC-038-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-039-01
  try {
    const r = parseURL('https://subdomain.example.com');
    if (r && r.subdomain === 'subdomain' && r.domain === 'example.com') {
      results['TC-039-01'] = { status: 'Pass', actual: 'Function correctly extracts subdomain and domain' };
    } else {
      results['TC-039-01'] = { status: 'Fail', actual: `Got subdomain: ${r?.subdomain}, domain: ${r?.domain}` };
    }
  } catch (e) {
    results['TC-039-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-044-01
  try {
    const r1 = normalizeURL('https://example.com/path/');
    const r2 = normalizeURL('https://example.com/path');
    if (r1 === r2) {
      results['TC-044-01'] = { status: 'Pass', actual: 'Both URLs normalize to same result' };
    } else {
      results['TC-044-01'] = { status: 'Fail', actual: `Different results: "${r1}" vs "${r2}"` };
    }
  } catch (e) {
    results['TC-044-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-046-01
  try {
    const r1 = normalizeURL('HTTPS://EXAMPLE.COM');
    const r2 = normalizeURL('https://example.com');
    if (r1 === r2) {
      results['TC-046-01'] = { status: 'Pass', actual: 'Both URLs normalize to lowercase' };
    } else {
      results['TC-046-01'] = { status: 'Fail', actual: `Different results: "${r1}" vs "${r2}"` };
    }
  } catch (e) {
    results['TC-046-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-047-01
  try {
    const h1 = generateURLHash('HTTPS://EXAMPLE.COM/path/');
    const h2 = generateURLHash('https://example.com/path');
    if (h1 === h2) {
      results['TC-047-01'] = { status: 'Pass', actual: 'Same URL variations generate same hash' };
    } else {
      results['TC-047-01'] = { status: 'Fail', actual: 'URL variations generated different hashes' };
    }
  } catch (e) {
    results['TC-047-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-048-01
  try {
    const v1 = isValidURL('https://example.com');
    const v2 = isValidURL('http://example.com/path?query=value');
    if (v1 && v2) {
      results['TC-048-01'] = { status: 'Pass', actual: 'Function returns true for valid URLs' };
    } else {
      results['TC-048-01'] = { status: 'Fail', actual: `Got: ${v1}, ${v2}` };
    }
  } catch (e) {
    results['TC-048-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-049-01
  try {
    const v1 = isValidURL('');
    const v2 = isValidURL('not a url');
    if (!v1 && !v2) {
      results['TC-049-01'] = { status: 'Pass', actual: 'Function returns false for invalid URLs' };
    } else {
      results['TC-049-01'] = { status: 'Fail', actual: `Got: ${v1}, ${v2}` };
    }
  } catch (e) {
    results['TC-049-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  return results;
}

function testSimilarity() {
  const results = {};
  
  // TC-077-01
  try {
    const dist = levenshteinDistance('kitten', 'sitting');
    if (dist === 3) {
      results['TC-077-01'] = { status: 'Pass', actual: `Edit distance calculated correctly: ${dist}` };
    } else {
      results['TC-077-01'] = { status: 'Fail', actual: `Expected 3, got ${dist}` };
    }
  } catch (e) {
    results['TC-077-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-078-01
  try {
    const sim1 = jaroWinklerSimilarity('hello', 'hello');
    const sim2 = jaroWinklerSimilarity('hello', 'xyzabc');
    if (sim1 > 0.9 && sim2 < 0.5) {
      results['TC-078-01'] = { status: 'Pass', actual: `Similarity scores in expected range: ${sim1.toFixed(3)}, ${sim2.toFixed(3)}` };
    } else {
      results['TC-078-01'] = { status: 'Fail', actual: `Unexpected scores: ${sim1}, ${sim2}` };
    }
  } catch (e) {
    results['TC-078-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  return results;
}

function testHeuristics() {
  const results = {};
  
  // TC-072-01
  try {
    const check = detectDataURI('data:text/html,<script>alert("xss")</script>');
    if (check && check.detected && check.score >= 0.80) {
      results['TC-072-01'] = { status: 'Pass', actual: `Data URI detected with score: ${check.score}` };
    } else {
      results['TC-072-01'] = { status: 'Fail', actual: `Data URI not detected or score too low: ${check?.score}` };
    }
  } catch (e) {
    results['TC-072-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-073-01
  try {
    const check = detectURLShortener('bit.ly');
    if (check && check.detected) {
      results['TC-073-01'] = { status: 'Pass', actual: 'URL shortener correctly detected' };
    } else {
      results['TC-073-01'] = { status: 'Fail', actual: 'URL shortener not detected' };
    }
  } catch (e) {
    results['TC-073-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  return results;
}

function testAnalyzers() {
  const results = {};
  
  // TC-057-01
  try {
    const comp = parseURL('https://secure-paypal-login.example.com');
    const analysis = analyzeSubdomain(comp.subdomain || '', comp.domain, comp);
    if (analysis && analysis.score > 0) {
      results['TC-057-01'] = { status: 'Pass', actual: `Suspicious subdomain detected with score: ${analysis.score}` };
    } else {
      results['TC-057-01'] = { status: 'Fail', actual: `No suspicious pattern detected, score: ${analysis?.score}` };
    }
  } catch (e) {
    results['TC-057-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-062-01
  try {
    const analysis = analyzePath('/secure-login/verify-account', {});
    if (analysis && analysis.score > 0) {
      results['TC-062-01'] = { status: 'Pass', actual: `Suspicious keywords detected with score: ${analysis.score}` };
    } else {
      results['TC-062-01'] = { status: 'Fail', actual: `No keywords detected, score: ${analysis?.score}` };
    }
  } catch (e) {
    results['TC-062-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  // TC-067-01
  try {
    const analysis = analyzeQuery('redirect=http://evil.com', {});
    if (analysis && analysis.score > 0) {
      results['TC-067-01'] = { status: 'Pass', actual: `Suspicious parameters detected with score: ${analysis.score}` };
    } else {
      results['TC-067-01'] = { status: 'Fail', actual: `No suspicious params detected, score: ${analysis?.score}` };
    }
  } catch (e) {
    results['TC-067-01'] = { status: 'Fail', actual: `Error: ${e.message}` };
  }
  
  return results;
}

// Main execution
console.log('🧪 Starting AnLink Test Execution...\n');

const { headers, rows } = readCSV();
console.log(`📋 Loaded ${rows.length} test cases\n`);

const allResults = {};

// Run unit tests
console.log('📋 Testing URL Parser Functions...');
Object.assign(allResults, testURLParser());

console.log('📋 Testing Similarity Metrics...');
Object.assign(allResults, testSimilarity());

console.log('📋 Testing Heuristic Functions...');
Object.assign(allResults, testHeuristics());

console.log('📋 Testing Analyzer Functions...');
Object.assign(allResults, testAnalyzers());

// Update test log
console.log('\n📝 Updating test log...');
let updated = 0;
for (const row of rows) {
  if (allResults[row.testCaseId]) {
    row.actualResult = allResults[row.testCaseId].actual;
    row.status = allResults[row.testCaseId].status;
    updated++;
    console.log(`  ✓ ${row.testCaseId}: ${row.status}`);
  }
}

writeCSV(headers, rows);

// Summary
const passed = rows.filter(r => r.status === 'Pass').length;
const failed = rows.filter(r => r.status === 'Fail').length;
const executed = passed + failed;

console.log('\n📊 Test Summary:');
console.log(`   Total Tests: ${rows.length}`);
console.log(`   Executed: ${executed}`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(`   Not Executed: ${rows.length - executed}`);
console.log(`   Pass Rate: ${executed > 0 ? ((passed / executed) * 100).toFixed(1) : 0}%`);
console.log('\n✅ Test execution complete!');



