-- Seed data for Education Content (Vietnamese)
-- AnLink Educational Materials

-- Clear existing data (optional - comment out if you want to keep existing)
-- DELETE FROM education_content;

-- 1. Article: What is Phishing?
INSERT INTO education_content (
  title, slug, content_type, content_body, media_url, language, difficulty_level, is_published
) VALUES (
  'Lừa đảo trực tuyến là gì?',
  'lua-dao-truc-tuyen-la-gi',
  'article',
  '<h2>Lừa đảo trực tuyến (Phishing) là gì?</h2>
  <p>Lừa đảo trực tuyến là một hình thức tấn công mạng trong đó kẻ tấn công giả mạo một tổ chức đáng tin cậy (như ngân hàng, công ty công nghệ, hoặc dịch vụ trực tuyến) để đánh cắp thông tin nhạy cảm của bạn.</p>
  
  <h3>🎯 Mục tiêu của kẻ lừa đảo:</h3>
  <ul>
    <li><strong>Tên đăng nhập và mật khẩu</strong> - Để truy cập tài khoản của bạn</li>
    <li><strong>Thông tin thẻ tín dụng</strong> - Để thực hiện giao dịch trái phép</li>
    <li><strong>Thông tin cá nhân</strong> - Để đánh cắp danh tính</li>
    <li><strong>Dữ liệu công ty</strong> - Để tấn công doanh nghiệp</li>
  </ul>
  
  <h3>⚠️ Các hình thức lừa đảo phổ biến:</h3>
  <ol>
    <li><strong>Email giả mạo</strong> - Email trông giống như từ công ty hợp pháp</li>
    <li><strong>Website giả mạo</strong> - Trang web giống hệt trang web thật</li>
    <li><strong>Tin nhắn SMS</strong> - Tin nhắn yêu cầu bạn nhấp vào liên kết</li>
    <li><strong>Cuộc gọi điện thoại</strong> - Người gọi giả mạo nhân viên hỗ trợ</li>
  </ol>
  
  <h3>🛡️ Cách bảo vệ bản thân:</h3>
  <ul>
    <li>Luôn kiểm tra URL trước khi nhập thông tin</li>
    <li>Không bao giờ nhấp vào liên kết trong email đáng ngờ</li>
    <li>Sử dụng xác thực hai yếu tố (2FA)</li>
    <li>Kiểm tra chứng chỉ SSL của website</li>
    <li>Sử dụng công cụ quét URL như AnLink</li>
  </ul>',
  'https://via.placeholder.com/800x400/1e293b/06b6d4?text=Phishing+Awareness',
  'vi',
  'beginner',
  TRUE
);

-- 2. Article: How to Identify Phishing Emails
INSERT INTO education_content (
  title, slug, content_type, content_body, media_url, language, difficulty_level, is_published
) VALUES (
  'Cách nhận biết email lừa đảo',
  'cach-nhan-biet-email-lua-dao',
  'article',
  '<h2>🔍 Dấu hiệu nhận biết email lừa đảo</h2>
  
  <h3>1. Địa chỉ email người gửi đáng ngờ</h3>
  <p><strong>Ví dụ đáng ngờ:</strong></p>
  <ul>
    <li>support@vietinbank-security.tk (thay vì @vietinbank.vn)</li>
    <li>noreply@paypal-verify.com (thay vì @paypal.com)</li>
    <li>admin@facebook-security.net (thay vì @facebook.com)</li>
  </ul>
  
  <h3>2. Lời chào chung chung</h3>
  <p>Email lừa đảo thường dùng:</p>
  <ul>
    <li>"Kính gửi Khách hàng" thay vì tên của bạn</li>
    <li>"Xin chào" không có tên cụ thể</li>
  </ul>
  
  <h3>3. Yêu cầu khẩn cấp</h3>
  <p>Kẻ lừa đảo thường tạo cảm giác cấp bách:</p>
  <ul>
    <li>"Tài khoản của bạn sẽ bị khóa trong 24 giờ!"</li>
    <li>"Xác nhận ngay để tránh mất quyền truy cập"</li>
    <li>"Hành động ngay lập tức!"</li>
  </ul>
  
  <h3>4. Liên kết đáng ngờ</h3>
  <p>Di chuột qua liên kết (không nhấp) để xem URL thực:</p>
  <ul>
    <li>URL không khớp với tên công ty</li>
    <li>URL có nhiều ký tự lạ hoặc số</li>
    <li>URL sử dụng HTTP thay vì HTTPS</li>
  </ul>
  
  <h3>5. Lỗi chính tả và ngữ pháp</h3>
  <p>Email từ công ty hợp pháp thường được kiểm tra kỹ lưỡng. Nhiều lỗi chính tả = dấu hiệu lừa đảo.</p>
  
  <h3>✅ Ví dụ email hợp pháp:</h3>
  <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Người gửi:</strong> support@vietinbank.vn</p>
    <p><strong>Tiêu đề:</strong> Thông báo bảo mật tài khoản của bạn</p>
    <p><strong>Nội dung:</strong> "Chào [Tên của bạn], Chúng tôi muốn thông báo về một hoạt động đăng nhập mới trên tài khoản của bạn..."</p>
  </div>
  
  <h3>❌ Ví dụ email lừa đảo:</h3>
  <div style="background: rgba(239, 68, 68, 0.1); padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Người gửi:</strong> vietinbank-security@secure-login.tk</p>
    <p><strong>Tiêu đề:</strong> URGENT! Verify Your Account NOW!</p>
    <p><strong>Nội dung:</strong> "Kính gửi Khách hàng, Tài khoản của bạn sẽ bị khóa trong 2 giờ! Nhấp vào đây ngay: http://vietinbank-verify.tk/login"</p>
  </div>',
  'https://via.placeholder.com/800x400/1e293b/ef4444?text=Phishing+Email+Warning',
  'vi',
  'beginner',
  TRUE
);

