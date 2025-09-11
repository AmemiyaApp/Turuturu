-- TuruTuru App Production Database Setup
-- Execute these commands in Supabase SQL Editor after deployment

-- 1. Enable Row Level Security on all tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MusicFile" ENABLE ROW LEVEL SECURITY;

-- 2. Profile table policies
CREATE POLICY "Users can read own profile" ON "Profile"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "Profile"
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON "Profile"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Profile" 
      WHERE id = auth.uid() 
      AND "isAdmin" = true
    )
  );

CREATE POLICY "Admins can update all profiles" ON "Profile"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Profile" 
      WHERE id = auth.uid() 
      AND "isAdmin" = true
    )
  );

-- 3. Order table policies
CREATE POLICY "Users can read own orders" ON "Order"
  FOR SELECT USING (auth.uid() = "customerId");

CREATE POLICY "Users can create own orders" ON "Order"
  FOR INSERT WITH CHECK (auth.uid() = "customerId");

CREATE POLICY "Admins can read all orders" ON "Order"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Profile" 
      WHERE id = auth.uid() 
      AND "isAdmin" = true
    )
  );

CREATE POLICY "Admins can update all orders" ON "Order"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Profile" 
      WHERE id = auth.uid() 
      AND "isAdmin" = true
    )
  );

-- 4. MusicFile table policies
CREATE POLICY "Users can read own music files" ON "MusicFile"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Order" 
      WHERE id = "MusicFile"."orderId" 
      AND "customerId" = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all music files" ON "MusicFile"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Profile" 
      WHERE id = auth.uid() 
      AND "isAdmin" = true
    )
  );

-- 5. Create essential indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_status 
ON "Order"("customerId", status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at 
ON "Order"("createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status 
ON "Order"("paymentStatus");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_musicfiles_order 
ON "MusicFile"("orderId");

-- 6. Insert your admin user (REPLACE WITH YOUR ACTUAL DATA)
-- Get your user ID from auth.users table first
INSERT INTO "Profile" (id, email, name, "isAdmin", credits)
VALUES (
  'YOUR_USER_UUID_FROM_AUTH_USERS',  -- Replace with actual UUID
  'admin@yourdomain.com',            -- Replace with your admin email
  'Admin User',                      -- Replace with admin name
  true,
  0
) ON CONFLICT (id) DO UPDATE SET 
  "isAdmin" = true,
  email = EXCLUDED.email,
  name = EXCLUDED.name;

-- 7. Create a function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."Profile" (id, email, name, "isAdmin", credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    false,
    0  -- Start with 0 credits
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. Create function to clean up old pending orders (run via cron)
CREATE OR REPLACE FUNCTION public.cleanup_pending_orders()
RETURNS void AS $$
BEGIN
  -- Cancel orders that have been pending payment for more than 24 hours
  UPDATE "Order" 
  SET status = 'CANCELED', 
      "updatedAt" = NOW()
  WHERE status = 'AWAITING_PAYMENT' 
    AND "paymentStatus" = 'PENDING'
    AND "createdAt" < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Enable real-time subscriptions for the admin dashboard
-- (Optional: Only if you want real-time updates)
ALTER PUBLICATION supabase_realtime ADD TABLE "Order";
ALTER PUBLICATION supabase_realtime ADD TABLE "MusicFile";

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- End of setup script
-- Remember to:
-- 1. Replace 'YOUR_USER_UUID_FROM_AUTH_USERS' with your actual admin user UUID
-- 2. Replace 'admin@yourdomain.com' with your actual admin email
-- 3. Test all policies with different user roles