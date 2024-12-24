-- Add ticket_code column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT FALSE;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'TICKET_SENT', 'TICKET_RECEIVED'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    order_id INTEGER REFERENCES orders(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 