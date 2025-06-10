-- Fix user roles to allow delivery_partner
DO $$
BEGIN
    -- Check if the role column is using an enum constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%role%' 
        AND table_name = 'users'
    ) THEN
        -- Drop the enum constraint if it exists
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    END IF;
    
    -- Ensure the role column can accept all valid roles
    -- This will work regardless of whether there's an enum constraint
    UPDATE users SET role = 'customer' WHERE role NOT IN ('customer', 'shopkeeper', 'delivery_partner');
END $$;