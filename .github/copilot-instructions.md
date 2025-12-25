
# AnLink - AI Coding Agent Instructions

## Project Overview
AnLink is a **cloud-based anti-phishing system** protecting Vietnamese users from malicious websites through real-time URL scanning, community reporting, and safety education. The system consists of three integrated components: a **Node.js/Express backend** with custom phishing detection algorithms, a **React frontend** web application, and a **Chrome extension** for browser-level protection.

## Architecture & Components

### Three-Tier Application Structure
- **Backend** (`/backend`): Express API server, PostgreSQL database, custom phishing detection algorithms
- **Frontend** (`/frontend`): React SPA with Tailwind CSS, role-based dashboards, education system
- **Extension** (`/extension`): Chrome Manifest V3 extension with service worker architecture

### Key Architectural Decisions

**Algorithm-First Design**: The phishing detection system (`/backend/src/algorithms/`) is modular by design. Each analysis component (domain, subdomain, path, query, heuristics) operates independently and exports specific functions. The `index.js` centralized export pattern enables clean imports: `const { analyzeDomain, detectBrandImpersonation } = require('./algorithms')`.

**Role-Based Access Control**: Three distinct user roles (`community_user`, `moderator`, `admin`) with middleware enforcement in `/backend/src/middleware/roleMiddleware.js`. Authentication uses JWT tokens (secret in `.env` file) with bcrypt password hashing (12 rounds). Always use `reset-passwords.js` script when fixing password authentication issues.

**Dual-Purpose Education System**: The education content management (`/frontend/src/pages/AdminEducationPage.jsx`) supports three content types:
- **Article/Video**: Uses a **block-based editor** (not plain textarea) with 6 block types: heading, subheading, paragraph, list, callout, warning. Blocks convert to HTML via `blocksToHTML()` for storage, and parse back via `htmlToBlocks()` for editing.
- **Quiz**: Separate editor component (`QuizQuestionEditor`) stored as JSON, not HTML.

**Browser Extension Integration**: Manifest V3 service worker (`/extension/background/background.js`) scans URLs automatically via the backend API, caches results (5-minute TTL), and shows notifications. Settings stored in `chrome.storage.local`.

## Development Workflows

### Database Operations
```bash
# Connect to database (anlink_dev_clone by default)
psql -U postgres -d anlink_dev_clone

# Run schema setup
psql -U postgres -d anlink_dev_clone -f database/anlink_schema.sql

# Reset all user passwords (Admin123!, Mod123!, User123!)
node backend/reset-passwords.js

# Seed education content
node backend/run-education-seed-fixed.js
```

**Important**: Database connection pool configured in `/backend/src/config/database.js` with max 20 connections. Always use the `query()` helper function exported from this module, never create raw pool connections in controllers.

### Starting Development Servers
```bash
# Backend (Port 5000)
cd backend
npm install
npm run dev          # Uses nodemon for auto-reload

# Frontend (Port 3000)
cd frontend
npm install
npm start            # React development server

# Extension - Load unpacked in chrome://extensions
```

**Environment Configuration**: Backend requires `.env` file with:
- `JWT_SECRET` (default: anlink_secret_key_change_in_production_12345)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Frontend optionally uses `REACT_APP_API_URL` (defaults to localhost:5000)

### Testing Credentials
Use these accounts for development (defined in `README.md`):
- **Admin**: admin@anlink.vn / Admin123!
- **Moderator**: moderator@anlink.vn / Mod123!
- **Community User**: user1@gmail.com / User123!

## Critical Patterns & Conventions

### Controller Response Format
All API responses follow this standard structure:
```javascript
res.json({
  service: 'AnLink API',
  success: true,
  data: { /* response payload */ }
});
```

Error responses include `success: false` and `error` field. See `/backend/src/controllers/scanController.js` for the canonical example with detailed step-by-step comments.

### Frontend API Service Pattern
All backend communication goes through `/frontend/src/services/api.js` which exports domain-specific API objects:
```javascript
import { scanAPI, authAPI, educationAPI, adminAPI } from '../services/api';

// Example usage
const result = await scanAPI.checkUrl({ url: 'https://example.com' });
const content = await educationAPI.getContentBySlug('phishing-101');
```

Axios interceptor automatically adds JWT token from localStorage. **Never** manually set Authorization headers in components.

### Authentication Flow
1. Login via `AuthContext.jsx` which wraps entire app
2. JWT token stored in localStorage (key: 'token')
3. User object stored in localStorage (key: 'user')
4. Access user context in components: `const { user, login, logout } = useAuth();`
5. Protected routes use `<ProtectedRoute requireRole="admin">` wrapper (see `/frontend/src/App.jsx`)

### Phishing Algorithm Integration
When adding new detection logic:
1. Create analyzer function in appropriate `/backend/src/algorithms/*Analyzer.js` file
2. Export function in `/backend/src/algorithms/index.js`
3. Import and call in `/backend/src/controllers/scanController.js`'s `scanURL()` method
4. Results aggregate via `scoreAggregator.aggregateScore()` with weighted scoring

**Scoring System**: Each analyzer returns an object with `score` (0-100), `signals` array, and `metadata`. The `aggregateScore()` function applies configurable weights (see `DEFAULT_WEIGHTS` in `scoreAggregator.js`). Final scores classify as: Safe (<30), Suspicious (30-69), Dangerous (70+).

