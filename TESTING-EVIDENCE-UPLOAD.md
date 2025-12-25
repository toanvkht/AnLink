# Evidence File Upload Implementation - Testing Guide

## Changes Summary

### Database Changes
✅ Added `evidence_file_urls` JSONB column to `reports` table
✅ Created GIN index for performance
✅ Migration completed: `database/add_evidence_file_uploads.sql`

### Backend Changes

1. **Upload Middleware** (`backend/src/middleware/uploadMiddleware.js`)
   - Created `uploads/reports/` directory
   - Added separate storage config for report evidence
   - Exported `uploadEvidenceFiles` middleware (up to 5 files)
   - File types: Images (JPEG, PNG, GIF, WebP), Videos (MP4, WebM), PDFs
   - Max size: 10MB per file

2. **Report Routes** (`backend/src/routes/reportRoutes.js`)
   - Added `uploadEvidenceFiles` middleware to POST `/api/reports`
   - Included error handler for upload failures

3. **Report Controller** (`backend/src/controllers/reportController.js`)
   - Processes `req.files` array from multer
   - Builds file URLs: `${BASE_URL}/uploads/reports/${filename}`
   - Stores URLs in `evidence_file_urls` JSONB column
   - Returns `evidence_files_count` in response

### Frontend Changes

**Report Page** (`frontend/src/pages/ReportPhishingPage.jsx`)

1. **Replaced URL inputs with file upload**
   - Removed `evidence_urls` state array
   - Added `evidenceFiles` and `filePreviewUrls` state

2. **Drag & Drop Support**
   - Visual drop zone with hover effects
   - File validation (type, size, count)
   - Supports multiple file selection

3. **File Previews**
   - Image thumbnails (64x64px)
   - Video/PDF icons
   - File name, size, and type display
   - Individual remove buttons

4. **FormData Submission**
   - Builds FormData instead of JSON
   - Appends files as `evidence_files`
   - Axios automatically handles Content-Type

## Testing Instructions

### 1. Start Servers

```bash
# Backend (Port 5000)
cd backend
npm run dev

# Frontend (Port 3000)
cd frontend
npm start
```

### 2. Test File Upload

1. Navigate to: http://localhost:3000/reports/new
2. Fill in:
   - URL: `https://suspicious-example.com`
   - Report reason: Select any option
   - Incident description (optional)
3. **Upload Evidence Files**:
   - Drag & drop files OR click "Choose files"
   - Try: Screenshots (PNG/JPG), videos (MP4), PDFs
   - Test validation:
     - ✅ Valid: 5 files, 10MB each
     - ❌ Invalid: 6+ files (should show error)
     - ❌ Invalid: File > 10MB (should show error)
     - ❌ Invalid: .txt, .docx files (should show error)

4. Submit report

### 3. Verify Backend

**Check uploaded files:**
```bash
ls backend/uploads/reports/
```

**Check database:**
```sql
SELECT report_id, evidence_file_urls 
FROM reports 
ORDER BY reported_at DESC 
LIMIT 5;
```

**Access uploaded files:**
- http://localhost:5000/uploads/reports/[filename]

### 4. Test Scenarios

#### A. Anonymous Report with Files
- Log out (if logged in)
- Submit report with 2-3 image files
- Verify success message
- Check files are uploaded

#### B. Authenticated Report with Mixed Files
- Log in as test user (user1@gmail.com / User123!)
- Submit report with:
  - 1 screenshot (PNG)
  - 1 video (MP4)
  - 1 PDF document
- Should redirect to `/reports` page after 2 seconds

#### C. File Validation Tests
- Try uploading 6 files (should fail)
- Try uploading a .txt file (should fail)
- Try uploading a 15MB file (should fail)

#### D. Preview Tests
- Upload 3 images - verify thumbnails show
- Upload 1 video - verify video icon shows
- Upload 1 PDF - verify PDF icon shows
- Remove middle file - verify others remain

### 5. Check Moderator/Admin View

When moderators review reports, they should see file URLs in `evidence_file_urls`:

```json
{
  "report_id": "uuid-here",
  "evidence_file_urls": [
    "http://localhost:5000/uploads/reports/screenshot-1234567890-123456789.png",
    "http://localhost:5000/uploads/reports/evidence-1234567890-987654321.mp4"
  ]
}
```

## Known Issues & Notes

1. **Old reports**: Existing reports still have `evidence_urls` (text links). Migration set `evidence_file_urls` to empty array for backward compatibility.

2. **File cleanup**: Uploaded files are NOT automatically deleted when reports are deleted. Consider implementing cleanup logic.

3. **Production**: Update `BASE_URL` in `.env` for production deployment:
   ```
   BASE_URL=https://anlink.example.com
   ```

4. **CORS**: If frontend runs on different domain, ensure CORS allows file uploads.

## Rollback Instructions

If issues occur:

```bash
# 1. Stop servers

# 2. Rollback database
psql -U postgres -d anlink_dev_clone
DROP INDEX IF EXISTS idx_reports_evidence_files;
ALTER TABLE reports DROP COLUMN IF EXISTS evidence_file_urls;

# 3. Restore from git
git checkout backend/src/middleware/uploadMiddleware.js
git checkout backend/src/routes/reportRoutes.js
git checkout backend/src/controllers/reportController.js
git checkout frontend/src/pages/ReportPhishingPage.jsx

# 4. Remove uploaded files
rm -rf backend/uploads/reports/*
```

## Files Modified

### New Files
- `database/add_evidence_file_uploads.sql` - Database migration

### Modified Files
- `backend/src/middleware/uploadMiddleware.js` - Added reports upload config
- `backend/src/routes/reportRoutes.js` - Added upload middleware
- `backend/src/controllers/reportController.js` - File processing logic
- `frontend/src/pages/ReportPhishingPage.jsx` - File upload UI

### Created Directories
- `backend/uploads/reports/` - Storage for evidence files

---

**Implementation completed on**: December 25, 2025
**Database migration**: ✅ Applied
**Backend**: ✅ Running on port 5000
**Frontend**: Ready for testing on port 3000
