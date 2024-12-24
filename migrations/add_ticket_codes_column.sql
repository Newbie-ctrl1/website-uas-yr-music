-- Drop kolom jika sudah ada (untuk menghindari konflik)
ALTER TABLE notifications 
DROP COLUMN IF EXISTS ticket_codes;

-- Tambah kolom baru
ALTER TABLE notifications 
ADD COLUMN ticket_codes TEXT[];

-- Verifikasi kolom telah ditambahkan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'ticket_codes'
    ) THEN
        RAISE EXCEPTION 'Kolom ticket_codes tidak berhasil ditambahkan';
    END IF;
END $$; 