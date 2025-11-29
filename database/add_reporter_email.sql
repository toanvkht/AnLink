-- Migration: Add reporter_email column to reports table
-- This allows anonymous reporters to optionally provide an email for follow-up

-- Add reporter_email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' AND column_name = 'reporter_email'
    ) THEN
        ALTER TABLE reports ADD COLUMN reporter_email VARCHAR(255) NULL;
        
        -- Add comment for documentation
        COMMENT ON COLUMN reports.reporter_email IS 'Optional email for anonymous reporters to receive updates';
    END IF;
END $$;

-- Make reported_by nullable for anonymous reports (if not already)
ALTER TABLE reports ALTER COLUMN reported_by DROP NOT NULL;

-- Create an index on reporter_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_reporter_email ON reports(reporter_email) WHERE reporter_email IS NOT NULL;

-- Update any existing constraint to allow NULL reported_by
-- (This is safe to run even if already nullable)

SELECT 'Migration completed: reports table now supports anonymous submissions' AS status;
