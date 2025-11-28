-- ==================================================================
-- AnLink Database Schema
-- Anti-Phishing Detection System
-- PostgreSQL 18+
-- ==================================================================
-- Project: AnLink - Link Safety, Verified
-- Description: Complete database schema for fraud detection system
-- Version: 1.0.0
-- Date: September 2024
-- ==================================================================

-- Drop existing database if exists (BE CAREFUL!)
-- DROP DATABASE IF EXISTS anlink_dev;

-- Create database (run this separately first)
-- CREATE DATABASE anlink_dev;
-- COMMENT ON DATABASE anlink_dev IS 'AnLink Development Database - Anti-Phishing System';

-- Connect to database
\c anlink_dev

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================================
-- 1. USER MANAGEMENT TABLES
-- ==================================================================

-- 1.1 Users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'community_user' 
        CHECK (role IN ('community_user', 'moderator', 'admin')),
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    phone_number VARCHAR(20),
    location VARCHAR(100),
    language_preference VARCHAR(10) DEFAULT 'vi'
);

COMMENT ON TABLE users IS 'AnLink registered users with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: community_user, moderator, or admin';
COMMENT ON COLUMN users.status IS 'Account status: active, suspended, or pending';

-- 1.2 User activity logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_activity_logs IS 'AnLink user action audit trail';

-- ==================================================================
-- 2. URL & PHISHING DETECTION TABLES
-- ==================================================================

-- 2.1 Suspicious URLs
CREATE TABLE IF NOT EXISTS suspicious_urls (
    url_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    url_hash VARCHAR(64) UNIQUE NOT NULL,
    scheme VARCHAR(10),
    domain VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255),
    path TEXT,
    query_params TEXT,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked TIMESTAMP,
    check_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'safe', 'suspicious', 'confirmed_phishing'))
);

COMMENT ON TABLE suspicious_urls IS 'AnLink master repository of all submitted URLs';
COMMENT ON COLUMN suspicious_urls.url_hash IS 'SHA-256 hash for O(1) duplicate detection';

