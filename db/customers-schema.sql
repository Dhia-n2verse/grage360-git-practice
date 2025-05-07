-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  birth_date DATE,
  type TEXT NOT NULL DEFAULT 'personal',
  company_name TEXT,
  fiscal_id TEXT,
  company_address TEXT,
  image TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(first_name, last_name);
CREATE INDEX IF NOT EXISTS customers_type_idx ON customers(type);
CREATE INDEX IF NOT EXISTS customers_status_idx ON customers(status);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_modtime
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Sample data for testing
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, postal_code, type, company_name, fiscal_id, status)
VALUES
  ('John', 'Smith', 'john.smith@example.com', '555-123-4567', '123 Main St', 'Anytown', 'CA', '12345', 'personal', NULL, NULL, 'active'),
  ('Acme', 'Corporation', 'contact@acmecorp.com', '555-987-6543', '789 Business Ave', 'Commerce City', 'NY', '54321', 'business', 'Acme Corporation', 'ACM123456', 'active'),
  ('Jane', 'Doe', 'jane.doe@example.com', '555-555-5555', '456 Oak Dr', 'Somewhere', 'TX', '67890', 'personal', NULL, NULL, 'active')
ON CONFLICT (email) DO NOTHING;

-- Add RLS policies for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy for Managers - full access
CREATE POLICY "Managers can do everything with customers"
ON customers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Manager'
  )
);

-- Policy for Front Desk - read and write but not delete
CREATE POLICY "Front Desk can read and write customers"
ON customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Front Desk'
  )
);

CREATE POLICY "Front Desk can insert customers"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Front Desk'
  )
);

CREATE POLICY "Front Desk can update customers"
ON customers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Front Desk'
  )
);

-- Policy for Technicians - read only
CREATE POLICY "Technicians can only read customers"
ON customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Technician'
  )
);
