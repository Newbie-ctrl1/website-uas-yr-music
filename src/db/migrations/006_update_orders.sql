-- Drop existing orders table if exists
DROP TABLE IF EXISTS orders CASCADE;

-- Recreate orders table with correct structure
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    buyer_id VARCHAR(255) NOT NULL REFERENCES users(id),
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    quantity INTEGER NOT NULL,
    total_price NUMERIC(15,2) NOT NULL,
    payment_method VARCHAR(50),
    ticket_code VARCHAR(50),
    is_sent BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 