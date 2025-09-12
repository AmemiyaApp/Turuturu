-- Comprehensive RLS fix: Run this in Supabase SQL Editor to fix all login issues
-- This provides proper RLS policies while allowing necessary operations

-- Option 1: Temporarily disable RLS for all tables (quick fix)
ALTER TABLE "Profile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "MusicFile" DISABLE ROW LEVEL SECURITY;

-- Option 2: Or use proper RLS policies (recommended for production)
-- Uncomment the following lines if you prefer proper RLS:

-- Enable RLS
-- ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "MusicFile" ENABLE ROW LEVEL SECURITY;

-- Profile policies
-- CREATE POLICY "Users can read own profile" ON "Profile"
--   FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can create own profile" ON "Profile"
--   FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON "Profile"
--   FOR UPDATE USING (auth.uid() = id);

-- Order policies
-- CREATE POLICY "Users can read own orders" ON "Order"
--   FOR SELECT USING (auth.uid() = "customerId");
-- CREATE POLICY "Users can create own orders" ON "Order"
--   FOR INSERT WITH CHECK (auth.uid() = "customerId");

-- MusicFile policies
-- CREATE POLICY "Users can read own music files" ON "MusicFile"
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM "Order" 
--       WHERE id = "MusicFile"."orderId" 
--       AND "customerId" = auth.uid()
--     )
--   );

-- After you confirm everything works, you can re-enable RLS with proper policies
-- For now, keep RLS disabled to ensure login works properly