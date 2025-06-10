/*
  # Fix user signup trigger

  1. Database Functions
    - Create or replace the `handle_new_user` function that automatically creates a profile when a new user signs up
    - This function will be triggered whenever a new user is inserted into `auth.users`

  2. Triggers
    - Create a trigger that calls `handle_new_user` on user signup
    - This ensures every new user gets a corresponding profile record

  3. Security
    - The function runs with security definer privileges to bypass RLS when creating profiles
*/

-- Create or replace the function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();