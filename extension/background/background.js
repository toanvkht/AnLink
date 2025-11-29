/**
 * AnLink Extension Background Service Worker
 * Handles automatic URL scanning, notifications, and badge updates
 */

// ============================================
// Default Configuration
// ============================================
const DEFAULT_CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  BASE_URL: 'http://localhost:3000',
  CHECK_URL: 'http://localhost:3000/check',
  REPORT_URL: 'http://localhost:3000/reports/new',
  SCAN_TIMEOUT: 15000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// Get current settings from storage
async function getSettings() {
  try {
    const settings = await chrome.storage.local.get([
      'autoScanEnabled',
      'blockDangerous', 
      'warnOnSuspicious',
      'notificationsEnabled',
      'soundAlerts',
      'apiUrl',
      'authToken'
    ]);
    
    return {
      autoScanEnabled: settings.autoScanEnabled ?? true,
      blockDangerous: settings.blockDangerous ?? true,
      warnOnSuspicious: settings.warnOnSuspicious ?? true,
      notificationsEnabled: settings.notificationsEnabled ?? true,
      soundAlerts: settings.soundAlerts ?? false,
      apiUrl: settings.apiUrl || DEFAULT_CONFIG.API_BASE_URL,
      authToken: settings.authToken || ''
    };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return {
      autoScanEnabled: true,
      blockDangerous: true,
      warnOnSuspicious: true,
      notificationsEnabled: true,
      soundAlerts: false,
      apiUrl: DEFAULT_CONFIG.API_BASE_URL,
      authToken: ''
    };
  }
}

// ============================================
// URL Patterns to Skip
// ============================================
const SKIP_PATTERNS = [
  /^chrome:\/\//,
  /^chrome-extension:\/\//,
  /^about:/,
  /^edge:\/\//,
  /^moz-extension:\/\//,
  /^file:\/\//,
  /^data:/,
  /^localhost/,
  /^127\.0\.0\.1/,
  /^192\.168\./,
  /^10\./,
];

// ============================================
// Utility Functions
// ============================================
function shouldSkipUrl(url) {
  if (!url) return true;
  return SKIP_PATTERNS.some(pattern => pattern.test(url));
}

function getCacheKey(url) {
  return `scan_${url}`;
}

