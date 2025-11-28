-- ==================================================================
-- AnLink Seed Data
-- Sample Data for Development & Testing
-- ==================================================================
-- Project: AnLink - Link Safety, Verified
-- Description: Initial sample data for development
-- Version: 1.0.0
-- ==================================================================

\c anlink_dev

-- ==================================================================
-- 1. SAMPLE USERS (3 roles)
-- ==================================================================

-- Community Users (password: User123!)
INSERT INTO users (email, password_hash, full_name, role, status, location, language_preference)
VALUES 
    ('user1@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva', 'Nguyen Van An', 'community_user', 'active', 'Hanoi, Vietnam', 'vi'),
    ('user2@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva', 'Tran Thi Binh', 'community_user', 'active', 'Ho Chi Minh, Vietnam', 'vi'),
    ('user3@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva', 'Le Minh Chau', 'community_user', 'active', 'Da Nang, Vietnam', 'vi'),
    ('user4@yahoo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva', 'Pham Thu Ha', 'community_user', 'active', 'Hanoi, Vietnam', 'vi'),
    ('user5@outlook.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva', 'Hoang Van Dung', 'community_user', 'active', 'Can Tho, Vietnam', 'vi')
ON CONFLICT (email) DO NOTHING;

-- Moderator (password: Mod123!)
INSERT INTO users (email, password_hash, full_name, role, status, location, language_preference)
VALUES 
    ('moderator@anlink.vn', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva', 'AnLink Moderator', 'moderator', 'active', 'Hanoi, Vietnam', 'vi'),
    ('mod2@anlink.vn', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyZlHQvYva', 'Do Thi Mai', 'moderator', 'active', 'Ho Chi Minh, Vietnam', 'vi')
ON CONFLICT (email) DO NOTHING;

-- ==================================================================
-- 2. LEGITIMATE BRAND DOMAINS (for comparison)
-- ==================================================================

-- Insert legitimate URLs as "safe" baseline
INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, scheme, domain, subdomain, path, status)
VALUES 
    ('https://www.vietinbank.vn', 'https://www.vietinbank.vn', 'hash_vietinbank', 'https', 'vietinbank.vn', 'www', '/', 'safe'),
    ('https://www.techcombank.com.vn', 'https://www.techcombank.com.vn', 'hash_techcombank', 'https', 'techcombank.com.vn', 'www', '/', 'safe'),
    ('https://www.paypal.com', 'https://www.paypal.com', 'hash_paypal', 'https', 'paypal.com', 'www', '/', 'safe'),
    ('https://www.facebook.com', 'https://www.facebook.com', 'hash_facebook', 'https', 'facebook.com', 'www', '/', 'safe'),
    ('https://www.google.com', 'https://www.google.com', 'hash_google', 'https', 'google.com', 'www', '/', 'safe'),
    ('https://www.amazon.com', 'https://www.amazon.com', 'hash_amazon', 'https', 'amazon.com', 'www', '/', 'safe'),
    ('https://www.microsoft.com', 'https://www.microsoft.com', 'hash_microsoft', 'https', 'microsoft.com', 'www', '/', 'safe'),
    ('https://www.apple.com', 'https://www.apple.com', 'hash_apple', 'https', 'apple.com', 'www', '/', 'safe'),
    ('https://www.netflix.com', 'https://www.netflix.com', 'hash_netflix', 'https', 'netflix.com', 'www', '/', 'safe'),
    ('https://www.visa.com', 'https://www.visa.com', 'hash_visa', 'https', 'visa.com', 'www', '/', 'safe')
ON CONFLICT (url_hash) DO NOTHING;

-- ==================================================================
-- 3. SAMPLE PHISHING URLs (for testing)
-- ==================================================================

-- Phishing URLs (typosquatting, suspicious subdomains, etc.)
INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, scheme, domain, subdomain, path, query_params, status)
VALUES 
    -- VietinBank phishing attempts
    ('http://secure-vietinbank-login.tk/verify', 'http://secure-vietinbank-login.tk/verify', 'phish_hash_001', 'http', 'tk', 'secure-vietinbank-login', '/verify', NULL, 'confirmed_phishing'),
    ('https://vietinbank-secure.com/account/verify', 'https://vietinbank-secure.com/account/verify', 'phish_hash_002', 'https', 'vietinbank-secure.com', '', '/account/verify', NULL, 'confirmed_phishing'),
    ('http://login.vietinbank-online.com/update', 'http://login.vietinbank-online.com/update', 'phish_hash_003', 'http', 'vietinbank-online.com', 'login', '/update', 'id=12345', 'suspicious'),
    
    -- PayPal typosquatting
    ('https://paypa1.com/signin', 'https://paypa1.com/signin', 'phish_hash_004', 'https', 'paypa1.com', '', '/signin', NULL, 'confirmed_phishing'),
    ('https://paypal-secure.tk/verify', 'https://paypal-secure.tk/verify', 'phish_hash_005', 'https', 'tk', 'paypal-secure', '/verify', NULL, 'confirmed_phishing'),
    ('http://secure.paypal-login.com', 'http://secure.paypal-login.com', 'phish_hash_006', 'http', 'paypal-login.com', 'secure', '/', NULL, 'suspicious'),
    
    -- Facebook phishing
    ('http://faceb00k.com/login', 'http://faceb00k.com/login', 'phish_hash_007', 'http', 'faceb00k.com', '', '/login', NULL, 'confirmed_phishing'),
    ('https://login-facebook.com/secure', 'https://login-facebook.com/secure', 'phish_hash_008', 'https', 'login-facebook.com', '', '/secure', NULL, 'suspicious'),
    
    -- Generic banking scams
    ('http://192.168.1.100/bank/login', 'http://192.168.1.100/bank/login', 'phish_hash_009', 'http', '192.168.1.100', '', '/bank/login', NULL, 'suspicious'),
    ('https://secure-banking-update.ml', 'https://secure-banking-update.ml', 'phish_hash_010', 'https', 'ml', 'secure-banking-update', '/', NULL, 'confirmed_phishing'),
    
    -- Cryptocurrency scams
    ('http://free-bitcoin.tk/claim', 'http://free-bitcoin.tk/claim', 'phish_hash_011', 'http', 'tk', 'free-bitcoin', '/claim', 'ref=123', 'confirmed_phishing'),
    ('https://binance-airdrop.com/verify', 'https://binance-airdrop.com/verify', 'phish_hash_012', 'https', 'binance-airdrop.com', '', '/verify', NULL, 'suspicious')