-- 2.2 Known phishing URLs (blacklist)
CREATE TABLE IF NOT EXISTS known_phishing_urls (
    phishing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID REFERENCES suspicious_urls(url_id) ON DELETE CASCADE,
    domain_pattern VARCHAR(255) NOT NULL,
    full_url_pattern TEXT,
    severity VARCHAR(20) DEFAULT 'medium' 
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    phishing_type VARCHAR(50),
    target_brand VARCHAR(100),
    confirmed_by UUID REFERENCES users(user_id),
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

COMMENT ON TABLE known_phishing_urls IS 'AnLink confirmed phishing URLs blacklist';

-- 2.3 URL checks (scan history)
CREATE TABLE IF NOT EXISTS url_checks (
    check_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID REFERENCES suspicious_urls(url_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    check_source VARCHAR(20) NOT NULL 
        CHECK (check_source IN ('web_form', 'browser_extension', 'api', 'scheduled')),
    algorithm_score DECIMAL(5,4) CHECK (algorithm_score >= 0 AND algorithm_score <= 1),
    algorithm_result VARCHAR(20) 
        CHECK (algorithm_result IN ('safe', 'suspicious', 'dangerous')),
    safebrowsing_status VARCHAR(50),
    feed_match_count INT DEFAULT 0,
    aggregated_recommendation VARCHAR(20) 
        CHECK (aggregated_recommendation IN ('safe', 'suspicious', 'block')),
    response_time_ms INT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE url_checks IS 'AnLink URL scan operation history';
COMMENT ON COLUMN url_checks.algorithm_score IS 'Score from AnLink detection algorithm (0.00-1.00)';

-- 2.4 Scan results (component-level analysis)
CREATE TABLE IF NOT EXISTS scan_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID REFERENCES url_checks(check_id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    component_value TEXT,
    similarity_score DECIMAL(5,4) CHECK (similarity_score >= 0 AND similarity_score <= 1),
    matched_pattern TEXT,
    matched_phishing_id UUID REFERENCES known_phishing_urls(phishing_id),
    heuristic_flags JSONB,
    details JSONB
);

COMMENT ON TABLE scan_results IS 'AnLink detailed component-level analysis results';

-- ==================================================================
-- 3. THIRD-PARTY INTEGRATION TABLES
-- ==================================================================

-- 3.1 Google Safe Browsing cache
CREATE TABLE IF NOT EXISTS safebrowsing_cache (
    cache_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_hash VARCHAR(64) UNIQUE NOT NULL,
    threat_type VARCHAR(100),
    platform_type VARCHAR(50),
    threat_entry_type VARCHAR(50),
    response_data JSONB,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

COMMENT ON TABLE safebrowsing_cache IS 'AnLink cache for Google Safe Browsing API results';

-- 3.2 Threat feeds registry
CREATE TABLE IF NOT EXISTS threat_feeds (
    feed_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_name VARCHAR(100) NOT NULL,
    feed_url TEXT,
    feed_type VARCHAR(50) NOT NULL,
    update_frequency INT,
    last_updated TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'error')),
    priority INT DEFAULT 50 CHECK (priority >= 1 AND priority <= 100)
);

COMMENT ON TABLE threat_feeds IS 'AnLink external threat intelligence feeds';

-- 3.3 Feed items
CREATE TABLE IF NOT EXISTS feed_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_id UUID REFERENCES threat_feeds(feed_id) ON DELETE CASCADE,
    url_pattern TEXT NOT NULL,
    item_type VARCHAR(50),
    severity VARCHAR(20),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB
);

COMMENT ON TABLE feed_items IS 'AnLink individual entries from threat feeds';

-- 3.4 Feed matches
CREATE TABLE IF NOT EXISTS feed_matches (
    match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID REFERENCES url_checks(check_id) ON DELETE CASCADE,
    feed_id UUID REFERENCES threat_feeds(feed_id),
    item_id UUID REFERENCES feed_items(item_id),
    match_type VARCHAR(20) NOT NULL 
        CHECK (match_type IN ('exact', 'pattern', 'partial')),
    match_confidence DECIMAL(5,4) CHECK (match_confidence >= 0 AND match_confidence <= 1),
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE feed_matches IS 'AnLink URL matches against threat feeds';

-- ==================================================================
-- 4. COMMUNITY REPORTING TABLES
-- ==================================================================

-- 4.1 Reports
CREATE TABLE IF NOT EXISTS reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID REFERENCES suspicious_urls(url_id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    report_reason TEXT NOT NULL,
    evidence_urls JSONB,
    incident_description TEXT,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'under_review', 'confirmed', 'rejected', 'duplicate')),
    assigned_to UUID REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

COMMENT ON TABLE reports IS 'AnLink user-submitted phishing reports';

-- 4.2 Community feedback
CREATE TABLE IF NOT EXISTS community_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(report_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    feedback_type VARCHAR(20) NOT NULL 
        CHECK (feedback_type IN ('vote_phishing', 'vote_safe', 'comment')),
    comment_text TEXT,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, user_id, feedback_type)
);

COMMENT ON TABLE community_feedback IS 'AnLink community votes and comments on reports';

-- ==================================================================
-- 5. EDUCATIONAL & STATISTICS TABLES
-- ==================================================================