-- 3. Article: Suspicious URLs
INSERT INTO education_content (
  title, slug, content_type, content_body, media_url, language, difficulty_level, is_published
) VALUES (
  'Nhận biết URL đáng ngờ',
  'nhan-biet-url-dang-ngo',
  'article',
  '<h2>🌐 Cách kiểm tra URL đáng ngờ</h2>
  
  <h3>1. Kiểm tra tên miền</h3>
  <p><strong>URL hợp pháp:</strong> https://www.vietinbank.vn/login</p>
  <p><strong>URL đáng ngờ:</strong></p>
  <ul>
    <li>http://vietinbank-security.tk/login (TLD đáng ngờ: .tk)</li>
    <li>https://vietinbank-verify.com (tên miền khác)</li>
    <li>https://secure-vietinbank-login.ml (TLD đáng ngờ: .ml)</li>
  </ul>
  
  <h3>2. Kiểm tra giao thức (HTTP vs HTTPS)</h3>
  <p>Website ngân hàng và dịch vụ tài chính LUÔN sử dụng HTTPS:</p>
  <ul>
    <li>✅ https://vietinbank.vn - An toàn</li>
    <li>❌ http://vietinbank.vn - KHÔNG an toàn</li>
  </ul>
  
  <h3>3. Kiểm tra chứng chỉ SSL</h3>
  <p>Nhấp vào biểu tượng khóa trong thanh địa chỉ để xem:</p>
  <ul>
    <li>Tên công ty có khớp không?</li>
    <li>Chứng chỉ còn hiệu lực không?</li>
    <li>Ai là nhà cung cấp chứng chỉ?</li>
  </ul>
  
  <h3>4. Cảnh giác với URL rút gọn</h3>
  <p>URL rút gọn che giấu đích thực:</p>
  <ul>
    <li>bit.ly/xyz123 - Không biết đích đến</li>
    <li>tinyurl.com/abc - Có thể dẫn đến trang lừa đảo</li>
  </ul>
  <p><strong>Giải pháp:</strong> Sử dụng công cụ như AnLink để quét URL trước khi truy cập!</p>
  
  <h3>5. Kiểm tra lỗi chính tả</h3>
  <p>Kẻ lừa đảo thường dùng tên miền giống nhưng có lỗi chính tả:</p>
  <ul>
    <li>vietinbank.vn ✅</li>
    <li>vietinbnak.vn ❌ (thiếu chữ "i")</li>
    <li>vietin-bank.vn ❌ (có dấu gạch ngang)</li>
    <li>vietinbank.com.vn ❌ (thêm .com)</li>
  </ul>
  
  <h3>6. Cảnh giác với subdomain đáng ngờ</h3>
  <p>Subdomain có thể chứa từ khóa đáng ngờ:</p>
  <ul>
    <li>secure-login-vietinbank.tk ❌</li>
    <li>verify-account-vietinbank.ml ❌</li>
    <li>www.vietinbank.vn ✅</li>
  </ul>',
  'https://via.placeholder.com/800x400/1e293b/f59e0b?text=Suspicious+URLs',
  'vi',
  'intermediate',
  TRUE
);

