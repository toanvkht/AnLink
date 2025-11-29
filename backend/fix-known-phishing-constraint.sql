-- First, check if there are any duplicate url_id entries
SELECT url_id, COUNT(*) as count 
FROM known_phishing_urls 
GROUP BY url_id 
HAVING COUNT(*) > 1;

-- If duplicates exist, keep only the most recent one
DELETE FROM known_phishing_urls a
USING known_phishing_urls b
WHERE a.phishing_id < b.phishing_id 
  AND a.url_id = b.url_id;

-- Now add the unique constraint
ALTER TABLE known_phishing_urls 
ADD CONSTRAINT unique_url_id UNIQUE (url_id);

-- Verify the constraint was added
\d known_phishing_urls