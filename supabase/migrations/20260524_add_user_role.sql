-- Add role column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';

-- Ensure existing users without a role get 'client'
UPDATE users SET role = 'client' WHERE role IS NULL;
