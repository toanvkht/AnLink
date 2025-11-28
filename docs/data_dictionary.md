# Data Dictionary - Anti-Phishing System Database

## Document Information
- **Project**: Fraud Detection, Prevention and Reporting System for Malicious Websites
- **Database**: PostgreSQL 14+ (Primary) + Amazon DynamoDB (High-throughput operations)
- **Version**: 1.0
- **Date**: October 31, 2025

---

## Table of Contents
1. [User Management](#user-management)
2. [URL & Phishing Detection](#url--phishing-detection)
3. [Third-Party Integration](#third-party-integration)
4. [Community Reporting](#community-reporting)
5. [Educational & Statistics](#educational--statistics)
6. [Browser Extension](#browser-extension)
7. [System Configuration](#system-configuration)
8. [Enumerations (ENUM) Reference](#enumerations-reference)

---

## User Management

### Table: users
**Purpose**: Central user account repository with role-based access control

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| user_id | UUID | PRIMARY KEY | Unique user identifier | 550e8400-e29b-41d4-a716-446655440000 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address | user@example.com |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password | $2b$12$LQv3c1yqBWVH... |
| full_name | VARCHAR(255) | NOT NULL | User's display name | Nguyen Van A |
| role | ENUM | NOT NULL | Access level | community_user, moderator, admin |
| status | ENUM | DEFAULT 'active' | Account status | active, suspended, pending |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp | 2024-10-31 14:23:45 |
| last_login | TIMESTAMP | NULL | Last successful login | 2024-10-31 16:45:00 |
| phone_number | VARCHAR(20) | NULL | Optional contact number | +84912345678 |
| location | VARCHAR(100) | NULL | User location (city/country) | Hanoi, Vietnam |
| language_preference | VARCHAR(10) | DEFAULT 'vi' | UI language preference | vi, en |

**Indexes**:
- `idx_users_role_status` on (role, status)
- `idx_users_created_at` on (created_at)

**Foreign Key References**: None (root table)

**Referenced By**:
- user_activity_logs (user_id)
- url_checks (user_id)
- reports (reported_by, assigned_to, reviewed_by)
- community_feedback (user_id)
- quiz_attempts (user_id)
- extension_sessions (user_id)
- known_phishing_urls (confirmed_by)

---

### Table: user_activity_logs
**Purpose**: Audit trail of all user actions for security and compliance

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| log_id | BIGSERIAL | PRIMARY KEY | Auto-incrementing log entry ID | 1234567 |
| user_id | UUID | FOREIGN KEY → users(user_id) | User who performed action | 550e8400-e29b-41d4-a716-446655440000 |
| action_type | VARCHAR(50) | NOT NULL | Type of action performed | login, report, scan, update_profile |
| action_details | JSONB | NULL | Additional metadata about action | {"ip": "192.168.1.1", "device": "mobile"} |
| ip_address | VARCHAR(45) | NULL | IPv4 or IPv6 address | 192.168.1.100 or 2001:0db8:85a3::8a2e:0370:7334 |
| user_agent | TEXT | NULL | Browser/client identification | Mozilla/5.0 (Windows NT 10.0...) |
| timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When action occurred | 2024-10-31 14:25:30 |

**Indexes**:
- `idx_activity_logs_user_time` on (user_id, timestamp DESC)
- `idx_activity_logs_action` on (action_type)
- `idx_activity_logs_timestamp` on (timestamp DESC)

**Business Rules**:
- Retained for 90 days (configurable)
- Sensitive actions (login failures, permission changes) logged with high priority
- Used for security audits and user behavior analytics

---

## URL & Phishing Detection

### Table: suspicious_urls
**Purpose**: Master repository of all URLs submitted for analysis

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| url_id | UUID | PRIMARY KEY | Unique URL identifier | 660e8400-e29b-41d4-a716-446655440001 |
| original_url | TEXT | NOT NULL | URL exactly as submitted | https://Login-VietinBank.com/verify?id=123 |
| normalized_url | TEXT | NOT NULL | Standardized lowercase URL | https://login-vietinbank.com/verify?id=123 |
| url_hash | VARCHAR(64) | UNIQUE, NOT NULL | SHA-256 hash for fast lookup | e3b0c44298fc1c149afbf4c8996fb92427ae41e4... |
| scheme | VARCHAR(10) | NULL | Protocol | http, https, ftp |
| domain | VARCHAR(255) | NOT NULL | Main domain name | login-vietinbank.com |
| subdomain | VARCHAR(255) | NULL | Subdomain if present | login |
| path | TEXT | NULL | URL path component | /verify |
| query_params | TEXT | NULL | Query string | id=123&token=abc |
| first_seen | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | First submission time | 2024-10-31 14:00:00 |
| last_checked | TIMESTAMP | NULL | Most recent scan | 2024-10-31 16:30:00 |
| check_count | INT | DEFAULT 0 | Number of times checked | 15 |
| status | ENUM | DEFAULT 'pending' | Current classification | pending, safe, suspicious, confirmed_phishing |

**Indexes**:
- `idx_suspicious_urls_hash` UNIQUE on (url_hash)
- `idx_suspicious_urls_domain` on (domain)
- `idx_suspicious_urls_status_checked` on (status, last_checked)

**Business Rules**:
- url_hash enables O(1) duplicate detection
- check_count auto-increments via trigger
- Normalization includes: lowercase, remove fragments, sort query params

---

### Table: known_phishing_urls
**Purpose**: Confirmed phishing URLs (blacklist) for pattern matching

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| phishing_id | UUID | PRIMARY KEY | Unique phishing entry ID | 770e8400-e29b-41d4-a716-446655440002 |
| url_id | UUID | FOREIGN KEY → suspicious_urls | Link to original URL | 660e8400-e29b-41d4-a716-446655440001 |
| domain_pattern | VARCHAR(255) | NOT NULL | Pattern for matching | *-vietinbank.com, paypal-*.com |
| full_url_pattern | TEXT | NULL | Complete URL regex pattern | ^https?://.*vietinbank.*/verify.*$ |
| severity | ENUM | DEFAULT 'medium' | Threat severity level | low, medium, high, critical |
| phishing_type | VARCHAR(50) | NULL | Attack category | credential_theft, malware, fake_bank |
| target_brand | VARCHAR(100) | NULL | Impersonated organization | VietinBank, PayPal, Facebook |
| confirmed_by | UUID | FOREIGN KEY → users | Moderator/Admin who verified | 550e8400-e29b-41d4-a716-446655440000 |
| confirmed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Verification timestamp | 2024-10-31 15:00:00 |
| active | BOOLEAN | DEFAULT TRUE | Is pattern currently active? | true, false |
| notes | TEXT | NULL | Additional context | "Targets elderly users with fake SMS" |

**Indexes**:
- `idx_phishing_domain_pattern` on (domain_pattern)
- `idx_phishing_severity_active` on (severity, active)
- `idx_phishing_target_brand` on (target_brand)

**Business Rules**:
- active=FALSE to temporarily disable patterns without deletion
- Patterns support wildcards: * (any chars), ? (single char)
- Used by algorithm for similarity matching

---

### Table: url_checks
**Purpose**: Historical record of every URL scan operation

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| check_id | UUID | PRIMARY KEY | Unique check identifier | 880e8400-e29b-41d4-a716-446655440003 |
| url_id | UUID | FOREIGN KEY → suspicious_urls | URL being checked | 660e8400-e29b-41d4-a716-446655440001 |
| user_id | UUID | FOREIGN KEY → users, NULL | User who initiated (NULL for auto) | 550e8400-e29b-41d4-a716-446655440000 |
| check_source | ENUM | NOT NULL | How scan was triggered | web_form, browser_extension, api, scheduled |
| algorithm_score | DECIMAL(5,4) | CHECK (0 ≤ score ≤ 1) | Local algorithm score | 0.8500 (85%) |
| algorithm_result | ENUM | NULL | Algorithm classification | safe, suspicious, dangerous |
| safebrowsing_status | VARCHAR(50) | NULL | Google Safe Browsing result | threats_found, no_threats, error |
| feed_match_count | INT | DEFAULT 0 | Number of threat feed hits | 3 |
| aggregated_recommendation | ENUM | NULL | Final combined verdict | safe, suspicious, block |
| response_time_ms | INT | NULL | Total processing time | 245 (milliseconds) |
| checked_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Scan timestamp | 2024-10-31 16:30:15 |

**Indexes**:
- `idx_url_checks_url_time` on (url_id, checked_at DESC)
- `idx_url_checks_user` on (user_id, checked_at DESC)
- `idx_url_checks_recommendation` on (aggregated_recommendation)

**Business Rules**:
- One check record per scan operation
- aggregated_recommendation combines: algorithm + safebrowsing + feeds
- Trigger increments suspicious_urls.check_count

---

### Table: scan_results
**Purpose**: Granular component-level analysis from detection algorithm

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| result_id | UUID | PRIMARY KEY | Unique result identifier | 990e8400-e29b-41d4-a716-446655440004 |
| check_id | UUID | FOREIGN KEY → url_checks | Associated check operation | 880e8400-e29b-41d4-a716-446655440003 |
| component_type | VARCHAR(50) | NOT NULL | Which URL part analyzed | domain, subdomain, path, query, heuristic |
| component_value | TEXT | NULL | Actual value analyzed | login-vietinbank.com |
| similarity_score | DECIMAL(5,4) | CHECK (0 ≤ score ≤ 1) | Match score vs known phishing | 0.9200 (92% similar) |
| matched_pattern | TEXT | NULL | Pattern that matched | *-vietinbank.com |
| matched_phishing_id | UUID | FOREIGN KEY → known_phishing_urls | Which phishing entry matched | 770e8400-e29b-41d4-a716-446655440002 |
| heuristic_flags | JSONB | NULL | Triggered heuristic rules | ["keyword_login", "typosquatting"] |
| details | JSONB | NULL | Additional analysis data | {"levenshtein_distance": 2, "tokens": [...]} |

**Indexes**:
- `idx_scan_results_check` on (check_id)
- `idx_scan_results_component` on (component_type, similarity_score DESC)

**Business Rules**:
- Multiple results per check_id (one per component analyzed)
- similarity_score uses Levenshtein distance, token similarity, etc.
- heuristic_flags: JSON array of triggered rules

---

## Third-Party Integration

### Table: safebrowsing_cache
**Purpose**: Cache Google Safe Browsing API responses to reduce API costs

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| cache_id | UUID | PRIMARY KEY | Unique cache entry | aa0e8400-e29b-41d4-a716-446655440005 |
| url_hash | VARCHAR(64) | UNIQUE, NOT NULL | SHA-256 of normalized URL | e3b0c44298fc1c149afbf4c8996fb92427ae41e4... |
| threat_type | VARCHAR(100) | NULL | Threat classification | MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE |
| platform_type | VARCHAR(50) | NULL | Affected platforms | ANY_PLATFORM, WINDOWS, LINUX, ANDROID |
| threat_entry_type | VARCHAR(50) | NULL | Entry type | URL, EXECUTABLE |
| response_data | JSONB | NULL | Full API response | {"threats": [...], "clientState": "..."} |
| cached_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When cached | 2024-10-31 14:00:00 |
| expires_at | TIMESTAMP | NOT NULL | Cache expiration | 2024-11-01 14:00:00 (24 hours) |

**Indexes**:
- `idx_safebrowsing_url_hash` UNIQUE on (url_hash)
- `idx_safebrowsing_expires` on (expires_at)

**Business Rules**:
- TTL: 24-48 hours (configurable)
- Cleanup job deletes expired entries daily
- Cache miss triggers new API call

---

### Table: threat_feeds
**Purpose**: Registry of external threat intelligence sources

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| feed_id | UUID | PRIMARY KEY | Unique feed identifier | bb0e8400-e29b-41d4-a716-446655440006 |
| feed_name | VARCHAR(100) | NOT NULL | Feed display name | APWG, PhishTank, OpenPhish |
| feed_url | TEXT | NULL | Feed data source URL | https://data.phishtank.com/data.json |
| feed_type | VARCHAR(50) | NOT NULL | Feed category | blacklist, whitelist, mixed |
| update_frequency | INT | NULL | Update interval (hours) | 6, 12, 24 |
| last_updated | TIMESTAMP | NULL | Last successful sync | 2024-10-31 12:00:00 |
| status | ENUM | DEFAULT 'active' | Feed operational status | active, inactive, error |
| priority | INT | DEFAULT 50, CHECK (1-100) | Weight in decision making | 80 (higher = more trusted) |

**Indexes**:
- `idx_threat_feeds_status_priority` on (status, priority DESC)

**Business Rules**:
- Priority affects aggregated_recommendation calculation
- status='error' after 3 consecutive failed updates
- Automated sync job runs based on update_frequency

---

### Table: feed_items
**Purpose**: Individual threat entries from external feeds

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| item_id | UUID | PRIMARY KEY | Unique item identifier | cc0e8400-e29b-41d4-a716-446655440007 |
| feed_id | UUID | FOREIGN KEY → threat_feeds | Source feed | bb0e8400-e29b-41d4-a716-446655440006 |
| url_pattern | TEXT | NOT NULL | URL or pattern from feed | http://phishing-site.com/login |
| item_type | VARCHAR(50) | NULL | Threat type from feed | phishing, malware, spam |
| severity | VARCHAR(20) | NULL | Severity level | low, medium, high, critical |
| added_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When imported | 2024-10-31 12:05:00 |
| expires_at | TIMESTAMP | NULL | Expiration (if temporary) | 2024-11-07 12:05:00 |
| metadata | JSONB | NULL | Feed-specific extra data | {"confidence": 0.95, "country": "VN"} |

**Indexes**:
- `idx_feed_items_feed_added` on (feed_id, added_at DESC)
- `idx_feed_items_pattern` GIN on (to_tsvector('english', url_pattern))
- `idx_feed_items_expires` on (expires_at)

**Business Rules**:
- Bulk imported during feed sync
- Expired items auto-deleted by cleanup job
- Full-text search on url_pattern for fuzzy matching

---

### Table: feed_matches
**Purpose**: Track when a URL matches external threat feed entries

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| match_id | UUID | PRIMARY KEY | Unique match identifier | dd0e8400-e29b-41d4-a716-446655440008 |
| check_id | UUID | FOREIGN KEY → url_checks | Associated check | 880e8400-e29b-41d4-a716-446655440003 |
| feed_id | UUID | FOREIGN KEY → threat_feeds | Which feed matched | bb0e8400-e29b-41d4-a716-446655440006 |
| item_id | UUID | FOREIGN KEY → feed_items | Specific feed item | cc0e8400-e29b-41d4-a716-446655440007 |
| match_type | ENUM | NOT NULL | How it matched | exact, pattern, partial |
| match_confidence | DECIMAL(5,4) | CHECK (0 ≤ conf ≤ 1) | Confidence score | 0.9500 (95%) |
| matched_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Match timestamp | 2024-10-31 16:30:15 |

**Indexes**:
- `idx_feed_matches_check` on (check_id)
- `idx_feed_matches_feed` on (feed_id, match_type)

**Business Rules**:
- Multiple matches possible per check (different feeds)
- match_confidence weighted by feed.priority
- Used to calculate url_checks.feed_match_count

---

## Community Reporting

### Table: reports
**Purpose**: User-submitted phishing reports for community review

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| report_id | UUID | PRIMARY KEY | Unique report identifier | ee0e8400-e29b-41d4-a716-446655440009 |
| url_id | UUID | FOREIGN KEY → suspicious_urls | Reported URL | 660e8400-e29b-41d4-a716-446655440001 |
| reported_by | UUID | FOREIGN KEY → users | Reporting user | 550e8400-e29b-41d4-a716-446655440000 |
| report_reason | TEXT | NOT NULL | Why user suspects phishing | "Fake VietinBank login asking for OTP" |
| evidence_urls | JSONB | NULL | Screenshots/additional links | ["https://s3.aws.../screenshot.png"] |
| incident_description | TEXT | NULL | User's experience | "Received SMS with this link..." |
| status | ENUM | DEFAULT 'pending' | Review status | pending, under_review, confirmed, rejected, duplicate |
| assigned_to | UUID | FOREIGN KEY → users, NULL | Moderator assigned | (moderator user_id) |
| reviewed_by | UUID | FOREIGN KEY → users, NULL | Who made decision | (admin/moderator user_id) |
| reviewed_at | TIMESTAMP | NULL | Review timestamp | 2024-10-31 17:00:00 |
| review_notes | TEXT | NULL | Moderator's comments | "Confirmed - added to blacklist" |
| reported_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission time | 2024-10-31 16:45:00 |
| priority | ENUM | DEFAULT 'medium' | Urgency level | low, medium, high, urgent |

**Indexes**:
- `idx_reports_url` on (url_id)
- `idx_reports_reporter_time` on (reported_by, reported_at DESC)
- `idx_reports_status_priority` on (status, priority DESC, reported_at DESC)
- `idx_reports_assigned` on (assigned_to, status)

**Business Rules**:
- Auto-scan performed on submission (pre-validation)
- priority escalates based on: community votes, algorithm score, feed matches
- status='confirmed' triggers addition to known_phishing_urls

---

### Table: community_feedback
**Purpose**: Community votes and comments on reported URLs

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| feedback_id | UUID | PRIMARY KEY | Unique feedback entry | ff0e8400-e29b-41d4-a716-446655440010 |
| report_id | UUID | FOREIGN KEY → reports | Target report | ee0e8400-e29b-41d4-a716-446655440009 |
| user_id | UUID | FOREIGN KEY → users | User providing feedback | 550e8400-e29b-41d4-a716-446655440000 |
| feedback_type | ENUM | NOT NULL | Feedback category | vote_phishing, vote_safe, comment |
| comment_text | TEXT | NULL | Comment content (if type=comment) | "I also received this scam SMS!" |
| helpful_count | INT | DEFAULT 0 | "This was helpful" votes | 5 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Feedback timestamp | 2024-10-31 16:50:00 |

**Indexes**:
- `idx_feedback_report` on (report_id, feedback_type)
- `idx_feedback_user_time` on (user_id, created_at DESC)
- UNIQUE `unique_user_feedback` on (report_id, user_id, feedback_type)

**Business Rules**:
- One vote per user per report (enforced by unique constraint)
- helpful_count incremented by other users
- Moderators use vote counts to prioritize reviews

---

## Educational & Statistics

### Table: education_content
**Purpose**: Store phishing awareness educational materials

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| content_id | UUID | PRIMARY KEY | Unique content identifier | 110e8400-e29b-41d4-a716-446655440011 |
| title | VARCHAR(255) | NOT NULL | Content title | "Nhận biết email lừa đảo" |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier | nhan-biet-email-lua-dao |
| content_type | ENUM | NOT NULL | Content format | article, video, infographic, quiz, audio |
| content_body | TEXT | NULL | Main content (HTML/Markdown) | "<h2>Dấu hiệu nhận biết</h2>..." |
| media_url | TEXT | NULL | S3 URL for media files | https://s3.aws.com/education/video1.mp4 |
| language | VARCHAR(10) | DEFAULT 'vi' | Content language | vi, en |
| difficulty_level | ENUM | DEFAULT 'beginner' | Target audience | beginner, intermediate, advanced |
| view_count | INT | DEFAULT 0 | Number of views | 1523 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp | 2024-10-15 10:00:00 |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last edit timestamp | 2024-10-30 14:00:00 |
| is_published | BOOLEAN | DEFAULT FALSE | Publication status | true, false |

**Indexes**:
- `idx_education_slug` UNIQUE on (slug)
- `idx_education_type_lang` on (content_type, language)
- `idx_education_published` on (is_published, created_at DESC)

**Business Rules**:
- slug auto-generated from title (URL-safe)
- media_url points to S3 for CDN delivery
- updated_at auto-updated via trigger

---

### Table: quiz_attempts
**Purpose**: Track user quiz attempts for gamification and analytics

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| attempt_id | UUID | PRIMARY KEY | Unique attempt identifier | 220e8400-e29b-41d4-a716-446655440012 |
| user_id | UUID | FOREIGN KEY → users | User taking quiz | 550e8400-e29b-41d4-a716-446655440000 |
| content_id | UUID | FOREIGN KEY → education_content | Quiz taken | 110e8400-e29b-41d4-a716-446655440011 |
| score | INT | NOT NULL | Points earned | 8 |
| max_score | INT | NOT NULL | Total possible points | 10 |
| time_taken_seconds | INT | NULL | Completion time | 245 |
| answers | JSONB | NULL | User's answers (anonymized) | [{"q": 1, "a": "B", "correct": true}, ...] |
| completed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Completion timestamp | 2024-10-31 15:30:00 |

**Indexes**:
- `idx_quiz_user_time` on (user_id, completed_at DESC)
- `idx_quiz_content` on (content_id)

**Business Rules**:
- score/max_score ratio used for leaderboard
- answers stored for improvement analytics (not shown to user)
- Badges awarded for streaks, high scores

---

### Table: system_statistics
**Purpose**: Daily aggregated metrics for dashboard display

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| stat_id | UUID | PRIMARY KEY | Unique statistic entry | 330e8400-e29b-41d4-a716-446655440013 |
| stat_date | DATE | UNIQUE, NOT NULL | Statistics date | 2024-10-31 |
| total_scans | INT | DEFAULT 0 | Total URL checks | 1247 |
| safe_count | INT | DEFAULT 0 | URLs marked safe | 1050 |
| suspicious_count | INT | DEFAULT 0 | URLs marked suspicious | 174 |
| phishing_count | INT | DEFAULT 0 | Confirmed phishing | 23 |
| new_reports | INT | DEFAULT 0 | User reports submitted | 12 |
| active_users | INT | DEFAULT 0 | Unique daily users | 892 |
| extension_installs | INT | DEFAULT 0 | Total extension users | 5420 |
| avg_response_time_ms | INT | NULL | Avg scan response time | 52 |
| top_targeted_brands | JSONB | NULL | Most impersonated brands | [{"brand": "VietinBank", "count": 8}, ...] |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation | 2024-10-31 23:59:59 |

**Indexes**:
- `idx_statistics_date` UNIQUE on (stat_date DESC)

**Business Rules**:
- Generated by nightly aggregation job
- Powers dashboard graphs and metrics
- Retained for 2 years for trend analysis

---

## Browser Extension

### Table: extension_sessions
**Purpose**: Track browser extension usage sessions

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| session_id | UUID | PRIMARY KEY | Unique session identifier | 440e8400-e29b-41d4-a716-446655440014 |
| user_id | UUID | FOREIGN KEY → users, NULL | User (if logged in) | 550e8400-e29b-41d4-a716-446655440000 |
| extension_version | VARCHAR(20) | NOT NULL | Extension version | 1.2.3 |
| browser_type | VARCHAR(50) | NOT NULL | Browser name | Chrome, Firefox, Edge, Safari |
| install_date | TIMESTAMP | NULL | Extension install date | 2024-10-15 09:00:00 |
| session_start | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Session start time | 2024-10-31 14:00:00 |
| session_end | TIMESTAMP | NULL | Session end time | 2024-10-31 18:00:00 |
| urls_checked | INT | DEFAULT 0 | URLs scanned in session | 45 |
| threats_blocked | INT | DEFAULT 0 | Phishing sites blocked | 2 |

**Indexes**:
- `idx_extension_user` on (user_id)
- `idx_extension_start` on (session_start DESC)

**Business Rules**:
- session_end updated when browser closes / extension disabled
- Used for adoption metrics and user engagement analytics

---

### Table: extension_alerts
**Purpose**: Log alerts shown to users by browser extension

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| alert_id | UUID | PRIMARY KEY | Unique alert identifier | 550e8400-e29b-41d4-a716-446655440015 |
| session_id | UUID | FOREIGN KEY → extension_sessions | Associated session | 440e8400-e29b-41d4-a716-446655440014 |
| url_id | UUID | FOREIGN KEY → suspicious_urls | URL that triggered alert | 660e8400-e29b-41d4-a716-446655440001 |
| alert_type | ENUM | NOT NULL | Alert severity | warning, block, info |
| user_action | ENUM | NULL | What user did | proceeded, blocked, reported, dismissed |
| shown_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Alert display time | 2024-10-31 16:30:20 |
| dismissed_at | TIMESTAMP | NULL | When user dismissed | 2024-10-31 16:30:35 |

**Indexes**:
- `idx_alerts_session` on (session_id)
- `idx_alerts_url_type` on (url_id, alert_type)

**Business Rules**:
- alert_type='block' prevents page load
- alert_type='warning' shows dismissible banner
- user_action tracked for ML training (future)

---

## System Configuration

### Table: system_settings
**Purpose**: Configurable system parameters (key-value store)

| Column Name | Data Type | Constraints | Description | Example Value |
|------------|-----------|-------------|-------------|---------------|
| setting_id | UUID | PRIMARY KEY | Unique setting identifier | 660e8400-e29b-41d4-a716-446655440016 |
| setting_key | VARCHAR(100) | UNIQUE, NOT NULL | Setting name | max_daily_scans_per_user |
| setting_value | TEXT | NOT NULL | Setting value | 100 |
| value_type | ENUM | NOT NULL | Data type | string, integer, boolean, json |
| description | TEXT | NULL | Setting purpose | "Max URL scans per user per day" |
| updated_by | UUID | FOREIGN KEY → users, NULL | Admin who updated | (admin user_id) |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time | 2024-10-31 10:00:00 |

**Indexes**:
- `idx_settings_key` UNIQUE on (setting_key)

**Business Rules**:
- Application reads on startup, caches in memory
- Only admins can modify
- Audit log tracks all changes

---

## Enumerations Reference

### role (users table)
| Value | Description | Permissions |
|-------|-------------|-------------|
| community_user | Regular user | View, report, check URLs, provide feedback |
| moderator | Trusted reviewer | All community_user + review reports, manage queue |
| admin | System administrator | All moderator + user management, system config |

### status (users table, threat_feeds table)
| Value | Description |
|-------|-------------|
| active | Normal operational state |
| suspended | Temporarily disabled (users) / Temporarily paused (feeds) |
| pending | Awaiting verification (users only) |
| inactive | Disabled (users) / Not in use (feeds) |
| error | Feed experiencing sync errors |

### check_source (url_checks table)
| Value | Description |
|-------|-------------|
| web_form | Manual check via website form |
| browser_extension | Automatic check by extension |
| api | Programmatic API call |
| scheduled | Automated periodic re-scan |

### algorithm_result (url_checks table)
| Value | Description | Score Range |
|-------|-------------|-------------|
| safe | Low risk, no phishing indicators | 0.00 - 0.59 |
| suspicious | Moderate risk, some red flags | 0.60 - 0.79 |
| dangerous | High risk, strong phishing signals | 0.80 - 1.00 |

### aggregated_recommendation (url_checks table)
| Value | Description | Action |
|-------|-------------|--------|
| safe | All checks passed | Allow access |
| suspicious | Mixed signals | Show warning, allow override |
| block | Confirmed threat | Block access, show error |

### severity (known_phishing_urls, feed_items)
| Value | Description | Examples |
|-------|-------------|----------|
| low | Minor risk | Suspicious but unconfirmed |
| medium | Moderate threat | Confirmed phishing, limited impact |
| high | Serious threat | Active campaign, many victims |
| critical | Extreme danger | Malware, financial theft, widespread |

### report_status (reports table)
| Value | Description |
|-------|-------------|
| pending | Awaiting moderator review |
| under_review | Moderator is investigating |
| confirmed | Verified as phishing |
| rejected | Not phishing / False positive |
| duplicate | Already reported |

### priority (reports table)
| Value | Description | SLA |
|-------|-------------|-----|
| low | Non-urgent | Review within 7 days |
| medium | Standard priority | Review within 2 days |
| high | Important | Review within 24 hours |
| urgent | Critical threat | Review within 2 hours |

### feedback_type (community_feedback table)
| Value | Description |
|-------|-------------|
| vote_phishing | User agrees it's phishing |
| vote_safe | User thinks it's legitimate |
| comment | Written feedback/explanation |

### content_type (education_content table)
| Value | Description |
|-------|-------------|
| article | Written text content |
| video | Video tutorial |
| infographic | Visual diagram/poster |
| quiz | Interactive quiz |
| audio | Audio guide (for accessibility) |

### difficulty_level (education_content table)
| Value | Target Audience |
|-------|----------------|
| beginner | General public, elderly |
| intermediate | Tech-savvy users |
| advanced | IT professionals |

### alert_type (extension_alerts table)
| Value | Description | User Experience |
|-------|-------------|-----------------|
| warning | Yellow banner | Dismissible warning message |
| block | Red full-page | Page blocked, cannot proceed |
| info | Blue notification | Informational, non-critical |

### user_action (extension_alerts table)
| Value | Description |
|-------|-------------|
| proceeded | User clicked "Continue Anyway" |
| blocked | User accepted block, went back |
| reported | User reported site from alert |
| dismissed | User closed warning banner |

---

## Data Retention Policies

| Table | Retention Period | Cleanup Method |
|-------|------------------|----------------|
| user_activity_logs | 90 days | Monthly job |
| url_checks | 1 year | Quarterly archive to S3 |
| scan_results | 1 year | Cascade delete with url_checks |
| safebrowsing_cache | 24-48 hours | TTL auto-delete |
| feed_items | Variable (expires_at) | Daily cleanup job |
| reports (rejected) | 6 months | Quarterly cleanup |
| community_feedback | Permanent | N/A |
| quiz_attempts | Permanent | N/A |
| extension_sessions | 90 days | Monthly job |
| DynamoDB RealTimeScans | 7 days | TTL auto-delete |

---

## Compliance Notes

- **GDPR Compliance**: user.email and phone_number encrypted at rest
- **Right to Deletion**: Cascade DELETE on users table removes all PII
- **Data Portability**: Export functions provided for user data
- **Audit Trail**: user_activity_logs tracks all sensitive operations
- **Anonymization**: Quiz answers do not link to specific users publicly

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-10-31 | Initial database design |

---

**End of Data Dictionary**