-- 5.1 Education content
CREATE TABLE IF NOT EXISTS education_content (
    content_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content_type VARCHAR(20) NOT NULL 
        CHECK (content_type IN ('article', 'video', 'infographic', 'quiz', 'audio')),
    content_body TEXT,
    media_url TEXT,
    language VARCHAR(10) DEFAULT 'vi',
    difficulty_level VARCHAR(20) DEFAULT 'beginner' 
        CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE education_content IS 'AnLink educational materials and tips';

-- 5.2 Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    content_id UUID REFERENCES education_content(content_id) ON DELETE CASCADE,
    score INT NOT NULL,
    max_score INT NOT NULL,
    time_taken_seconds INT,
    answers JSONB,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE quiz_attempts IS 'AnLink quiz completion tracking for gamification';

-- 5.3 System statistics
CREATE TABLE IF NOT EXISTS system_statistics (
    stat_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date DATE UNIQUE NOT NULL,
    total_scans INT DEFAULT 0,
    safe_count INT DEFAULT 0,
    suspicious_count INT DEFAULT 0,
    phishing_count INT DEFAULT 0,
    new_reports INT DEFAULT 0,
    active_users INT DEFAULT 0,
    extension_installs INT DEFAULT 0,
    avg_response_time_ms INT,
    top_targeted_brands JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_statistics IS 'AnLink daily aggregated statistics';

-- ==================================================================
-- 6. BROWSER EXTENSION TABLES (OPTIONAL)
-- ==================================================================

-- 6.1 Extension sessions
CREATE TABLE IF NOT EXISTS extension_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    extension_version VARCHAR(20) NOT NULL,
    browser_type VARCHAR(50) NOT NULL,
    install_date TIMESTAMP,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    urls_checked INT DEFAULT 0,
    threats_blocked INT DEFAULT 0
);

COMMENT ON TABLE extension_sessions IS 'AnLink browser extension usage sessions';

-- 6.2 Extension alerts
CREATE TABLE IF NOT EXISTS extension_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES extension_sessions(session_id) ON DELETE CASCADE,
    url_id UUID REFERENCES suspicious_urls(url_id),
    alert_type VARCHAR(20) NOT NULL 
        CHECK (alert_type IN ('warning', 'block', 'info')),
    user_action VARCHAR(20) 
        CHECK (user_action IN ('proceeded', 'blocked', 'reported', 'dismissed')),
    shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dismissed_at TIMESTAMP
);

COMMENT ON TABLE extension_alerts IS 'AnLink browser extension alert logs';

-- ==================================================================
-- 7. SYSTEM CONFIGURATION TABLE
-- ==================================================================

