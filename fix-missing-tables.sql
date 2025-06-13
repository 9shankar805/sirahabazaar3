
-- Create missing tables to fix database errors

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    assigned_to INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Wishlist items table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    product_id INTEGER REFERENCES products(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    description TEXT,
    position TEXT NOT NULL DEFAULT 'main',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_status ON delivery_partners(status);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_user_id ON delivery_partners(user_id);
