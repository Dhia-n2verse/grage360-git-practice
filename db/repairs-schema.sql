-- Create repairs table
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  diagnostics_id UUID REFERENCES diagnostics(id),
  technician_specialty_id UUID REFERENCES technician_specialties(id),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'InProgress', 'Pending', 'Completed', 'Cancelled')) DEFAULT 'Scheduled',
  description TEXT,
  notes TEXT,
  labor_cost DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  notify_customer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create repair_items table for tracking parts used in repairs
CREATE TABLE IF NOT EXISTS repair_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE NOT NULL,
  stock_item_id UUID REFERENCES stock_tracking(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_repairs_vehicle_id ON repairs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repairs_customer_id ON repairs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairs_diagnostics_id ON repairs(diagnostics_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician_specialty_id ON repairs(technician_specialty_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repair_items_repair_id ON repair_items(repair_id);

-- Create function to update total_cost when repair_items are added/updated/deleted
CREATE OR REPLACE FUNCTION update_repair_total_cost()
RETURNS TRIGGER AS $$
DECLARE
  repair_labor_cost DECIMAL(10, 2);
  parts_total DECIMAL(10, 2);
BEGIN
  -- Get the labor cost for the repair
  SELECT labor_cost INTO repair_labor_cost FROM repairs WHERE id = NEW.repair_id;
  
  -- Calculate the total cost of all parts
  SELECT COALESCE(SUM(total_price), 0) INTO parts_total FROM repair_items WHERE repair_id = NEW.repair_id;
  
  -- Update the total cost in the repairs table
  UPDATE repairs SET 
    total_cost = repair_labor_cost + parts_total,
    updated_at = NOW()
  WHERE id = NEW.repair_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update total_cost
CREATE TRIGGER update_repair_cost_after_item_insert
AFTER INSERT ON repair_items
FOR EACH ROW
EXECUTE FUNCTION update_repair_total_cost();

CREATE TRIGGER update_repair_cost_after_item_update
AFTER UPDATE ON repair_items
FOR EACH ROW
EXECUTE FUNCTION update_repair_total_cost();

CREATE TRIGGER update_repair_cost_after_item_delete
AFTER DELETE ON repair_items
FOR EACH ROW
EXECUTE FUNCTION update_repair_total_cost();

-- Create function to update notify_customer when progress reaches 100%
CREATE OR REPLACE FUNCTION update_notify_customer_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.progress = 100 AND OLD.progress < 100 THEN
    NEW.notify_customer := TRUE;
    NEW.status := 'Completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update notify_customer
CREATE TRIGGER update_notify_customer_trigger
BEFORE UPDATE ON repairs
FOR EACH ROW
EXECUTE FUNCTION update_notify_customer_on_completion();

-- Create function to update status based on progress changes
CREATE OR REPLACE FUNCTION update_status_based_on_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update status if it's not being explicitly set in the same update
  IF OLD.status = NEW.status THEN
    IF NEW.progress = 0 THEN
      NEW.status := 'Scheduled';
    ELSIF NEW.progress > 0 AND NEW.progress < 100 THEN
      NEW.status := 'InProgress';
    ELSIF NEW.progress = 100 THEN
      NEW.status := 'Completed';
    END IF;
  END IF;
  
  -- If status is set to Completed, ensure progress is 100%
  IF NEW.status = 'Completed' AND NEW.progress < 100 THEN
    NEW.progress := 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update status based on progress
CREATE TRIGGER update_status_trigger
BEFORE UPDATE ON repairs
FOR EACH ROW
EXECUTE FUNCTION update_status_based_on_progress();
