-- Create test users for all roles
INSERT INTO users (email, password, full_name, phone, address, role, status, username) VALUES 
('customer@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Customer', '1234567890', '123 Customer St', 'customer', 'active', 'testcustomer'),
('shopkeeper@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Store Owner', '1234567891', '456 Store Ave', 'shopkeeper', 'active', 'teststore'),
('restaurant@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Restaurant Owner', '1234567892', '789 Restaurant Blvd', 'shopkeeper', 'active', 'testrestaurant'),
('delivery@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Delivery Partner', '1234567893', '321 Delivery Lane', 'delivery_partner', 'active', 'testdelivery')
ON CONFLICT (email) DO NOTHING;

-- Create test stores for shopkeeper and restaurant
INSERT INTO stores (name, slug, description, owner_id, address, phone, store_type, cuisine_type, is_delivery_available, delivery_time, minimum_order, delivery_fee, latitude, longitude) VALUES 
('Test Electronics Store', 'test-electronics', 'Electronics and gadgets store', 
 (SELECT id FROM users WHERE email = 'shopkeeper@test.com'), 
 '456 Store Ave', '1234567891', 'retail', NULL, false, NULL, NULL, NULL, 27.2046, 86.4805),
('Test Restaurant', 'test-restaurant', 'Delicious local cuisine', 
 (SELECT id FROM users WHERE email = 'restaurant@test.com'), 
 '789 Restaurant Blvd', '1234567892', 'restaurant', 'nepali', true, '25-35 mins', 200.00, 50.00, 27.2146, 86.4905)
ON CONFLICT (slug) DO NOTHING;

-- Create test products
INSERT INTO products (name, slug, description, price, category_id, store_id, stock, image_url, product_type, is_active) VALUES 
('Test Smartphone', 'test-smartphone', 'Latest smartphone with great features', 899.99, 1, 
 (SELECT id FROM stores WHERE slug = 'test-electronics'), 10, 'https://via.placeholder.com/300x300', 'retail', true),
('Test Laptop', 'test-laptop', 'High performance laptop', 1299.99, 1, 
 (SELECT id FROM stores WHERE slug = 'test-electronics'), 5, 'https://via.placeholder.com/300x300', 'retail', true),
('Momo (Dumplings)', 'test-momo', 'Traditional Nepali dumplings', 150.00, 2, 
 (SELECT id FROM stores WHERE slug = 'test-restaurant'), 100, 'https://via.placeholder.com/300x300', 'food', true),
('Dal Bhat', 'test-dal-bhat', 'Traditional Nepali meal', 250.00, 2, 
 (SELECT id FROM stores WHERE slug = 'test-restaurant'), 50, 'https://via.placeholder.com/300x300', 'food', true)
ON CONFLICT (slug) DO NOTHING;

-- Create delivery partner record
INSERT INTO delivery_partners (user_id, vehicle_type, vehicle_number, driving_license, id_proof_type, id_proof_number, delivery_areas, emergency_contact, bank_account_number, ifsc_code, status, is_available) VALUES 
((SELECT id FROM users WHERE email = 'delivery@test.com'), 'bike', 'ABC-1234', 'DL-123456789', 'Aadhar', '123456789012', ARRAY['Siraha', 'Lahan'], '9876543210', '1234567890123456', 'BANK001234', 'approved', true)
ON CONFLICT DO NOTHING;

-- Create admin user
INSERT INTO admin_users (email, password, full_name, role, is_active) VALUES 
('admin@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;