-- Drop indexes jika sudah ada
DROP INDEX IF EXISTS idx_ticket_codes_order_id;
DROP INDEX IF EXISTS idx_ticket_codes_code;

-- Buat tabel jika belum ada
CREATE TABLE IF NOT EXISTS ticket_codes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  ticket_code VARCHAR(255) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat index baru
CREATE INDEX idx_ticket_codes_order_id ON ticket_codes(order_id);
CREATE UNIQUE INDEX idx_ticket_codes_code ON ticket_codes(ticket_code); 