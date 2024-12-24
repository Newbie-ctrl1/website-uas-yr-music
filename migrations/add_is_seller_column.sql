-- Cek apakah kolom is_seller sudah ada
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_seller'
    ) THEN
        -- Tambah kolom is_seller jika belum ada
        ALTER TABLE users 
        ADD COLUMN is_seller BOOLEAN DEFAULT TRUE;

        -- Update semua user yang ada menjadi seller
        UPDATE users SET is_seller = TRUE;
    END IF;
END $$; 