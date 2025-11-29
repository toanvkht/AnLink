/**
 * AnLink Extension Popup Script
 * Handles URL scanning and displays results
 */

// ============================================
// Default Configuration
// ============================================
const DEFAULT_CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  BASE_URL: 'http://localhost:3000',
  CHECK_URL: 'http://localhost:3000/check',
  DASHBOARD_URL: 'http://localhost:3000/dashboard',
  REPORT_URL: 'http://localhost:3000/reports/new',
  LOGIN_URL: 'http://localhost:3000/login',
  SCAN_TIMEOUT: 30000,
};

// Get current settings from storage
async function getConfig() {
  try {
    const settings = await chrome.storage.local.get(['apiUrl', 'authToken']);
    return {
      ...DEFAULT_CONFIG,
      API_BASE_URL: settings.apiUrl || DEFAULT_CONFIG.API_BASE_URL,
      authToken: settings.authToken || ''
    };
  } catch (error) {
    console.error('Failed to get config:', error);
    return DEFAULT_CONFIG;
  }
}

// ============================================
// DOM Elements
// ============================================
const elements = {
  // URL Display
  currentUrl: document.getElementById('currentUrl'),
  
  // States
  loadingState: document.getElementById('loadingState'),
  safeState: document.getElementById('safeState'),
  suspiciousState: document.getElementById('suspiciousState'),
  dangerousState: document.getElementById('dangerousState'),
  errorState: document.getElementById('errorState'),
  
  // Scores
  safeScore: document.getElementById('safeScore'),
  suspiciousScore: document.getElementById('suspiciousScore'),
  dangerousScore: document.getElementById('dangerousScore'),
  
  // Details
  detailsSection: document.getElementById('detailsSection'),
  detailsToggle: document.getElementById('detailsToggle'),
  detailsContent: document.getElementById('detailsContent'),
  domainValue: document.getElementById('domainValue'),
  domainBar: document.getElementById('domainBar'),
  subdomainValue: document.getElementById('subdomainValue'),
  subdomainBar: document.getElementById('subdomainBar'),
  pathValue: document.getElementById('pathValue'),
  pathBar: document.getElementById('pathBar'),
  heuristicsValue: document.getElementById('heuristicsValue'),
  heuristicsBar: document.getElementById('heuristicsBar'),
  flagsSection: document.getElementById('flagsSection'),
  flagsList: document.getElementById('flagsList'),
  
  // Buttons
  scanBtn: document.getElementById('scanBtn'),
  reportBtn: document.getElementById('reportBtn'),
  retryBtn: document.getElementById('retryBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  dashboardLink: document.getElementById('dashboardLink'),
  
  // Stats
  totalScans: document.getElementById('totalScans'),
  threatsBlocked: document.getElementById('threatsBlocked'),
  
  // Error
  errorMessage: document.getElementById('errorMessage'),
};

// ============================================
// State Management
// ============================================
let currentTabUrl = '';
let currentTabId = null;
let scanResult = null;

// ============================================
// Utility Functions
// ============================================
function hideAllStates() {
  elements.loadingState.classList.add('hidden');
  elements.safeState.classList.add('hidden');
  elements.suspiciousState.classList.add('hidden');
  elements.dangerousState.classList.add('hidden');
  elements.errorState.classList.add('hidden');
}

function showState(state) {
  hideAllStates();
  state.classList.remove('hidden');
}

function formatUrl(url, maxLength = 45) {
  if (!url) return 'Unknown';
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

function getScoreColor(score) {
  if (score < 0.3) return '#10b981'; // Green
  if (score < 0.6) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
}

function formatScore(score) {
  return Math.round(score * 100) + '%';
}

// ============================================
// API Functions
// ============================================
async function scanUrl(url) {
  const config = await getConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_CONFIG.SCAN_TIMEOUT);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }

    const response = await fetch(`${config.API_BASE_URL}/scan/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Scan failed');
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Scan timed out. Please try again.');
    }
    throw error;
  }
}

// ============================================
// Display Functions
// ============================================
function displayResult(result) {
  if (!result.success || !result.data) {
    showError('Invalid response from server');
    return;
  }

  scanResult = result.data;
  const { classification, score, algorithm } = result.data;

  // Show appropriate state based on classification
  switch (classification) {
    case 'safe':
      showState(elements.safeState);
      elements.safeScore.textContent = formatScore(score);
      break;
    case 'suspicious':
      showState(elements.suspiciousState);
      elements.suspiciousScore.textContent = formatScore(score);
      break;
    case 'dangerous':
      showState(elements.dangerousState);
      elements.dangerousScore.textContent = formatScore(score);
      // Send notification for dangerous sites
      notifyDangerous(currentTabUrl, score);
      break;
    default:
      showState(elements.safeState);
      elements.safeScore.textContent = formatScore(score);
  }

  // Show details section
  elements.detailsSection.classList.remove('hidden');
  
  // Update component scores
  if (algorithm && algorithm.components) {
    const { domain, subdomain, path, heuristics } = algorithm.components;
    
    updateDetailBar('domain', domain || 0);
    updateDetailBar('subdomain', subdomain || 0);
    updateDetailBar('path', path || 0);
    updateDetailBar('heuristics', heuristics || 0);
  }

  // Update flags
  if (algorithm && algorithm.details) {
    const allFlags = [];
    Object.entries(algorithm.details).forEach(([component, data]) => {
      if (data && data.flags) {
        data.flags.forEach(flag => {
          allFlags.push({
            flag,
            score: data.score || 0,
          });
        });
      }
    });

    if (allFlags.length > 0) {
      displayFlags(allFlags);
    }
  }

  // Don't update stats here - stats should only track automatic background scans
  // Manual scans from popup are user-initiated and shouldn't count toward statistics
}

function updateDetailBar(component, score) {
  const valueEl = elements[`${component}Value`];
  const barEl = elements[`${component}Bar`];
  
  if (valueEl && barEl) {
    valueEl.textContent = formatScore(score);
    valueEl.style.color = getScoreColor(score);
    barEl.style.width = `${Math.max(score * 100, 3)}%`;
    barEl.style.background = getScoreColor(score);
  }
}

function displayFlags(flags) {
  elements.flagsSection.classList.remove('hidden');
  elements.flagsList.innerHTML = '';

  // Show top 6 flags
  flags.slice(0, 6).forEach(({ flag, score }) => {
    const flagEl = document.createElement('span');
    flagEl.className = `flag-item ${score >= 0.5 ? 'high' : score >= 0.3 ? 'medium' : ''}`;
    flagEl.textContent = flag.replace(/_/g, ' ');
    elements.flagsList.appendChild(flagEl);
  });
}

function showError(message) {
  showState(elements.errorState);
  elements.errorMessage.textContent = message;
  elements.detailsSection.classList.add('hidden');
}

// ============================================
// Stats Functions
// ============================================
// Note: Stats are only updated by the background script for automatic scans
// Manual scans from the popup do not update statistics

async function loadStats() {
  try {
    const { stats = { scans: 0, threats: 0 } } = await chrome.storage.local.get('stats');
    elements.totalScans.textContent = stats.scans || 0;
    elements.threatsBlocked.textContent = stats.threats || 0;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// ============================================
// Notification Functions
// ============================================
async function notifyDangerous(url, score) {
  try {
    // Send message to background script to create notification
    await chrome.runtime.sendMessage({
      type: 'DANGEROUS_SITE',
      data: { url, score },
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// ============================================
// Main Scan Function
// ============================================
async function performScan() {
  if (!currentTabUrl) {
    showError('No URL to scan');
    return;
  }

  // Check if URL is scannable
  if (currentTabUrl.startsWith('chrome://') || 
      currentTabUrl.startsWith('chrome-extension://') ||
      currentTabUrl.startsWith('about:') ||
      currentTabUrl.startsWith('edge://')) {
    showError('Cannot scan browser internal pages');
    return;
  }

  showState(elements.loadingState);
  elements.detailsSection.classList.add('hidden');

  try {
    const result = await scanUrl(currentTabUrl);
    displayResult(result);
    
    // Cache result in storage
    await chrome.storage.local.set({
      [`scan_${currentTabUrl}`]: {
        result,
        timestamp: Date.now(),
      },
    });
    
    // Update badge based on result
    updateBadge(result.data.classification, result.data.score);
    
  } catch (error) {
    console.error('Scan error:', error);
    showError(error.message || 'Failed to scan URL');
  }
}

// ============================================
// Badge Update
// ============================================
function updateBadge(classification, score) {
  let color, text;
  
  switch (classification) {
    case 'safe':
      color = '#10b981';
      text = '✓';
      break;
    case 'suspicious':
      color = '#f59e0b';
      text = '!';
      break;
    case 'dangerous':
      color = '#ef4444';
      text = '✗';
      break;
    default:
      color = '#64748b';
      text = '';
  }

  chrome.action.setBadgeBackgroundColor({ color, tabId: currentTabId });
  chrome.action.setBadgeText({ text, tabId: currentTabId });
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  // Scan button
  elements.scanBtn.addEventListener('click', performScan);

  // Retry button
  elements.retryBtn.addEventListener('click', performScan);

  // Report button
  elements.reportBtn.addEventListener('click', () => {
    const reportUrl = `${DEFAULT_CONFIG.REPORT_URL}?url=${encodeURIComponent(currentTabUrl)}`;
    chrome.tabs.create({ url: reportUrl });
  });

  // Settings button
  elements.settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Dashboard link - opens the Check URL page (public, no auth required)
  elements.dashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: DEFAULT_CONFIG.CHECK_URL });
  });

  // Details toggle
  elements.detailsToggle.addEventListener('click', () => {
    elements.detailsToggle.classList.toggle('active');
    elements.detailsContent.classList.toggle('hidden');
  });
}

// ============================================
// Initialization
// ============================================
async function init() {
  setupEventListeners();
  loadStats();

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      currentTabUrl = tab.url;
      currentTabId = tab.id;
      elements.currentUrl.textContent = formatUrl(currentTabUrl);

      // Check for cached result
      const cached = await chrome.storage.local.get(`scan_${currentTabUrl}`);
      const cacheEntry = cached[`scan_${currentTabUrl}`];
      
      // Use cached result if less than 5 minutes old
      if (cacheEntry && (Date.now() - cacheEntry.timestamp) < 5 * 60 * 1000) {
        displayResult(cacheEntry.result);
      } else {
        // Auto-scan on popup open
        performScan();
      }
    } else {
      elements.currentUrl.textContent = 'No URL available';
      showError('Cannot access current page URL');
    }
  } catch (error) {
    console.error('Init error:', error);
    showError('Failed to initialize extension');
  }
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
