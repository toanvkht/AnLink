/**
 * AnLink Extension Content Script
 * Injects warning overlays and monitors page activity
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
  WARNING_Z_INDEX: 2147483647,
  CHECK_DELAY: 500,
};

// ============================================
// State
// ============================================
let warningShown = false;
let scanResult = null;

// ============================================
// Warning Overlay Functions
// ============================================
function createWarningOverlay(classification, score, url) {
  // Remove existing overlay if any
  removeWarningOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'anlink-warning-overlay';
  
  const isBlocking = classification === 'dangerous';
  const scorePercent = Math.round(score * 100);
  
  let iconSvg, titleText, messageText, bgGradient, iconColor;
  
  if (classification === 'dangerous') {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`;
    titleText = '⚠️ Dangerous Website Detected!';
    messageText = 'This website has been identified as a potential phishing site. We strongly recommend not entering any personal information.';
    bgGradient = 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)';
    iconColor = '#fecaca';
  } else if (classification === 'suspicious') {
    iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`;
    titleText = '⚠️ Suspicious Website';
    messageText = 'This website shows some suspicious patterns. Please be cautious and verify its legitimacy before sharing any information.';
    bgGradient = 'linear-gradient(135deg, rgba(217, 119, 6, 0.95) 0%, rgba(180, 83, 9, 0.95) 100%)';
    iconColor = '#fef3c7';
  }

  overlay.innerHTML = `
    <div class="anlink-warning-container">
      <div class="anlink-warning-icon" style="color: ${iconColor}">
        ${iconSvg}
      </div>
      
      <div class="anlink-warning-content">
        <h2 class="anlink-warning-title">${titleText}</h2>
        <p class="anlink-warning-message">${messageText}</p>
        
        <div class="anlink-warning-details">
          <div class="anlink-warning-score">
            <span class="anlink-score-value">${scorePercent}%</span>
            <span class="anlink-score-label">Risk Score</span>
          </div>
          <div class="anlink-warning-url">
            <span class="anlink-url-label">URL:</span>
            <span class="anlink-url-value">${truncateUrl(url, 50)}</span>
          </div>
        </div>
      </div>
      
      <div class="anlink-warning-actions">
        ${isBlocking ? `
          <button class="anlink-btn anlink-btn-danger" id="anlink-leave-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Leave This Site
          </button>
          <button class="anlink-btn anlink-btn-secondary" id="anlink-proceed-btn">
            I understand the risks, proceed anyway
          </button>
        ` : `
          <button class="anlink-btn anlink-btn-primary" id="anlink-dismiss-btn">
            I understand, continue
          </button>
        `}
        <button class="anlink-btn anlink-btn-outline" id="anlink-report-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          Report False Positive
        </button>
      </div>
      
      <div class="anlink-warning-footer">
        <span class="anlink-powered-by">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 5V11C4 16.55 7.16 21.74 12 23C16.84 21.74 20 16.55 20 11V5L12 2Z" fill="currentColor"/>
            <path d="M10 12L12 14L16 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Protected by AnLink
        </span>
      </div>
    </div>
  `;

  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: ${bgGradient} !important;
    z-index: ${CONFIG.WARNING_Z_INDEX} !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    backdrop-filter: blur(10px) !important;
  `;

  document.documentElement.appendChild(overlay);
  warningShown = true;

  // Add event listeners
  setupWarningEventListeners(overlay, isBlocking);
}

function setupWarningEventListeners(overlay, isBlocking) {
  const leaveBtn = overlay.querySelector('#anlink-leave-btn');
  const proceedBtn = overlay.querySelector('#anlink-proceed-btn');
  const dismissBtn = overlay.querySelector('#anlink-dismiss-btn');
  const reportBtn = overlay.querySelector('#anlink-report-btn');

  if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
      // Navigate back or to safety page
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'about:blank';
      }
    });
  }

  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      removeWarningOverlay();
      // Store acknowledgment
      sessionStorage.setItem('anlink_acknowledged', window.location.href);
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      removeWarningOverlay();
    });
  }

  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      // Open report page in new tab
      window.open(`http://localhost:3000/reports/new?url=${encodeURIComponent(window.location.href)}&reason=false_positive`, '_blank');
    });
  }
}

function removeWarningOverlay() {
  const overlay = document.getElementById('anlink-warning-overlay');
  if (overlay) {
    overlay.remove();
    warningShown = false;
  }
}

function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

// ============================================
// Inject Warning Styles
// ============================================
function injectWarningStyles() {
  const style = document.createElement('style');
  style.id = 'anlink-warning-styles';
  style.textContent = `
    .anlink-warning-container {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      color: white;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: anlink-fadeIn 0.3s ease;
    }
    
    @keyframes anlink-fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    
    .anlink-warning-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
    }
    
    .anlink-warning-icon svg {
      width: 100%;
      height: 100%;
    }
    
    .anlink-warning-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 12px;
    }
    
    .anlink-warning-message {
      font-size: 14px;
      line-height: 1.6;
      opacity: 0.9;
      margin: 0 0 24px;
    }
    
    .anlink-warning-details {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 24px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
    }
    
    .anlink-warning-score {
      display: flex;
      flex-direction: column;
    }
    
    .anlink-score-value {
      font-size: 28px;
      font-weight: 700;
    }
    
    .anlink-score-label {
      font-size: 11px;
      text-transform: uppercase;
      opacity: 0.7;
    }
    
    .anlink-warning-url {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }
    
    .anlink-url-label {
      font-size: 11px;
      text-transform: uppercase;
      opacity: 0.7;
    }
    
    .anlink-url-value {
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }
    
    .anlink-warning-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .anlink-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .anlink-btn-danger {
      background: white;
      color: #dc2626;
    }
    
    .anlink-btn-danger:hover {
      background: #f8f8f8;
      transform: translateY(-2px);
    }
    
    .anlink-btn-primary {
      background: white;
      color: #0f172a;
    }
    
    .anlink-btn-primary:hover {
      background: #f8f8f8;
      transform: translateY(-2px);
    }
    
    .anlink-btn-secondary {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .anlink-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    
    .anlink-btn-outline {
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    
    .anlink-btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .anlink-warning-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .anlink-powered-by {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      opacity: 0.7;
    }
    
    .anlink-powered-by svg {
      color: #06b6d4;
    }
  `;
  
  document.head.appendChild(style);
}

// ============================================
// Check Scan Result
// ============================================
async function checkCurrentPage() {
  // Check if already acknowledged
  if (sessionStorage.getItem('anlink_acknowledged') === window.location.href) {
    return;
  }

  try {
    // Get settings first
    const settings = await chrome.storage.local.get(['blockDangerous', 'warnOnSuspicious']);
    const blockDangerous = settings.blockDangerous ?? true;
    const warnOnSuspicious = settings.warnOnSuspicious ?? true;

    // Request scan result from background
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SCAN_RESULT',
      url: window.location.href,
    });

    if (response && response.result && response.result.data) {
      const { classification, score } = response.result.data;
      scanResult = response.result.data;

      // Show warning only if settings allow it
      if (classification === 'dangerous' && blockDangerous) {
        injectWarningStyles();
        createWarningOverlay(classification, score, window.location.href);
      } else if (classification === 'suspicious' && warnOnSuspicious) {
        // Suspicious sites show non-blocking warning
        injectWarningStyles();
        createWarningOverlay(classification, score, window.location.href);
      }
    }
  } catch (error) {
    console.error('AnLink: Error checking page:', error);
  }
}

// ============================================
// Message Listener
// ============================================
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'SHOW_WARNING') {
    // Check settings before showing
    const settings = await chrome.storage.local.get(['blockDangerous']);
    const blockDangerous = settings.blockDangerous ?? true;
    
    if (blockDangerous && message.data.classification === 'dangerous') {
      const { classification, score } = message.data;
      injectWarningStyles();
      createWarningOverlay(classification, score, window.location.href);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, reason: 'blocking disabled' });
    }
  }
  
  if (message.type === 'HIDE_WARNING') {
    removeWarningOverlay();
    sendResponse({ success: true });
  }
});

// ============================================
// Initialize
// ============================================
// Wait for page to be interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkCurrentPage, CONFIG.CHECK_DELAY);
  });
} else {
  setTimeout(checkCurrentPage, CONFIG.CHECK_DELAY);
}

console.log('AnLink content script loaded');
