# TuruTuru App - Personalized Children's Music Platform

🎵 A Next.js-based platform for creating personalized children's music with AI assistance and manual production workflow.

## 🚀 MVP Features Implemented

### ✅ Phase 1: Core Infrastructure
- **User Authentication**: Supabase Auth with Google OAuth and email/password
- **Database**: PostgreSQL with Prisma ORM and Row-Level Security
- **Payment Processing**: Stripe integration with webhook handling
- **Admin Dashboard**: Order management and music file upload interface
- **Environment Configuration**: Secure development and production environments
- **Deployment Setup**: Vercel deployment with automated scripts

### ✅ Phase 2: Business Logic
- **Music Order System**: Credit-based ordering with detailed prompts
- **Manual Production Workflow**: Admin tools for order processing
- **Email Notifications**: Automated customer and admin notifications
- **File Management**: Music file upload and delivery system
- **API Endpoints**: Complete REST API for all operations

### 📋 Phase 3: Optimizations (Pending)
- Performance optimizations (image optimization, caching)
- Monitoring and observability (Sentry, analytics)
- Security audit and advanced protections

## 🛠 Technology Stack

- **Frontend**: Next.js 15.5.2, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **Email**: Nodemailer
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- Stripe account
- Email provider (Gmail recommended)

### Development Setup

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd turuturu-app
npm install
```

2. **Environment configuration**:
```bash
cp .env.local.example .env.local
# Fill in your environment variables
```

3. **Database setup**:
```bash
npx prisma generate
npx prisma migrate dev
```

4. **Start development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 API Documentation

### Core Endpoints

#### Orders
- `POST /api/orders` - Create new music order
- `GET /api/orders` - List orders (user/admin)
- `PUT /api/orders/[id]` - Update order status (admin)

#### Payments
- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/webhook` - Handle Stripe webhooks

#### Music Management
- `POST /api/music/upload` - Upload completed music files (admin)

#### System
- `GET /api/health` - System health check

## 🚀 Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete production deployment instructions.

### Quick Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
npm run deploy
```

## 👥 User Roles

### Customer
- Register/login with email or Google
- Purchase credits via Stripe
- Create music orders with detailed prompts
- Track order status
- Download completed music files

### Admin
- Access admin dashboard at `/admin`
- View all orders and customer information
- Update order status (Pending → In Production → Completed)
- Upload music files for completed orders
- Monitor system health

## 🔒 Security Features

- Row-Level Security (RLS) policies in Supabase
- Secure environment variable management
- Stripe webhook signature verification
- Admin role protection
- HTTPS enforcement in production

## 📧 Email Notifications

- Order confirmation emails
- Status update notifications
- Music delivery notifications
- Admin order alerts

## 🗂 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── criar-musica/      # Music creation form
│   └── comprar-creditos/  # Credit purchase
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── landing/          # Landing page sections
│   └── layout/           # Layout components
└── lib/                  # Utilities and services
    ├── supabase/         # Supabase client
    ├── email.ts          # Email service
    ├── auth.ts           # Auth utilities
    └── utils/            # Helper functions
```

## 🔧 Development Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run deploy           # Deploy to production
npm run deploy:check     # Check deployment requirements
npm run type-check       # TypeScript type checking
```

## 📊 Database Schema

See [prisma/schema.prisma](./prisma/schema.prisma) for the complete database schema.

### Key Tables
- **Profile**: User profiles with credits and admin flags
- **Order**: Music orders with status tracking
- **MusicFile**: Completed music file metadata

## 🎯 Business Workflow

1. **Customer Registration**: User signs up via Supabase Auth
2. **Credit Purchase**: User buys credits via Stripe
3. **Music Order**: User creates order with detailed prompt
4. **Admin Processing**: Admin views order in dashboard
5. **Production**: Admin updates status to "In Production"
6. **Delivery**: Admin uploads music file, order marked complete
7. **Customer Access**: Customer receives email and can download

## 🔍 Monitoring

- Health check endpoint: `/api/health`
- Vercel Analytics integration ready
- Error logging with structured logging
- Payment success/failure tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or business inquiries:
- Email: [Your Support Email]
- Documentation: See `/docs` folder
- Issues: GitHub Issues (if applicable)

---

**Note**: This is an MVP implementation focused on rapid time-to-market. Additional features and optimizations are planned for future releases.
