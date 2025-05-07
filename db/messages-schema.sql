-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High', 'Urgent')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at);

-- Create function to archive read messages older than 3 days
CREATE OR REPLACE FUNCTION archive_read_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function doesn't actually delete or move messages
  -- It's just used to demonstrate the concept
  -- In a real application, you might set an "archived" flag or move to an archive table
  
  -- For our implementation, we'll rely on the query in the application code
  -- to filter out read messages older than 3 days from the inbox view
  
  RAISE NOTICE 'Message archiving would happen here';
END;
$$;

-- Create a scheduled job to run the archive function daily
-- Note: This requires pg_cron extension to be enabled
-- In Supabase, you would use Edge Functions with a cron trigger instead
/*
SELECT cron.schedule(
  'archive-read-messages',
  '0 0 * * *',  -- Run at midnight every day
  'SELECT archive_read_messages()'
);
*/

-- Add RLS policies for messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see messages they've sent or received
CREATE POLICY "Users can view their own messages"
  ON public.messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- Policy to allow users to insert messages they're sending
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- Policy to allow users to update messages they've received (e.g., mark as read)
CREATE POLICY "Users can update received messages"
  ON public.messages
  FOR UPDATE
  USING (
    auth.uid() = receiver_id
  );

-- Policy to allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );
