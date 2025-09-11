# TuruTuru App - MVP Deployment Guide

## Quick Start Production Deployment

This guide helps you deploy the TuruTuru App MVP to production using Vercel.

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Set up at [supabase.com](https://supabase.com)
3. **Stripe Account**: Configure at [stripe.com](https://stripe.com)
4. **SMTP Email**: Gmail app password or other email provider

### Step 1: Environment Variables Setup

1. Copy `.env.production.template` to `.env.production`
2. Fill in all required values:

```bash
# Production Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Live Keys (CRITICAL: Use live keys for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URLs
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your_secure_32_char_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@yourdomain.com
SMTP_PASS=your_app_password

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

### Step 2: Database Setup

Run database migrations:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

### Step 3: Vercel Deployment

#### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
# ... add all required env vars
```

#### Option B: GitHub Integration

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Step 4: Critical Post-Deployment Setup

#### Configure Stripe Webhooks

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

#### Set Up Supabase Row Level Security (RLS)

Execute these SQL commands in Supabase SQL editor:

```sql
-- Enable RLS on all tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MusicFile" ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can read own profile" ON "Profile"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "Profile"
  FOR UPDATE USING (auth.uid() = id);

-- Order policies
CREATE POLICY "Users can read own orders" ON "Order"
  FOR SELECT USING (auth.uid() = "customerId");

CREATE POLICY "Users can create own orders" ON "Order"
  FOR INSERT WITH CHECK (auth.uid() = "customerId");

-- Admin policies (replace with actual admin email)
CREATE POLICY "Admins can read all orders" ON "Order"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Profile" 
      WHERE id = auth.uid() 
      AND "isAdmin" = true
    )
  );

-- MusicFile policies
CREATE POLICY "Users can read own music files" ON "MusicFile"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Order" 
      WHERE id = "MusicFile"."orderId" 
      AND "customerId" = auth.uid()
    )
  );
```

#### Create Admin User

```sql
-- Insert admin profile (replace with your email)
INSERT INTO "Profile" (id, email, name, "isAdmin", credits)
VALUES (
  'your-admin-uuid',
  'admin@yourdomain.com',
  'Admin User',
  true,
  0
);
```

### Step 5: Production Verification Checklist

#### Basic Functionality
- [ ] User can register/login
- [ ] User can purchase credits
- [ ] User can create music orders
- [ ] Admin can view orders
- [ ] Admin can upload music files
- [ ] Email notifications work

#### Security Verification
- [ ] RLS policies are active
- [ ] Environment variables are secure
- [ ] HTTPS is enabled
- [ ] Admin routes are protected

#### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API responses < 1 second
- [ ] Image optimization working
- [ ] CDN is active

### Step 6: Monitoring Setup

#### Add Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Set Up Error Tracking

Configure Sentry (optional but recommended):

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Step 7: Domain and SSL

1. Configure custom domain in Vercel
2. Update `NEXTAUTH_URL` to your domain
3. Update Stripe webhook URL
4. Test SSL certificate

### Step 8: Backup Strategy

1. Set up automated database backups in Supabase
2. Configure file backup for uploaded music
3. Document recovery procedures

## Production Monitoring

### Key Metrics to Monitor

1. **User Registration Rate**
2. **Order Conversion Rate**
3. **Payment Success Rate**
4. **Email Delivery Rate**
5. **Admin Response Time**

### Alert Configuration

Set up alerts for:
- Payment failures > 5%
- API errors > 1%
- Database connection issues
- Email delivery failures

## Maintenance

### Regular Tasks

1. **Weekly**: Review order queue and completion rates
2. **Monthly**: Database performance optimization
3. **Quarterly**: Security audit and dependency updates

### Scaling Considerations

As you grow, consider:
1. CDN for music file delivery
2. Background job processing
3. Database read replicas
4. Advanced monitoring tools

## Support Information

### Emergency Contacts
- **Technical Issues**: [Your Support Email]
- **Payment Issues**: [Stripe Support]
- **Database Issues**: [Supabase Support]

### Documentation Links
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

**Security Note**: Never commit production environment variables to version control. Always use Vercel's environment variable management or secure secret management systems.