-- 4. Quiz: Basic Phishing Awareness
INSERT INTO education_content (
  title, slug, content_type, content_body, media_url, language, difficulty_level, is_published
) VALUES (
  'Kiểm tra kiến thức: Nhận biết lừa đảo cơ bản',
  'kiem-tra-ki-thuc-nhan-biet-lua-dao-co-ban',
  'quiz',
  '[
    {
      "id": 1,
      "question": "Email từ ngân hàng yêu cầu bạn nhập mật khẩu là dấu hiệu của lừa đảo?",
      "options": ["Đúng", "Sai"],
      "correct": 0,
      "explanation": "Đúng! Ngân hàng hợp pháp không bao giờ yêu cầu bạn nhập mật khẩu qua email."
    },
    {
      "id": 2,
      "question": "URL nào sau đây đáng ngờ nhất?",
      "options": [
        "https://www.vietinbank.vn",
        "http://vietinbank-security.tk",
        "https://vietinbank.com.vn"
      ],
      "correct": 1,
      "explanation": "URL đáng ngờ nhất là http://vietinbank-security.tk vì: (1) Dùng HTTP thay vì HTTPS, (2) TLD .tk là miễn phí và thường bị lạm dụng, (3) Có từ 'security' trong subdomain"
    },
    {
      "id": 3,
      "question": "Bạn nhận được email từ 'support@paypal-verify.com' yêu cầu xác minh tài khoản. Bạn nên làm gì?",
      "options": [
        "Nhấp vào liên kết trong email ngay",
        "Đăng nhập trực tiếp vào paypal.com để kiểm tra",
        "Trả lời email để xác nhận"
      ],
      "correct": 1,
      "explanation": "Luôn đăng nhập trực tiếp vào website chính thức (paypal.com) thay vì nhấp vào liên kết trong email. Email từ 'paypal-verify.com' là giả mạo."
    },
    {
      "id": 4,
      "question": "Dấu hiệu nào sau đây KHÔNG phải là dấu hiệu của email lừa đảo?",
      "options": [
        "Lời chào chung chung không có tên",
        "Yêu cầu khẩn cấp phải hành động ngay",
        "Email được gửi từ địa chỉ chính thức của công ty"
      ],
      "correct": 2,
      "explanation": "Email từ địa chỉ chính thức của công ty thường là hợp pháp. Tuy nhiên, vẫn cần kiểm tra kỹ vì kẻ lừa đảo có thể giả mạo địa chỉ người gửi."
    },
    {
      "id": 5,
      "question": "Website nào sau đây an toàn để nhập thông tin thẻ tín dụng?",
      "options": [
        "http://shop.example.com/checkout",
        "https://shop.example.com/checkout (có biểu tượng khóa)",
        "http://secure-shop.example.tk/payment"
      ],
      "correct": 1,
      "explanation": "Chỉ nhập thông tin nhạy cảm trên website có HTTPS (biểu tượng khóa) và từ tên miền đáng tin cậy. HTTP và TLD .tk đều đáng ngờ."
    }
  ]',
  'https://via.placeholder.com/800x400/1e293b/8b5cf6?text=Phishing+Quiz',
  'vi',
  'beginner',
  TRUE
);

