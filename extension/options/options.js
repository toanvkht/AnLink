/**
 * AnLink Extension Options Script
 */

// Default settings
const DEFAULT_SETTINGS = {
  autoScanEnabled: true,
  blockDangerous: true,
  warnOnSuspicious: true,
  notificationsEnabled: true,
  soundAlerts: false,
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const elements = {
    autoScan: document.getElementById('autoScan'),
    blockDangerous: document.getElementById('blockDangerous'),
    warnSuspicious: document.getElementById('warnSuspicious'),
    notifications: document.getElementById('notifications'),
    soundAlerts: document.getElementById('soundAlerts'),
    totalScans: document.getElementById('totalScans'),
    threatsBlocked: document.getElementById('threatsBlocked'),
    saveBtn: document.getElementById('saveBtn'),
    resetBtn: document.getElementById('resetBtn'),
    resetStats: document.getElementById('resetStats'),
  };

  // Verify all elements exist
  for (const [key, el] of Object.entries(elements)) {
    if (!el) {
      console.error(`Element not found: ${key}`);
    }
  }

  // Load settings from storage
  async function loadSettings() {
    try {
      const settings = await chrome.storage.local.get([
        'autoScanEnabled',
        'blockDangerous',
        'warnOnSuspicious',
        'notificationsEnabled',
        'soundAlerts',
        'stats',
      ]);

      console.log('Loaded settings:', settings);

      // Apply settings to form elements
      if (elements.autoScan) {
        elements.autoScan.checked = settings.autoScanEnabled ?? DEFAULT_SETTINGS.autoScanEnabled;
      }
      if (elements.blockDangerous) {
        elements.blockDangerous.checked = settings.blockDangerous ?? DEFAULT_SETTINGS.blockDangerous;
      }
      if (elements.warnSuspicious) {
        elements.warnSuspicious.checked = settings.warnOnSuspicious ?? DEFAULT_SETTINGS.warnOnSuspicious;
      }
      if (elements.notifications) {
        elements.notifications.checked = settings.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled;
      }
      if (elements.soundAlerts) {
        elements.soundAlerts.checked = settings.soundAlerts ?? DEFAULT_SETTINGS.soundAlerts;
      }

      // Load stats
      const stats = settings.stats || { scans: 0, threats: 0 };
      if (elements.totalScans) {
        elements.totalScans.textContent = stats.scans || 0;
      }
      if (elements.threatsBlocked) {
        elements.threatsBlocked.textContent = stats.threats || 0;
      }

      console.log('Settings loaded successfully');
    } catch (error) {
      console.error('Failed to load settings:', error);
      showToast('Failed to load settings', true);
    }
  }

  // Save settings to storage
  async function saveSettings() {
    try {
      const settingsToSave = {
        autoScanEnabled: elements.autoScan?.checked ?? DEFAULT_SETTINGS.autoScanEnabled,
        blockDangerous: elements.blockDangerous?.checked ?? DEFAULT_SETTINGS.blockDangerous,
        warnOnSuspicious: elements.warnSuspicious?.checked ?? DEFAULT_SETTINGS.warnOnSuspicious,
        notificationsEnabled: elements.notifications?.checked ?? DEFAULT_SETTINGS.notificationsEnabled,
        soundAlerts: elements.soundAlerts?.checked ?? DEFAULT_SETTINGS.soundAlerts,
      };

      console.log('Saving settings:', settingsToSave);

      await chrome.storage.local.set(settingsToSave);

      showToast('Settings saved successfully!');
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings', true);
    }
  }

  // Reset to defaults
  async function resetToDefaults() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    try {
      await chrome.storage.local.set(DEFAULT_SETTINGS);
      await loadSettings(); // Reload UI
      showToast('Settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showToast('Failed to reset settings', true);
    }
  }

  // Reset statistics
  async function resetStatistics() {
    if (!confirm('Are you sure you want to reset all statistics?')) {
      return;
    }

    try {
      await chrome.storage.local.set({
        stats: { scans: 0, threats: 0 },
      });
      if (elements.totalScans) elements.totalScans.textContent = '0';
      if (elements.threatsBlocked) elements.threatsBlocked.textContent = '0';
      showToast('Statistics reset');
    } catch (error) {
      console.error('Failed to reset stats:', error);
      showToast('Failed to reset statistics', true);
    }
  }

  // Show toast notification
  function showToast(message, isError = false) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    if (isError) {
      toast.style.background = '#ef4444';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Event listeners
  if (elements.saveBtn) {
    elements.saveBtn.addEventListener('click', saveSettings);
  }
  
  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', resetToDefaults);
  }
  
  if (elements.resetStats) {
    elements.resetStats.addEventListener('click', resetStatistics);
  }

  // Auto-save on toggle changes (optional instant save)
  const toggleElements = [
    elements.autoScan,
    elements.blockDangerous,
    elements.warnSuspicious,
    elements.notifications,
    elements.soundAlerts
  ];

  toggleElements.forEach(toggle => {
    if (toggle) {
      toggle.addEventListener('change', () => {
        // Visual feedback that setting changed
        toggle.closest('.setting-item')?.classList.add('setting-changed');
        setTimeout(() => {
          toggle.closest('.setting-item')?.classList.remove('setting-changed');
        }, 500);
      });
    }
  });

  // Initialize - load settings
  loadSettings();
  
  console.log('AnLink Options page initialized');
});