### Education Content Block Editor
When working with education content in `AdminEducationPage.jsx`:
- **State management**: `contentBlocks` array holds block objects: `{ id, type, content }`
- **Six block types**: heading, subheading, paragraph, list, callout, warning
- **HTML conversion**: `blocksToHTML(blocks)` for save, `htmlToBlocks(html)` for edit
- **Preview mode**: Toggle between Edit and Preview, preview renders HTML via `dangerouslySetInnerHTML`
- **Quiz content**: Uses separate `QuizQuestionEditor` component, stored as JSON in `content_body`

### File Upload Handling
Education content supports file uploads (images, videos, PDFs up to 10MB):
```javascript
// Backend: multer middleware in uploadMiddleware.js
// Frontend: FormData construction
const formData = new FormData();
formData.append('title', 'My Title');
formData.append('media', fileObject);
await educationAPI.createContent(formData); // Axios handles headers
```

**Important**: When using FormData, axios automatically sets correct Content-Type with boundary. Never manually set 'Content-Type' header (see `/frontend/src/services/api.js` interceptor).

### Database Schema Key Tables
- **users**: UUID primary keys, bcrypt password_hash, role enum, status enum
- **suspicious_urls**: url_hash (SHA-256) for O(1) duplicate detection
- **url_check_history**: User scan history with full algorithm results (JSONB column)
- **reports**: Community-submitted phishing reports with moderator assignment
- **education_content**: Supports article/video (HTML content_body) and quiz (JSON content_body)

### Chrome Extension Manifest V3
Service worker (`background.js`) replaces background pages. Key differences:
- No DOM access, no `window` object
- Use `chrome.storage.local` instead of localStorage
- Alarms API for periodic tasks
- Message passing to content scripts via `chrome.tabs.sendMessage()`

**Auto-scan flow**: Tab navigation → background.js intercepts → API scan → content script shows banner if dangerous

## Common Pitfalls to Avoid

❌ **Don't** create new textarea for education content - use existing BlockEditor component  
❌ **Don't** move `QuizQuestionEditor` inside parent component - causes focus loss on keystroke  
❌ **Don't** use `window.location` in extension service worker - use chrome.tabs API  
❌ **Don't** hash passwords manually - use `reset-passwords.js` script to ensure consistent bcrypt rounds  
❌ **Don't** create raw SQL queries - use the pool query helper from `/backend/src/config/database.js`  
❌ **Don't** forget to parse existing HTML into blocks when editing education content  

## Quick Reference: File Locations

- **Main server**: `/backend/src/server.js` (routes mounted here)
- **Auth middleware**: `/backend/src/middleware/authMiddleware.js` (JWT verification)
- **Algorithm exports**: `/backend/src/algorithms/index.js` (centralized imports)
- **Scan logic**: `/backend/src/controllers/scanController.js` (~735 lines, well-commented)
- **Education admin page**: `/frontend/src/pages/AdminEducationPage.jsx` (block editor)
- **API service**: `/frontend/src/services/api.js` (all backend communication)
- **Auth context**: `/frontend/src/context/AuthContext.jsx` (login/logout/user state)
- **Database schema**: `/database/anlink_schema.sql` (PostgreSQL DDL)
- **Extension background**: `/extension/background/background.js` (service worker)

## Testing & Debugging

- Use Postman or similar for API testing (backend runs on port 5000)
- React DevTools for component state inspection
- Chrome DevTools → Application → Service Workers for extension debugging
- Check PostgreSQL logs: `SELECT * FROM user_activity_logs ORDER BY timestamp DESC;`
- Extension console logs appear in chrome://extensions → "Inspect service worker"

## Best Practices
 Testing & Reliability - **Always create unit tests for new features** 
(functions, classes, routes, etc). - **After updating any logic**, check whether existing unit tests 
need to be updated. If so, do it. - **Tests should live in a `/tests` folder** mirroring the main 
app structure. - Include at least: - 1 test for expected use - 1 edge case - 1 failure case 



### 
�
�
 Project Awareness & Context - **Always read `PLANNING.md`** at the start of a new 
conversation to understand the project's architecture, goals, 
style, and constraints. 
- **Check `TASK.md`** before starting a new task. If the task 
isn’t listed, add it with a brief description and today's date. - **Use consistent naming conventions, file structure, and 
architecture patterns** as described in `PLANNING.md`. 


### 
 Task Completion - **Mark completed tasks in `TASK.md`** immediately after 
finishing them. - Add new sub-tasks or TODOs discovered during development to 
`TASK.md` under a “Discovered During Work” section. 
### 
 Documentation & Explainability - **Update `README.md`** when new features are added, 
dependencies change, or setup steps are modified. - **Comment non-obvious code** and ensure everything is 
understandable to a mid-level developer. - When writing complex logic, **add an inline `# Reason:` 
comment** explaining the why, not just the what. 
 
### 
 AI Behavior Rules - **Never assume missing context. Ask questions if uncertain.** - **Never hallucinate libraries or functions** – only use known, 
verified Python packages. - **Always confirm file paths and module names** exist before 
referencing them in code or tests. - **Never delete or overwrite existing code** unless explicitly 
instructed to or if part of a task from `TASK.md
Do not generate any additional icon.
---

**Last Updated**: December 2025  
**For questions about**: Block editor, algorithm scoring, or JWT auth patterns, refer to conversation history in CLAUDE.md
