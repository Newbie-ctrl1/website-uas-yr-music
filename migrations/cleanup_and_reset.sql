-- Nonaktifkan foreign key constraints sementara
SET session_replication_role = 'replica';

-- Hapus semua data dari tabel-tabel terkait
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE ticket_codes CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE tickets CASCADE;

-- Drop dan buat ulang tabel notifications
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    ticket_codes TEXT[],
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_sent BOOLEAN DEFAULT FALSE
);

-- Reset sequence
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE ticket_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE tickets_id_seq RESTART WITH 1;

-- Aktifkan kembali foreign key constraints
SET session_replication_role = 'origin';

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