-- 5. Infographic: Phishing Prevention Tips
INSERT INTO education_content (
  title, slug, content_type, content_body, media_url, language, difficulty_level, is_published
) VALUES (
  'Infographic: 10 mẹo phòng chống lừa đảo',
  'infographic-10-meo-phong-chong-lua-dao',
  'infographic',
  '<h2>🛡️ 10 Mẹo Phòng Chống Lừa Đảo Trực Tuyến</h2>
  
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 24px 0;">
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">1️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Kiểm tra URL</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Luôn kiểm tra địa chỉ website trước khi nhập thông tin</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">2️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Sử dụng HTTPS</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Chỉ truy cập website có biểu tượng khóa (HTTPS)</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">3️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Bật 2FA</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Bật xác thực hai yếu tố cho tất cả tài khoản quan trọng</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">4️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Không nhấp liên kết</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Đăng nhập trực tiếp vào website thay vì nhấp liên kết trong email</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">5️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Kiểm tra người gửi</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Xác minh địa chỉ email người gửi có phải từ công ty hợp pháp không</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">6️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Cảnh giác với yêu cầu khẩn</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Kẻ lừa đảo thường tạo cảm giác cấp bách để bạn hành động vội vàng</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">7️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Cập nhật phần mềm</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Luôn cập nhật trình duyệt và phần mềm bảo mật</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">8️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Sử dụng mật khẩu mạnh</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Mỗi tài khoản một mật khẩu duy nhất và phức tạp</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">9️⃣</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Quét URL trước</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Sử dụng công cụ như AnLink để quét URL đáng ngờ</p>
    </div>
    
    <div style="background: rgba(6, 182, 212, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
      <div style="font-size: 32px; margin-bottom: 12px;">🔟</div>
      <h3 style="color: #06b6d4; margin-bottom: 8px;">Báo cáo lừa đảo</h3>
      <p style="color: #e2e8f0; font-size: 14px;">Nếu phát hiện lừa đảo, hãy báo cáo ngay để bảo vệ cộng đồng</p>
    </div>
  </div>',
  'https://via.placeholder.com/1200x800/1e293b/06b6d4?text=10+Tips+Phishing+Prevention',
  'vi',
  'beginner',
  TRUE
);

-- 6. Article: Advanced Phishing Techniques
INSERT INTO education_content (
  title, slug, content_type, content_body, media_url, language, difficulty_level, is_published
) VALUES (
  'Kỹ thuật lừa đảo nâng cao',
  'ky-thuat-lua-dao-nang-cao',
  'article',
  '<h2>🎭 Kỹ Thuật Lừa Đảo Nâng Cao</h2>
  
  <h3>1. Homograph Attack (Tấn công đồng hình)</h3>
  <p>Kẻ tấn công sử dụng ký tự Unicode giống hệt chữ cái Latin:</p>
  <ul>
    <li>vietinbank.vn ✅ (chữ "i" Latin)</li>
    <li>vіetіnbank.vn ❌ (chữ "і" Cyrillic - trông giống hệt nhưng khác)</li>
  </ul>
  <p><strong>Cách phòng chống:</strong> Sao chép URL và dán vào trình soạn thảo văn bản để kiểm tra ký tự.</p>
  
  <h3>2. Typosquatting (Tấn công lỗi chính tả)</h3>
  <p>Đăng ký tên miền giống nhưng có lỗi chính tả:</p>
  <ul>
    <li>vietinbank.vn ✅</li>
    <li>vietinbnak.vn ❌ (đảo chữ "a" và "n")</li>
    <li>vietinbamk.vn ❌ (thay "n" bằng "m")</li>
  </ul>
  
  <h3>3. Subdomain Phishing</h3>
  <p>Sử dụng subdomain của tên miền hợp pháp:</p>
  <ul>
    <li>secure.vietinbank.vn - Có thể là hợp pháp</li>
    <li>vietinbank.secure-login.tk - Giả mạo (tên miền chính là secure-login.tk)</li>
  </ul>
  
  <h3>4. Brand Impersonation</h3>
  <p>Kết hợp tên thương hiệu với từ khóa đáng ngờ:</p>
  <ul>
    <li>vietinbank-verify.tk ❌</li>
    <li>secure-vietinbank-login.ml ❌</li>
    <li>vietinbank123.com ❌</li>
  </ul>
  
  <h3>5. URL Shortening Abuse</h3>
  <p>Che giấu URL thực bằng dịch vụ rút gọn:</p>
  <ul>
    <li>bit.ly/xyz123 - Không biết đích đến</li>
    <li>tinyurl.com/abc - Có thể dẫn đến trang lừa đảo</li>
  </ul>
  <p><strong>Giải pháp:</strong> Sử dụng công cụ mở rộng URL hoặc quét bằng AnLink.</p>
  
  <h3>6. HTTPS Phishing</h3>
  <p>Ngay cả website có HTTPS cũng có thể là lừa đảo!</p>
  <p>Kẻ lừa đảo có thể lấy chứng chỉ SSL miễn phí cho tên miền giả mạo.</p>
  <p><strong>Luôn kiểm tra:</strong></p>
  <ul>
    <li>Tên trong chứng chỉ có khớp với tên công ty không?</li>
    <li>URL có đúng không?</li>
    <li>Website có trông chuyên nghiệp không?</li>
  </ul>
  
  <h3>🛡️ Bảo vệ chống lại các kỹ thuật nâng cao:</h3>
  <ol>
    <li><strong>Sử dụng bookmark</strong> - Đánh dấu trang web chính thức và chỉ truy cập qua bookmark</li>
    <li><strong>Kiểm tra kỹ URL</strong> - Đọc từng ký tự một cách cẩn thận</li>
    <li><strong>Sử dụng công cụ quét</strong> - AnLink có thể phát hiện nhiều kỹ thuật này</li>
    <li><strong>Không tin tưởng mù quáng</strong> - Ngay cả khi trông giống hệt, vẫn cần kiểm tra</li>
  </ol>',
  'https://via.placeholder.com/800x400/1e293b/dc2626?text=Advanced+Phishing',
  'vi',
  'advanced',
  TRUE
);

