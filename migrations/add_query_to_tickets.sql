ALTER TABLE tickets
ADD COLUMN event_query VARCHAR(100);

-- Update existing tickets to have a default query
UPDATE tickets 
SET event_query = 'public' 
WHERE event_query IS NULL; 