ON CONFLICT (url_hash) DO NOTHING;

-- ==================================================================
-- 4. KNOWN PHISHING PATTERNS (blacklist)
-- ==================================================================

-- Get admin user_id for confirmed_by
DO $$
DECLARE
    admin_id UUID;
    vietinbank_url_id UUID;
    paypal_url_id UUID;
    facebook_url_id UUID;
BEGIN
    SELECT user_id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- Get URL IDs for phishing entries
    SELECT url_id INTO vietinbank_url_id FROM suspicious_urls WHERE url_hash = 'phish_hash_001';
    SELECT url_id INTO paypal_url_id FROM suspicious_urls WHERE url_hash = 'phish_hash_004';
    SELECT url_id INTO facebook_url_id FROM suspicious_urls WHERE url_hash = 'phish_hash_007';
    
    -- Insert phishing patterns
    INSERT INTO known_phishing_urls (url_id, domain_pattern, severity, phishing_type, target_brand, confirmed_by, active, notes)
    VALUES 
        (vietinbank_url_id, '*vietinbank*', 'high', 'credential_theft', 'VietinBank', admin_id, TRUE, 'Fake VietinBank login page'),
        (paypal_url_id, 'paypa1.com', 'high', 'credential_theft', 'PayPal', admin_id, TRUE, 'Typosquatting - l replaced with 1'),
        (facebook_url_id, 'faceb00k.com', 'medium', 'credential_theft', 'Facebook', admin_id, TRUE, 'Homoglyph attack - oo replaced with 00'),
        (NULL, '*.tk', 'medium', 'generic_scam', NULL, admin_id, TRUE, 'Free domain often used for phishing'),
        (NULL, '*.ml', 'medium', 'generic_scam', NULL, admin_id, TRUE, 'Free domain often used for phishing'),
        (NULL, '*secure*login*', 'low', 'suspicious_pattern', NULL, admin_id, TRUE, 'Suspicious keyword combination')
    ON CONFLICT DO NOTHING;
END $$;

-- ==================================================================
-- 5. SAMPLE URL CHECKS (scan history)
-- ==================================================================

-- Simulate some URL checks
DO $$
DECLARE
    user1_id UUID;
    user2_id UUID;
    phish_url_id UUID;
    safe_url_id UUID;
