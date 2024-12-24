-- Hapus data yang ada
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE ticket_codes CASCADE;
TRUNCATE TABLE orders CASCADE;

-- Drop kolom ticket_codes jika ada
ALTER TABLE notifications 
DROP COLUMN IF EXISTS ticket_codes;

-- Tambah kolom ticket_codes dengan tipe yang benar
ALTER TABLE notifications 
ADD COLUMN ticket_codes TEXT[];

-- Verifikasi struktur
DO $$
BEGIN
    -- Verifikasi kolom ticket_codes ada
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'ticket_codes'
    ) THEN
        RAISE EXCEPTION 'Kolom ticket_codes tidak ada';
    END IF;

    -- Verifikasi tipe data
    IF (
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'ticket_codes'
    ) != 'ARRAY' THEN
        RAISE EXCEPTION 'Kolom ticket_codes bukan tipe ARRAY';
    END IF;
END $$; 