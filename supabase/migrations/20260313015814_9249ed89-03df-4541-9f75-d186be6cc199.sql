ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'Global',
ADD COLUMN IF NOT EXISTS website_url text;

UPDATE public.profiles
SET location = 'Global'
WHERE location IS NULL;