-- Drop tabel notifications jika sudah ada
DROP TABLE IF EXISTS notifications CASCADE;

-- Buat ulang tabel notifications dengan struktur yang benar
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    ticket_codes TEXT[],
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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