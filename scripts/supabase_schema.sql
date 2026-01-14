-- Create the books table
CREATE TABLE public.books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    source TEXT DEFAULT 'bibliometro',
    url TEXT,
    "imageUrl" TEXT, -- Note: quoted because camelCase
    "scrapedAt" TIMESTAMPTZ DEFAULT NOW(), -- Note: quoted because camelCase
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) is recommended acting as a public catalog
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
ON public.books
FOR SELECT
TO public
USING (true);

-- Create policy to allow authenticated users (service role) to insert/update
-- This is optional if you just use the service_role key to bypass RLS, 
-- but good practice if you ever use authenticated interactions.
CREATE POLICY "Allow service role full access"
ON public.books
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
