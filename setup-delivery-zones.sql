-- Create delivery zones table and populate with sample data
CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  min_distance DECIMAL(8,2) NOT NULL,
  max_distance DECIMAL(8,2) NOT NULL,
  base_fee DECIMAL(10,2) NOT NULL,
  per_km_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample delivery zones for Siraha, Nepal area
INSERT INTO delivery_zones (name, min_distance, max_distance, base_fee, per_km_rate, is_active) VALUES
('Inner City', 0, 5, 30.00, 5.00, true),
('Suburban', 5.01, 15, 50.00, 8.00, true),
('Rural', 15.01, 30, 80.00, 12.00, true),
('Extended Rural', 30.01, 100, 120.00, 15.00, true);