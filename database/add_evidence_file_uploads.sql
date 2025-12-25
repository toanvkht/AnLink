-- Migration: Add evidence file upload support to reports table
-- Date: December 25, 2025
-- Description: Adds column to store uploaded evidence files (images, PDFs, videos)
--              Replaces URL-based evidence with direct file uploads

-- Add new column for uploaded evidence files
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS evidence_file_urls JSONB;

-- Add comment
COMMENT ON COLUMN reports.evidence_file_urls IS 'Array of uploaded evidence file URLs stored as JSON';

-- Update existing reports to have empty array for file uploads
UPDATE reports 
SET evidence_file_urls = '[]'::jsonb 
WHERE evidence_file_urls IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_evidence_files ON reports USING GIN (evidence_file_urls);

-- Migration complete
DO $$ 
BEGIN
    RAISE NOTICE '✅ Evidence file upload column added successfully';
    RAISE NOTICE '📁 Column: evidence_file_urls (JSONB)';
    RAISE NOTICE '🔍 Index: idx_reports_evidence_files (GIN)';
END $$;
