# AnLink Browser Extension

A Chrome/Edge browser extension for real-time phishing detection and website safety scanning.

## Features

- 🔍 **Instant Scanning** - Automatically scans websites when you visit them
- ⚠️ **Real-time Alerts** - Get instant notifications when visiting dangerous websites
- 🚨 **One-Click Reporting** - Report suspicious websites with a single click
- 🛡️ **Full-page Warnings** - Block dangerous sites with warning overlays
- 📊 **Detailed Analysis** - View component-level risk scores

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `extension` folder

### Production Build

```bash
# Icons need to be converted from SVG to PNG
# Use an online converter or tools like ImageMagick:
# convert icon.svg -resize 16x16 icon16.png
# convert icon.svg -resize 32x32 icon32.png
# convert icon.svg -resize 48x48 icon48.png
# convert icon.svg -resize 128x128 icon128.png
```

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── background/
│   └── background.js      # Service worker
├── content/
│   ├── content.js         # Content script
│   └── content.css        # Content styles
├── options/
│   ├── options.html       # Settings page
│   ├── options.css        # Settings styles
│   └── options.js         # Settings logic
├── welcome/
│   └── welcome.html       # Welcome page
├── icons/
│   ├── icon.svg           # Source icon
│   ├── icon16.png         # 16x16 icon
│   ├── icon32.png         # 32x32 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── README.md
```

## Configuration

### API Settings

By default, the extension connects to `http://localhost:5000/api`. You can change this in the extension settings.

### Permissions

- `activeTab` - Access current tab URL
- `tabs` - Query tab information
- `storage` - Store settings and cache
- `alarms` - Schedule tasks
- `notifications` - Show desktop notifications

## Usage

### Automatic Scanning

When you visit a website, the extension automatically:
1. Sends the URL to the AnLink backend
2. Displays the result in the extension badge (✓, !, or ✗)
3. Shows a warning overlay for dangerous sites

### Manual Scanning

1. Click the extension icon
2. The current page URL is scanned
3. View the detailed risk analysis

### Reporting

1. Click "Report Site" in the popup
2. You'll be redirected to the AnLink dashboard
3. Submit additional details about the suspicious site

## Development

### Requirements

- Chrome 88+ or Edge 88+ (for Manifest V3)
- AnLink backend running on localhost:5000

### Testing

1. Load the extension in developer mode
2. Visit test URLs:
   - Safe: `https://google.com`
   - Suspicious: `http://secure-login.example.tk`
   - Dangerous: Known phishing URLs

### Debugging

- Open `chrome://extensions/`
- Click "Service worker" to open DevTools for background script
- Right-click the extension popup and select "Inspect" for popup debugging

## API Endpoints Used

- `POST /api/scan/check` - Scan URL for phishing indicators
- `POST /api/reports` - Submit phishing reports

## Security

- No sensitive data is stored locally
- Auth tokens are stored in `chrome.storage.local`
- All API calls use HTTPS in production

## License

MIT License - See main project LICENSE