-- 7. Quiz: Advanced Phishing Detection
INSERT INTO education_content (
  title, slug, content_type, content_body, media_url, language, difficulty_level, is_published
) VALUES (
  'Kiểm tra nâng cao: Phát hiện lừa đảo',
  'kiem-tra-nang-cao-phat-hien-lua-dao',
  'quiz',
  '[
    {
      "id": 1,
      "question": "URL nào sau đây là GIẢ MẠO?",
      "options": [
        "https://www.vietinbank.vn",
        "https://vietinbank.secure-login.tk",
        "https://vietinbank.com.vn"
      ],
      "correct": 1,
      "explanation": "vietinbank.secure-login.tk là giả mạo vì tên miền chính là secure-login.tk (không phải vietinbank.vn), và TLD .tk thường bị lạm dụng."
    },
    {
      "id": 2,
      "question": "Website có HTTPS (biểu tượng khóa) có nghĩa là an toàn 100%?",
      "options": [
        "Đúng, HTTPS = an toàn",
        "Sai, HTTPS chỉ mã hóa kết nối, không đảm bảo website hợp pháp"
      ],
      "correct": 1,
      "explanation": "HTTPS chỉ mã hóa kết nối giữa bạn và server. Kẻ lừa đảo vẫn có thể lấy chứng chỉ SSL cho website giả mạo. Luôn kiểm tra tên miền!"
    },
    {
      "id": 3,
      "question": "Bạn nhận được email từ 'noreply@vietinbank.vn' yêu cầu xác minh. Email này chắc chắn hợp pháp?",
      "options": [
        "Đúng, vì địa chỉ email đúng",
        "Sai, vì kẻ lừa đảo có thể giả mạo địa chỉ người gửi"
      ],
      "correct": 1,
      "explanation": "Kẻ lừa đảo có thể giả mạo địa chỉ email người gửi (email spoofing). Luôn kiểm tra header email và không tin tưởng mù quáng vào địa chỉ người gửi."
    },
    {
      "id": 4,
      "question": "Phương pháp nào sau đây là CÁCH TỐT NHẤT để tránh lừa đảo?",
      "options": [
        "Chỉ nhấp vào liên kết từ email",
        "Luôn đăng nhập trực tiếp vào website chính thức qua bookmark",
        "Tin tưởng vào biểu tượng khóa HTTPS"
      ],
      "correct": 1,
      "explanation": "Cách tốt nhất là đánh dấu (bookmark) website chính thức và chỉ truy cập qua bookmark. Không bao giờ nhấp vào liên kết trong email đáng ngờ."
    },
    {
      "id": 5,
      "question": "URL 'vіetіnbank.vn' (với chữ i Cyrillic) so với 'vietinbank.vn' (chữ i Latin) là:",
      "options": [
        "Giống hệt nhau",
        "Khác nhau - đây là kỹ thuật homograph attack"
      ],
      "correct": 1,
      "explanation": "Đây là homograph attack - sử dụng ký tự Unicode trông giống hệt nhưng khác ký tự. Luôn kiểm tra kỹ URL bằng cách sao chép và dán vào trình soạn thảo."
    }
  ]',
  'https://via.placeholder.com/800x400/1e293b/8b5cf6?text=Advanced+Quiz',
  'vi',
  'advanced',
  TRUE
);

SELECT 'Education content seeded successfully!' AS status;