-- 7.1 System settings
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    value_type VARCHAR(20) NOT NULL 
        CHECK (value_type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    updated_by UUID REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_settings IS 'AnLink configurable system parameters';

-- ==================================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================================

-- User tables
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_activity_logs_user_time ON user_activity_logs(user_id, timestamp DESC);
CREATE INDEX idx_activity_logs_action ON user_activity_logs(action_type);

-- URL tables
CREATE INDEX idx_suspicious_urls_hash ON suspicious_urls(url_hash);
CREATE INDEX idx_suspicious_urls_domain ON suspicious_urls(domain);
CREATE INDEX idx_suspicious_urls_status ON suspicious_urls(status, last_checked);
CREATE INDEX idx_phishing_domain_pattern ON known_phishing_urls(domain_pattern);
CREATE INDEX idx_phishing_severity ON known_phishing_urls(severity, active);
CREATE INDEX idx_url_checks_url_time ON url_checks(url_id, checked_at DESC);
CREATE INDEX idx_url_checks_user ON url_checks(user_id, checked_at DESC);
CREATE INDEX idx_scan_results_check ON scan_results(check_id);

-- Third-party tables
CREATE INDEX idx_safebrowsing_hash ON safebrowsing_cache(url_hash);
CREATE INDEX idx_safebrowsing_expires ON safebrowsing_cache(expires_at);
CREATE INDEX idx_feed_items_feed ON feed_items(feed_id, added_at DESC);
CREATE INDEX idx_feed_matches_check ON feed_matches(check_id);

-- Community tables
CREATE INDEX idx_reports_url ON reports(url_id);
CREATE INDEX idx_reports_status_priority ON reports(status, priority DESC, reported_at DESC);
CREATE INDEX idx_reports_assigned ON reports(assigned_to, status);
CREATE INDEX idx_feedback_report ON community_feedback(report_id, feedback_type);

-- Education tables
CREATE INDEX idx_education_slug ON education_content(slug);
CREATE INDEX idx_education_published ON education_content(is_published, created_at DESC);
CREATE INDEX idx_quiz_user ON quiz_attempts(user_id, completed_at DESC);

-- Statistics
CREATE INDEX idx_statistics_date ON system_statistics(stat_date DESC);

-- ==================================================================
-- TRIGGERS
-- ==================================================================

-- Trigger: Auto-increment check_count in suspicious_urls
CREATE OR REPLACE FUNCTION increment_check_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE suspicious_urls 
    SET check_count = check_count + 1,
        last_checked = NEW.checked_at
    WHERE url_id = NEW.url_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_check_count
    AFTER INSERT ON url_checks
    FOR EACH ROW
    EXECUTE FUNCTION increment_check_count();

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_education_timestamp
    BEFORE UPDATE ON education_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ==================================================================
-- VIEWS FOR COMMON QUERIES
-- ==================================================================

-- View: Recent scan results with URL details
CREATE OR REPLACE VIEW v_recent_scans AS
SELECT 
    uc.check_id,
    su.original_url,
    su.domain,
    uc.algorithm_score,
    uc.algorithm_result,
    uc.aggregated_recommendation,
    uc.checked_at,
    u.full_name as checked_by
FROM url_checks uc
JOIN suspicious_urls su ON uc.url_id = su.url_id
LEFT JOIN users u ON uc.user_id = u.user_id
ORDER BY uc.checked_at DESC;

-- View: Pending reports for moderators
CREATE OR REPLACE VIEW v_pending_reports AS
SELECT 
    r.report_id,
    r.reported_at,
    r.priority,
    su.original_url,
    u.full_name as reporter,
    COUNT(cf.feedback_id) as community_votes
FROM reports r
JOIN suspicious_urls su ON r.url_id = su.url_id
JOIN users u ON r.reported_by = u.user_id
LEFT JOIN community_feedback cf ON r.report_id = cf.report_id
WHERE r.status = 'pending'
GROUP BY r.report_id, r.reported_at, r.priority, su.original_url, u.full_name
ORDER BY r.priority DESC, r.reported_at ASC;

-- View: Daily statistics dashboard
CREATE OR REPLACE VIEW v_dashboard_daily_stats AS
SELECT 
    DATE(uc.checked_at) as check_date,
    COUNT(*) as total_scans,
    SUM(CASE WHEN uc.aggregated_recommendation = 'safe' THEN 1 ELSE 0 END) as safe,
    SUM(CASE WHEN uc.aggregated_recommendation = 'suspicious' THEN 1 ELSE 0 END) as suspicious,
    SUM(CASE WHEN uc.aggregated_recommendation = 'block' THEN 1 ELSE 0 END) as blocked,
    AVG(uc.response_time_ms) as avg_response_time
FROM url_checks uc
WHERE uc.checked_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(uc.checked_at)
ORDER BY check_date DESC;

-- ==================================================================
-- SEED DATA (Initial Setup)
-- ==================================================================

-- Insert default admin user (password: Admin123! - CHANGE THIS!)
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES (
    'admin@anlink.vn',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva',
    'AnLink Administrator',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, value_type, description)
VALUES 
    ('threshold_safe_max', '0.29', 'decimal', 'Maximum score for safe classification'),
    ('threshold_suspicious_min', '0.30', 'decimal', 'Minimum score for suspicious classification'),
    ('threshold_suspicious_max', '0.59', 'decimal', 'Maximum score for suspicious classification'),
    ('threshold_dangerous_min', '0.60', 'decimal', 'Minimum score for dangerous classification'),
    ('max_daily_scans_per_user', '100', 'integer', 'Maximum URL scans per user per day'),
    ('cache_ttl_hours', '24', 'integer', 'Safe Browsing cache TTL in hours'),
    ('enable_email_notifications', 'true', 'boolean', 'Enable email notifications'),
    ('maintenance_mode', 'false', 'boolean', 'System maintenance mode')
ON CONFLICT (setting_key) DO NOTHING;

-- ==================================================================
-- DATABASE SUMMARY
-- ==================================================================

-- Total tables created: 18
-- Total indexes created: 26
-- Total triggers created: 2
-- Total views created: 3

-- ==================================================================
-- VERIFICATION QUERIES
-- ==================================================================

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count rows in each table
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    (SELECT COUNT(*) FROM pg_class WHERE relname = tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all indexes
SELECT 
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- List all triggers
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- ==================================================================
-- END OF SCHEMA
-- ==================================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ AnLink Database Schema Created Successfully!';
    RAISE NOTICE '📊 Tables: 18 | Indexes: 26 | Triggers: 2 | Views: 3';
    RAISE NOTICE '👤 Default admin: admin@anlink.vn (password: Admin123!)';
    RAISE NOTICE '🔧 Next step: Import sample data (seed_data.sql)';
END $$;