-- Create enum types for categories and specialities
CREATE TYPE product_category AS ENUM (
  'Engine Components',
  'Oils & Filters',
  'Wheels & Brakes',
  'Electrical Components',
  'Transmission & Clutch',
  'Suspension Systems',
  'Body & Trim',
  'Other'
);

-- Create Supplier table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  recommended_vehicle_make TEXT[],
  address TEXT,
  website TEXT,
  speciality product_category[],
  rank_item INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Stock_tracking table
CREATE TABLE IF NOT EXISTS stock_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  part_reference TEXT,
  quantity INTEGER DEFAULT 0,
  unit_selling_price DECIMAL(10, 2),
  unit_purchase_price DECIMAL(10, 2),
  product_link TEXT,
  product_description TEXT,
  category product_category,
  minimum_quantity_to_order INTEGER DEFAULT 5,
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for order history
CREATE TABLE IF NOT EXISTS stock_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id UUID REFERENCES stock_tracking(id),
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  order_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_tracking_name ON stock_tracking(name);
CREATE INDEX IF NOT EXISTS idx_stock_tracking_category ON stock_tracking(category);
CREATE INDEX IF NOT EXISTS idx_stock_tracking_supplier_id ON stock_tracking(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
