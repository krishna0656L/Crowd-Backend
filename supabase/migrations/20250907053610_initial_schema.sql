-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_profile();
DROP POLICY IF EXISTS "Users can insert their own detection history" ON public.detection_history;
DROP POLICY IF EXISTS "Users can view their own detection history" ON public.detection_history;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone." ON public.users;
DROP TABLE IF EXISTS public.detection_history;
DROP TABLE IF EXISTS public.users;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public users are viewable by everyone.') THEN
    CREATE POLICY "Public users are viewable by everyone." 
      ON public.users FOR SELECT 
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile.') THEN
    CREATE POLICY "Users can insert their own profile." 
      ON public.users FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile.') THEN
    CREATE POLICY "Users can update own profile." 
      ON public.users FOR UPDATE 
      USING (auth.uid() = id);
  END IF;
END $$;

-- Detection history table
CREATE TABLE IF NOT EXISTS public.detection_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  people_count INTEGER NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for detection_history table
ALTER TABLE public.detection_history ENABLE ROW LEVEL SECURITY;

-- Create policies for detection_history table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own detection history') THEN
    CREATE POLICY "Users can view their own detection history" 
      ON public.detection_history FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own detection history') THEN
    CREATE POLICY "Users can insert their own detection history" 
      ON public.detection_history FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to handle new user signups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- Create a function to get the current user's profile
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS JSON AS $$
  SELECT 
    json_build_object(
      'id', id,
      'email', email,
      'name', name,
      'created_at', created_at
    )
  FROM public.users
  WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;
