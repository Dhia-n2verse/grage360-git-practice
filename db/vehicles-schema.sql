-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  vin TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  model_year INTEGER,
  license_plate TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('Luxury', 'Commercial', 'Basic')),
  vehicle_category TEXT CHECK (vehicle_category IN ('SUV', 'Sedan', 'Truck', 'Van', 'Motorcycle', 'Other')),
  engine_type TEXT CHECK (engine_type IN ('Internal Combustion Engine', 'Electric Motor', 'Hybrid Engine')),
  fuel_type TEXT CHECK (fuel_type IN ('Gasoline', 'Diesel', 'Electricity', 'Petrol + Electricity')),
  transmission_type TEXT CHECK (transmission_type IN ('Manual', 'Automatic', 'CVT')),
  mileage NUMERIC,
  mileage_unit TEXT CHECK (mileage_unit IN ('km', 'miles')),
  logo_image TEXT,
  status TEXT DEFAULT 'active',
  last_appointment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS vehicles_customer_id_idx ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS vehicles_vin_idx ON vehicles(vin);
CREATE INDEX IF NOT EXISTS vehicles_make_model_idx ON vehicles(make, model);
CREATE INDEX IF NOT EXISTS vehicles_license_plate_idx ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS vehicles_status_idx ON vehicles(status);

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_vehicles_modtime
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add RLS policies for vehicles table
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy for Managers - full access
CREATE POLICY "Managers can do everything with vehicles"
ON vehicles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Manager'
  )
);

-- Policy for Front Desk - read and write but not delete
CREATE POLICY "Front Desk can read and write vehicles"
ON vehicles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Front Desk'
  )
);

CREATE POLICY "Front Desk can insert vehicles"
ON vehicles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Front Desk'
  )
);

CREATE POLICY "Front Desk can update vehicles"
ON vehicles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Front Desk'
  )
);

-- Policy for Technicians - read only
CREATE POLICY "Technicians can only read vehicles"
ON vehicles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'Technician'
  )
);

-- Sample data for testing
INSERT INTO vehicles (
  customer_id, 
  vin, 
  make, 
  model, 
  model_year, 
  license_plate, 
  vehicle_type, 
  vehicle_category, 
  engine_type, 
  fuel_type, 
  transmission_type, 
  mileage, 
  mileage_unit
)
SELECT 
  id as customer_id,
  'VIN' || floor(random() * 1000000)::text,
  CASE floor(random() * 5)::int
    WHEN 0 THEN 'Toyota'
    WHEN 1 THEN 'Honda'
    WHEN 2 THEN 'Ford'
    WHEN 3 THEN 'BMW'
    ELSE 'Mercedes'
  END as make,
  CASE floor(random() * 5)::int
    WHEN 0 THEN 'Corolla'
    WHEN 1 THEN 'Civic'
    WHEN 2 THEN 'F-150'
    WHEN 3 THEN 'X5'
    ELSE 'C-Class'
  END as model,
  2015 + floor(random() * 8)::int as model_year,
  'ABC' || floor(random() * 1000)::text as license_plate,
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'Luxury'
    WHEN 1 THEN 'Commercial'
    ELSE 'Basic'
  END as vehicle_type,
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'SUV'
    WHEN 1 THEN 'Sedan'
    ELSE 'Truck'
  END as vehicle_category,
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'Internal Combustion Engine'
    WHEN 1 THEN 'Electric Motor'
    ELSE 'Hybrid Engine'
  END as engine_type,
  CASE floor(random() * 4)::int
    WHEN 0 THEN 'Gasoline'
    WHEN 1 THEN 'Diesel'
    WHEN 2 THEN 'Electricity'
    ELSE 'Petrol + Electricity'
  END as fuel_type,
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'Manual'
    WHEN 1 THEN 'Automatic'
    ELSE 'CVT'
  END as transmission_type,
  floor(random() * 100000) as mileage,
  CASE floor(random() * 2)::int
    WHEN 0 THEN 'km'
    ELSE 'miles'
  END as mileage_unit
FROM customers
LIMIT 10;
