-- Create diagnostics table
CREATE TABLE IF NOT EXISTS public.diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  system_checks TEXT[] NOT NULL,
  error_codes JSONB NOT NULL DEFAULT '[]',
  observation TEXT,
  recommendation TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_diagnostics_customer_id ON public.diagnostics(customer_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_vehicle_id ON public.diagnostics(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_created_at ON public.diagnostics(created_at);
CREATE INDEX IF NOT EXISTS idx_diagnostics_status ON public.diagnostics(status);

-- Add RLS policies for diagnostics table
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view diagnostics
CREATE POLICY "Users can view diagnostics"
  ON public.diagnostics
  FOR SELECT
  USING (true);

-- Policy to allow users to insert diagnostics
CREATE POLICY "Users can create diagnostics"
  ON public.diagnostics
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow users to update diagnostics
CREATE POLICY "Users can update diagnostics"
  ON public.diagnostics
  FOR UPDATE
  USING (true);

-- Policy to allow users to delete diagnostics
CREATE POLICY "Users can delete diagnostics"
  ON public.diagnostics
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'Manager'
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on diagnostics
CREATE TRIGGER update_diagnostics_updated_at
BEFORE UPDATE ON public.diagnostics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
