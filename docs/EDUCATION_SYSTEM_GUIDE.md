# AnLink Education System Guide

## Overview

The AnLink Education System provides Vietnamese-language educational resources about phishing awareness, including articles, infographics, quizzes, and downloadable materials. Admins can manage all content through a dedicated interface.

## Features

✅ **Vietnamese Language Content** - All content available in Vietnamese  
✅ **Multiple Content Types** - Articles, videos, infographics, quizzes, audio  
✅ **Interactive Quizzes** - Phishing awareness quizzes with scoring  
✅ **Downloadable Materials** - PDFs and infographics for offline use  
✅ **Admin Content Management** - Full CRUD interface for managing content  
✅ **Responsive Design** - Works on all devices  

## Setup

### 1. Run Database Seed

Load Vietnamese educational content:

```bash
psql -U postgres -d anlink -f database/education_seed_data.sql
```

This will create:
- 5 articles (beginner to advanced)
- 2 quizzes (basic and advanced)
- 1 infographic

### 2. File Uploads (Media/Downloads)

Currently, the system uses **URLs** for media files. You have two options:

#### Option A: Use External URLs
- Upload images/PDFs to a cloud service (e.g., Cloudinary, AWS S3, or your own server)
- Enter the URL in the `media_url` field when creating content

#### Option B: Add File Upload (Recommended for Production)

To add file upload support:

1. **Install multer** (for file uploads):
```bash
cd backend
npm install multer
```

2. **Create upload middleware** (`backend/src/middleware/upload.js`):
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/education/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and videos are allowed.'));
    }
  }
});

module.exports = upload;
```

3. **Update education routes** to accept file uploads:
```javascript
const upload = require('../middleware/upload');

router.post('/', authenticateToken, requireRole(['admin']), 
  upload.single('media'), 
  educationController.createContent
);
```

4. **Serve static files** in `server.js`:
```javascript
app.use('/uploads', express.static('uploads'));
```

5. **Update frontend** to use FormData for file uploads.

## Usage

### For Users

1. **Browse Education Content**
   - Visit `/education` to see all available materials
   - Filter by type, difficulty, or language
   - Click on any item to view details

2. **Take Quizzes**
   - Go to `/education/quiz` or click "Kiểm Tra Kiến Thức"
   - Answer questions and get instant feedback
   - View explanations for each answer

3. **Download Materials**
   - Visit `/education/downloads`
   - Click "Tải xuống" on any material
   - Files are saved to your downloads folder

### For Admins

1. **Access Admin Panel**
   - Log in as admin
   - Click "Manage Content" in the header
   - Or visit `/admin/education`

2. **Create New Content**
   - Click "+ Tạo nội dung mới"
   - Fill in the form:
     - **Title**: Content title (Vietnamese)
     - **Slug**: URL-friendly identifier (auto-generated from title)
     - **Content Type**: article, video, infographic, quiz, or audio
     - **Content Body**: 
       - For articles: HTML content
       - For quizzes: JSON array of questions
     - **Media URL**: URL to image/video/PDF
     - **Language**: vi (Vietnamese) or en (English)
     - **Difficulty**: beginner, intermediate, or advanced
     - **Published**: Check to make visible to users

3. **Edit Content**
   - Click "Sửa" on any content item
   - Modify fields as needed
   - Click "Cập nhật"

4. **Delete Content**
   - Click "Xóa" on any content item
   - Confirm deletion

## Quiz Format

Quizzes use JSON format in the `content_body` field:

```json
[
  {
    "id": 1,
    "question": "Câu hỏi của bạn?",
    "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3"],
    "correct": 0,
    "explanation": "Giải thích tại sao đáp án này đúng"
  }
]
```

**Fields:**
- `id`: Unique question ID
- `question`: Question text
- `options`: Array of answer options
- `correct`: Index of correct answer (0-based)
- `explanation`: Explanation shown after quiz completion

## Content Types

- **article**: Text-based educational content (HTML)
- **video**: Video content (embed URL in media_url)
- **infographic**: Image-based content (image URL in media_url)
- **quiz**: Interactive quiz (JSON questions in content_body)
- **audio**: Audio content (audio URL in media_url)

## API Endpoints

### Public
- `GET /api/education` - List all published content
- `GET /api/education/:slug` - Get content by slug
- `POST /api/education/quiz/submit` - Submit quiz attempt (anonymous allowed)

### Admin Only
- `POST /api/education` - Create content
- `PUT /api/education/:contentId` - Update content
- `DELETE /api/education/:contentId` - Delete content
- `GET /api/education/id/:contentId` - Get content by ID

## Routes

### Frontend Routes
- `/education` - Main education page
- `/education/:slug` - View content detail
- `/education/quiz` - Quiz list/start
- `/education/quiz/:slug` - Take specific quiz
- `/education/downloads` - Downloadable materials
- `/admin/education` - Admin content management

## Styling

All pages use the dark glass-morphism theme consistent with the rest of the application:
- Dark gradient backgrounds
- Glass-morphism cards with backdrop blur
- Cyan/blue accent colors
- Responsive grid layouts

## Next Steps

1. **Add File Upload**: Implement file upload for media files
2. **Add More Content**: Create additional Vietnamese articles and quizzes
3. **Add English Content**: Translate content to English
4. **Add Progress Tracking**: Track user progress through educational materials
5. **Add Certificates**: Issue certificates for completing quizzes

## Troubleshooting

**Content not showing?**
- Check if `is_published` is set to `true`
- Verify the content exists in the database
- Check browser console for API errors

**Quiz not working?**
- Verify JSON format is valid
- Check that `content_type` is set to `'quiz'`
- Ensure questions have `id`, `question`, `options`, and `correct` fields

**Admin can't edit?**
- Verify user role is `'admin'`
- Check authentication token is valid
- Ensure backend routes are properly configured
