-- Create specialties table
CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create technician_specialties junction table
CREATE TABLE IF NOT EXISTS technician_specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(technician_id, specialty_id)
);

-- Add trigger to update the updated_at timestamp for specialties
CREATE TRIGGER update_specialties_modtime
BEFORE UPDATE ON specialties
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insert predefined specialties
INSERT INTO specialties (name, description) VALUES
  ('Electro-Mechanical', 'Specializes in electrical and mechanical systems'),
  ('General Mechanical', 'Specializes in general mechanical repairs and maintenance'),
  ('Body Shop', 'Specializes in vehicle body repairs and cosmetic work'),
  ('Diagnostic', 'Specializes in diagnosing vehicle issues and problems')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies for specialties table
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to read specialties
CREATE POLICY "All users can read specialties"
ON specialties
FOR SELECT
TO authenticated
USING (true);

-- Policy for Managers to manage specialties
CREATE POLICY "Managers can manage specialties"
ON specialties
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Manager'
  )
);

-- Add RLS policies for technician_specialties table
ALTER TABLE technician_specialties ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to read technician specialties
CREATE POLICY "All users can read technician specialties"
ON technician_specialties
FOR SELECT
TO authenticated
USING (true);

-- Policy for Managers to manage technician specialties
CREATE POLICY "Managers can manage technician specialties"
ON technician_specialties
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Manager'
  )
);

-- Policy for Technicians to view their own specialties
CREATE POLICY "Technicians can view their own specialties"
ON technician_specialties
FOR SELECT
TO authenticated
USING (
  technician_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Manager'
  )
);
