-- Enable pgcrypto extension for digest function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed some education content
INSERT INTO education_content (title, slug, content_type, content_body, language, difficulty_level, is_published)
VALUES 
(
  'Cách nhận biết email lừa đảo',
  'nhan-biet-email-lua-dao',
  'article',
  '<h2>Dấu hiệu nhận biết email lừa đảo</h2><p>1. Kiểm tra địa chỉ email người gửi</p><p>2. Xem xét nội dung email có yêu cầu khẩn cấp không</p><p>3. Không click vào link lạ</p><p>4. Kiểm tra chính tả và ngữ pháp</p>',
  'vi',
  'beginner',
  TRUE
),
(
  'How to spot phishing websites',
  'spot-phishing-websites',
  'article',
  '<h2>Common signs of phishing websites</h2><p>1. Check the URL carefully</p><p>2. Look for HTTPS</p><p>3. Verify domain spelling</p><p>4. Check for security certificates</p>',
  'en',
  'beginner',
  TRUE
),
(
  'Bảo mật tài khoản ngân hàng',
  'bao-mat-tai-khoan-ngan-hang',
  'article',
  '<h2>Cách bảo vệ tài khoản ngân hàng online</h2><p>1. Không chia sẻ mật khẩu, OTP</p><p>2. Kiểm tra URL ngân hàng</p><p>3. Bật xác thực 2 yếu tố</p><p>4. Cập nhật ứng dụng ngân hàng thường xuyên</p>',
  'vi',
  'intermediate',
  TRUE
);

-- Insert some sample reports for testing
-- First, get user IDs
DO $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_moderator_id UUID;
  v_url1_id UUID;
  v_url2_id UUID;
  v_report1_id UUID;
  v_report2_id UUID;
BEGIN
  -- Get user IDs
  SELECT user_id INTO v_user1_id FROM users WHERE email = 'user1@gmail.com';
  SELECT user_id INTO v_user2_id FROM users WHERE email = 'user2@gmail.com';
  SELECT user_id INTO v_moderator_id FROM users WHERE email = 'moderator@anlink.vn';
  
  -- Insert test URLs
  INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, domain, status)
  VALUES 
    ('https://fake-vietinbank-login.tk', 'https://fake-vietinbank-login.tk', encode(digest('https://fake-vietinbank-login.tk', 'sha256'), 'hex'), 'fake-vietinbank-login.tk', 'pending')
  RETURNING url_id INTO v_url1_id;
  
  INSERT INTO suspicious_urls (original_url, normalized_url, url_hash, domain, status)
  VALUES 
    ('http://paypa1-secure.com/verify', 'http://paypa1-secure.com/verify', encode(digest('http://paypa1-secure.com/verify', 'sha256'), 'hex'), 'paypa1-secure.com', 'pending')
  RETURNING url_id INTO v_url2_id;
  
  -- Insert test reports
  INSERT INTO reports (url_id, reported_by, report_reason, incident_description, status, priority)
  VALUES 
    (v_url1_id, v_user1_id, 'Fake VietinBank login page', 'I received an SMS with this link asking me to verify my account. It looks suspicious because the domain is .tk', 'pending', 'high')
  RETURNING report_id INTO v_report1_id;
  
  INSERT INTO reports (url_id, reported_by, report_reason, incident_description, status, priority)
  VALUES 
    (v_url2_id, v_user2_id, 'PayPal phishing attempt', 'This site looks like PayPal but the domain is spelled wrong (paypa1 instead of paypal)', 'under_review', 'medium')
  RETURNING report_id INTO v_report2_id;
  
  -- Add some community feedback
  INSERT INTO community_feedback (report_id, user_id, feedback_type, comment_text)
  VALUES 
    (v_report1_id, v_user2_id, 'vote_phishing', NULL),
    (v_report1_id, v_user2_id, 'comment', 'I also received this SMS! Definitely a scam.');
    
  INSERT INTO community_feedback (report_id, user_id, feedback_type)
  VALUES 
    (v_report2_id, v_user1_id, 'vote_phishing');
  
  RAISE NOTICE 'Test data seeded successfully!';
  RAISE NOTICE 'Report 1 ID: %', v_report1_id;
  RAISE NOTICE 'Report 2 ID: %', v_report2_id;
END $$;