-- Migration: Add unique constraint on url_id in known_phishing_urls
-- Date: December 26, 2025
-- Description: Allows ON CONFLICT handling when confirming phishing URLs

-- First, remove any duplicate url_id entries (keep the most recent)
DELETE FROM known_phishing_urls a
USING known_phishing_urls b
WHERE a.phishing_id < b.phishing_id
  AND a.url_id = b.url_id;

-- Add unique constraint
ALTER TABLE known_phishing_urls 
ADD CONSTRAINT known_phishing_urls_url_id_key UNIQUE (url_id);

-- Migration complete
DO $$ 
BEGIN
    RAISE NOTICE '✅ Unique constraint added to known_phishing_urls.url_id';
    RAISE NOTICE '📋 Constraint: known_phishing_urls_url_id_key';
END $$;
