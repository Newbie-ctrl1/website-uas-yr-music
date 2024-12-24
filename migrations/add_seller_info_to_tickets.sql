-- Tambah kolom seller_name dan seller_email ke tabel tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS seller_email VARCHAR(255);

-- Update data yang sudah ada dengan mengambil dari tabel users
UPDATE tickets t 
SET 
  seller_name = u.display_name,
  seller_email = u.email
FROM users u 
WHERE t.seller_id = u.id 
AND (t.seller_name IS NULL OR t.seller_email IS NULL); 