BEGIN
    SELECT user_id INTO user1_id FROM users WHERE email = 'user1@gmail.com';
    SELECT user_id INTO user2_id FROM users WHERE email = 'user2@gmail.com';
    SELECT url_id INTO phish_url_id FROM suspicious_urls WHERE url_hash = 'phish_hash_001' LIMIT 1;
    SELECT url_id INTO safe_url_id FROM suspicious_urls WHERE url_hash = 'hash_vietinbank' LIMIT 1;
    
    -- Safe URL check
    INSERT INTO url_checks (url_id, user_id, check_source, algorithm_score, algorithm_result, aggregated_recommendation, response_time_ms)
    VALUES 
        (safe_url_id, user1_id, 'web_form', 0.05, 'safe', 'safe', 45),
        (safe_url_id, user2_id, 'web_form', 0.03, 'safe', 'safe', 38);
    
    -- Phishing URL check
    INSERT INTO url_checks (url_id, user_id, check_source, algorithm_score, algorithm_result, safebrowsing_status, aggregated_recommendation, response_time_ms)
    VALUES 
        (phish_url_id, user1_id, 'web_form', 0.92, 'dangerous', 'threats_found', 'block', 67),
        (phish_url_id, user2_id, 'browser_extension', 0.89, 'dangerous', 'threats_found', 'block', 52);
END $$;

-- ==================================================================
-- 6. SAMPLE REPORTS
-- ==================================================================

DO $$
DECLARE
    user1_id UUID;
    user3_id UUID;
    phish_url_id UUID;
    mod_id UUID;
BEGIN
    SELECT user_id INTO user1_id FROM users WHERE email = 'user1@gmail.com';
    SELECT user_id INTO user3_id FROM users WHERE email = 'user3@gmail.com';
    SELECT user_id INTO mod_id FROM users WHERE role = 'moderator' LIMIT 1;
    SELECT url_id INTO phish_url_id FROM suspicious_urls WHERE url_hash = 'phish_hash_003' LIMIT 1;
    
    -- User report
    INSERT INTO reports (url_id, reported_by, report_reason, incident_description, status, priority)
    VALUES 
        (phish_url_id, user1_id, 'Fake VietinBank page asking for OTP', 'Received SMS with this link claiming my account was locked. Looks very suspicious!', 'pending', 'high'),
        (phish_url_id, user3_id, 'Phishing website', 'This site is trying to steal banking credentials', 'under_review', 'high');
    
    -- Assign to moderator
    UPDATE reports SET assigned_to = mod_id WHERE status = 'under_review';
END $$;

-- ==================================================================
-- 7. SAMPLE COMMUNITY FEEDBACK
-- ==================================================================

DO $$
DECLARE
    report1_id UUID;
    user2_id UUID;
    user4_id UUID;
BEGIN
    SELECT report_id INTO report1_id FROM reports LIMIT 1;
    SELECT user_id INTO user2_id FROM users WHERE email = 'user2@gmail.com';
    SELECT user_id INTO user4_id FROM users WHERE email = 'user4@yahoo.com';
    
    -- Vote and comment
    INSERT INTO community_feedback (report_id, user_id, feedback_type, comment_text, helpful_count)
    VALUES 
        (report1_id, user2_id, 'vote_phishing', NULL, 0),
        (report1_id, user4_id, 'comment', 'I also received this scam SMS! Definitely phishing.', 3)
    ON CONFLICT DO NOTHING;
END $$;

-- ==================================================================
-- 8. THREAT FEEDS (External sources)
-- ==================================================================

INSERT INTO threat_feeds (feed_name, feed_url, feed_type, update_frequency, status, priority)
VALUES 
    ('APWG', 'https://apwg.org/feed', 'blacklist', 24, 'active', 90),
    ('PhishTank', 'https://data.phishtank.com/data.json', 'blacklist', 6, 'active', 85),
    ('OpenPhish', 'https://openphish.com/feed.txt', 'blacklist', 12, 'active', 80),
    ('Google Safe Browsing', 'https://safebrowsing.google.com', 'mixed', 1, 'active', 95)
ON CONFLICT DO NOTHING;

-- ==================================================================
-- 9. EDUCATION CONTENT
-- ==================================================================

