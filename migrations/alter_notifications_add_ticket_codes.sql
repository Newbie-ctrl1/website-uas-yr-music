-- Menambahkan kolom ticket_codes ke tabel notifications
DO $$ 
BEGIN
    -- Cek apakah kolom sudah ada
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'ticket_codes'
    ) THEN
        -- Tambah kolom jika belum ada
        ALTER TABLE notifications
        ADD COLUMN ticket_codes TEXT[];
    END IF;
END $$; 