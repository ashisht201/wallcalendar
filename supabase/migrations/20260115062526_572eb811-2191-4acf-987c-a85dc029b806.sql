-- Create table for display sessions (access codes)
CREATE TABLE public.display_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_code TEXT NOT NULL UNIQUE,
    name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Create table for storing Google refresh tokens
CREATE TABLE public.google_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    refresh_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.display_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for display_sessions
CREATE POLICY "Users can view their own display sessions"
ON public.display_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own display sessions"
ON public.display_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own display sessions"
ON public.display_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own display sessions"
ON public.display_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for google_tokens
CREATE POLICY "Users can view their own tokens"
ON public.google_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
ON public.google_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON public.google_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role policy for edge function access (using service role key)
-- Edge functions use service role to access tokens for display mode

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_google_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_google_tokens_updated_at
BEFORE UPDATE ON public.google_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_google_tokens_updated_at();

-- Create index on access_code for fast lookups
CREATE INDEX idx_display_sessions_access_code ON public.display_sessions(access_code);
CREATE INDEX idx_display_sessions_user_id ON public.display_sessions(user_id);