INSERT INTO education_content (title, slug, content_type, content_body, language, difficulty_level, is_published)
VALUES 
    (
        'Nhận biết email lừa đảo',
        'nhan-biet-email-lua-dao',
        'article',
        '# Làm thế nào để nhận biết email lừa đảo?

## Dấu hiệu cảnh báo:
1. **Địa chỉ email lạ** - Kiểm tra kỹ địa chỉ người gửi
2. **Yêu cầu cấp bách** - "Tài khoản sẽ bị khóa ngay!"
3. **Lỗi chính tả** - Email chuyên nghiệp không có lỗi
4. **Link đáng ngờ** - Di chuột qua link để xem URL thật

## Cách bảo vệ:
- Không click vào link lạ
- Kiểm tra URL trên AnLink trước
- Liên hệ ngân hàng qua số hotline chính thức
- Không cung cấp mật khẩu qua email',
        'vi',
        'beginner',
        TRUE
    ),
    (
        'What is Phishing?',
        'what-is-phishing',
        'article',
        '# What is Phishing?

Phishing is a type of cyber attack where attackers impersonate legitimate organizations to steal sensitive information.

## Common Types:
- Email phishing
- SMS phishing (Smishing)
- Voice phishing (Vishing)
- Website cloning

## How to Stay Safe:
1. Check URLs with AnLink
2. Enable two-factor authentication
3. Keep software updated
4. Be skeptical of urgent requests',
        'en',
        'beginner',
        TRUE
    )
ON CONFLICT (slug) DO NOTHING;

-- ==================================================================
-- 10. SYSTEM STATISTICS (sample daily stats)
-- ==================================================================

INSERT INTO system_statistics (stat_date, total_scans, safe_count, suspicious_count, phishing_count, new_reports, active_users, avg_response_time_ms)
VALUES 
    (CURRENT_DATE - INTERVAL '7 days', 1247, 1050, 174, 23, 12, 892, 52),
    (CURRENT_DATE - INTERVAL '6 days', 1389, 1180, 186, 23, 15, 945, 48),
    (CURRENT_DATE - INTERVAL '5 days', 1156, 980, 152, 24, 10, 834, 55),
    (CURRENT_DATE - INTERVAL '4 days', 1523, 1290, 201, 32, 18, 1023, 50),
    (CURRENT_DATE - INTERVAL '3 days', 1678, 1420, 221, 37, 22, 1156, 47),
    (CURRENT_DATE - INTERVAL '2 days', 1445, 1220, 195, 30, 14, 987, 51),
    (CURRENT_DATE - INTERVAL '1 day', 1334, 1130, 179, 25, 11, 901, 49)
ON CONFLICT (stat_date) DO NOTHING;

-- ==================================================================
-- VERIFICATION
-- ==================================================================

-- Count records in each table
DO $$
BEGIN
    RAISE NOTICE '=== AnLink Seed Data Summary ===';
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Suspicious URLs: %', (SELECT COUNT(*) FROM suspicious_urls);
    RAISE NOTICE 'Known Phishing: %', (SELECT COUNT(*) FROM known_phishing_urls);
    RAISE NOTICE 'URL Checks: %', (SELECT COUNT(*) FROM url_checks);
    RAISE NOTICE 'Reports: %', (SELECT COUNT(*) FROM reports);
    RAISE NOTICE 'Community Feedback: %', (SELECT COUNT(*) FROM community_feedback);
    RAISE NOTICE 'Threat Feeds: %', (SELECT COUNT(*) FROM threat_feeds);
    RAISE NOTICE 'Education Content: %', (SELECT COUNT(*) FROM education_content);
    RAISE NOTICE 'System Statistics: %', (SELECT COUNT(*) FROM system_statistics);
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ Seed data imported successfully!';
END $$;

-- ==================================================================
-- DEFAULT CREDENTIALS REMINDER
-- ==================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 DEFAULT LOGIN CREDENTIALS:';
    RAISE NOTICE '───────────────────────────────';
    RAISE NOTICE 'Admin:';
    RAISE NOTICE '  Email: admin@anlink.vn';
    RAISE NOTICE '  Password: Admin123!';
    RAISE NOTICE '';
    RAISE NOTICE 'Moderator:';
    RAISE NOTICE '  Email: moderator@anlink.vn';
    RAISE NOTICE '  Password: Mod123!';
    RAISE NOTICE '';
    RAISE NOTICE 'User:';
    RAISE NOTICE '  Email: user1@gmail.com';
    RAISE NOTICE '  Password: User123!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Change these passwords in production!';
END $$;
