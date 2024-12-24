-- Tambah kolom is_seller ke tabel users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT TRUE;

-- Update semua user yang ada menjadi seller
UPDATE users SET is_seller = TRUE;

-- Tambah kolom event_query ke tabel tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS event_query VARCHAR(100);

-- Update tiket yang sudah ada dengan creator_id sebagai event_query
UPDATE tickets 
SET event_query = seller_id::text 
WHERE event_query IS NULL; 