// ============================================
// API Functions
// ============================================
async function scanUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_CONFIG.SCAN_TIMEOUT);

  try {
    const settings = await getSettings();
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (settings.authToken) {
      headers['Authorization'] = `Bearer ${settings.authToken}`;
    }

    const response = await fetch(`${settings.apiUrl}/scan/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Scan failed');
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Scan error:', error);
    return null;
  }
}

// ============================================
// Cache Functions
// ============================================
async function getCachedResult(url) {
  try {
    const key = getCacheKey(url);
    const cached = await chrome.storage.local.get(key);
    const entry = cached[key];
    
    if (entry && (Date.now() - entry.timestamp) < DEFAULT_CONFIG.CACHE_DURATION) {
      return entry.result;
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function setCachedResult(url, result) {
  try {
    const key = getCacheKey(url);
    await chrome.storage.local.set({
      [key]: {
        result,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// ============================================
// Badge Functions
// ============================================
async function updateBadge(tabId, classification, score) {
  let color, text;
  
  switch (classification) {
    case 'safe':
      color = '#10b981';
      text = '✓';
      break;
    case 'suspicious':
      color = '#f59e0b';
      text = '⚠';
      break;
    case 'dangerous':
      color = '#ef4444';
      text = '✗';
      break;
    default:
      color = '#64748b';
      text = '';
  }

  try {
    await chrome.action.setBadgeBackgroundColor({ color, tabId });
    await chrome.action.setBadgeText({ text, tabId });
  } catch (error) {
    console.error('Badge update error:', error);
  }
}

async function clearBadge(tabId) {
  try {
    await chrome.action.setBadgeText({ text: '', tabId });
  } catch (error) {
    console.error('Clear badge error:', error);
  }
}

// ============================================
// Notification Functions
// ============================================
async function showDangerNotification(url, score, settings) {
  try {
    if (!settings || !settings.notificationsEnabled) return;

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    await chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: '⚠️ Dangerous Website Detected!',
      message: `${domain} has been flagged as potentially dangerous (${Math.round(score * 100)}% risk). Proceed with caution!`,
      priority: 2,
      buttons: [
        { title: '📊 View Details' },
        { title: '🚨 Report Site' },
      ],
      requireInteraction: true,
    });

    // Play sound if enabled
    if (settings.soundAlerts) {
      // Create audio context for notification sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijcIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yo3CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors
      } catch (err) {
        console.log('Could not play sound:', err);
      }
    }

    // Store for notification click handling
    await chrome.storage.local.set({
      lastDangerousUrl: url,
      lastDangerousScore: score,
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

async function showSuspiciousNotification(url, score) {
  try {
    const settings = await getSettings();
    
    if (!settings.notificationsEnabled || !settings.warnOnSuspicious) return;

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    await chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: '⚠️ Suspicious Website',
      message: `${domain} shows some suspicious patterns (${Math.round(score * 100)}% risk). Be careful with personal information.`,
      priority: 1,
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// ============================================
// Main Scan Handler
// ============================================
async function handleTabScan(tabId, url) {
  if (shouldSkipUrl(url)) {
    clearBadge(tabId);
    return;
  }

  try {
    const settings = await getSettings();
    
    // Check if auto-scan is enabled
    if (!settings.autoScanEnabled) {
      clearBadge(tabId);
      return;
    }

    // Check cache first
    let result = await getCachedResult(url);
    
    if (!result) {
      // Perform new scan
      result = await scanUrl(url);
      
      if (result && result.success) {
        await setCachedResult(url, result);
      }
    }

    if (result && result.success && result.data) {
      const { classification, score } = result.data;
      
      // Update badge
      await updateBadge(tabId, classification, score);
      
      // Show notification for dangerous sites (if enabled)
      if (classification === 'dangerous' && settings.notificationsEnabled) {
        await showDangerNotification(url, score, settings);
      } else if (classification === 'suspicious' && settings.notificationsEnabled && settings.warnOnSuspicious) {
        await showSuspiciousNotification(url, score);
      }
      
      // Send message to content script to show blocking overlay (if enabled)
      if (classification === 'dangerous' && settings.blockDangerous) {
        try {
          await chrome.tabs.sendMessage(tabId, {
            type: 'SHOW_WARNING',
            data: { classification, score, url }
          });
        } catch (err) {
          // Content script might not be ready, ignore
          console.log('Could not send message to content script:', err);
        }
      }
      
      // Update stats only if auto-scan is enabled (these are automatic scans)
      if (settings.autoScanEnabled) {
        await updateStats(classification);
      }
    } else {
      clearBadge(tabId);
    }
  } catch (error) {
    console.error('Tab scan error:', error);
    clearBadge(tabId);
  }
}

// ============================================
// Stats Functions
// ============================================
async function updateStats(classification) {
  try {
    const { stats = { scans: 0, threats: 0 } } = await chrome.storage.local.get('stats');
    
    stats.scans = (stats.scans || 0) + 1;
    if (classification === 'dangerous') {
      stats.threats = (stats.threats || 0) + 1;
    }
    
    await chrome.storage.local.set({ stats });
  } catch (error) {
    console.error('Stats update error:', error);
  }
}

// Reset daily stats
async function resetDailyStats() {
  try {
    const { lastReset } = await chrome.storage.local.get('lastReset');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
      await chrome.storage.local.set({
        stats: { scans: 0, threats: 0 },
        lastReset: today,
      });
    }
  } catch (error) {
    console.error('Reset stats error:', error);
  }
}

// ============================================
// Event Listeners
// ============================================

// Tab updated (URL changed)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const settings = await getSettings();
    
    if (settings.autoScanEnabled) {
      handleTabScan(tabId, tab.url);
    }
  }
});

// Tab activated (switched to)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    if (tab.url) {
      // Check if we have a cached result
      const cached = await getCachedResult(tab.url);
      
      if (cached && cached.data) {
        await updateBadge(activeInfo.tabId, cached.data.classification, cached.data.score);
      } else {
        clearBadge(activeInfo.tabId);
      }
    }
  } catch (error) {
    console.error('Tab activation error:', error);
  }
});

// Messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DANGEROUS_SITE') {
    showDangerNotification(message.data.url, message.data.score);
  }
  
  if (message.type === 'SCAN_URL') {
    handleTabScan(sender.tab?.id, message.url).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'GET_SCAN_RESULT') {
    getCachedResult(message.url).then(result => {
      sendResponse({ result });
    });
    return true;
  }
});

// Notification click handlers
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  const { lastDangerousUrl } = await chrome.storage.local.get('lastDangerousUrl');
  
  if (buttonIndex === 0) {
    // View Details - Open Check URL page
    chrome.tabs.create({ url: `${DEFAULT_CONFIG.CHECK_URL}?url=${encodeURIComponent(lastDangerousUrl)}` });
  } else if (buttonIndex === 1) {
    // Report Site - Now works without login!
    chrome.tabs.create({ url: `${DEFAULT_CONFIG.REPORT_URL}?url=${encodeURIComponent(lastDangerousUrl)}` });
  }
  
  chrome.notifications.clear(notificationId);
});

// Extension installed/updated
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.local.set({
      autoScanEnabled: true,
      notificationsEnabled: true,
      warnOnSuspicious: true,
      stats: { scans: 0, threats: 0 },
      lastReset: new Date().toDateString(),
    });
    
    // Open welcome page
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  }
  
  console.log('AnLink extension installed/updated:', details.reason);
});

// Daily stats reset alarm
chrome.alarms.create('resetDailyStats', {
  periodInMinutes: 60, // Check every hour
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetDailyStats') {
    resetDailyStats();
  }
});

// Initial setup
resetDailyStats();

console.log('AnLink background service worker started');
