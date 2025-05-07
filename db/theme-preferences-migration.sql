-- Add theme preferences columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_mode VARCHAR(20),
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20);

-- Set default values for existing users
UPDATE profiles 
SET theme_mode = 'light', theme_color = 'orange'
WHERE theme_mode IS NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.theme_mode IS 'User theme mode preference (light, dark, high-contrast)';
COMMENT ON COLUMN profiles.theme_color IS 'User color theme preference (orange, blue, green, purple, gray)';
