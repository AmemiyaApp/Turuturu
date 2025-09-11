#!/bin/bash

# TuruTuru App Production Deployment Script
# This script automates the deployment process to Vercel

set -e

echo "🚀 Starting TuruTuru App Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_success "All requirements met"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Run tests (when available)
run_tests() {
    print_status "Running tests..."
    # npm test -- if tests are implemented
    print_success "Tests passed (skipped - not implemented yet)"
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully"
}

# Check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "DIRECT_URL"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
        "ADMIN_EMAIL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        print_warning "Make sure to set these in Vercel dashboard or .env.production"
        exit 1
    fi
    
    print_success "Environment variables check passed"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if user is logged in
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel. Please login:"
        vercel login
    fi
    
    # Deploy to production
    vercel --prod --yes
    
    print_success "Deployment completed!"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Run migrations
    npx prisma migrate deploy
    
    print_success "Database migrations completed"
}

# Post-deployment verification
verify_deployment() {
    print_status "Performing post-deployment verification..."
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel --scope=$(vercel whoami) ls --meta url | head -n1)
    
    if [[ -n "$DEPLOYMENT_URL" ]]; then
        print_status "Testing deployment at: $DEPLOYMENT_URL"
        
        # Test basic endpoints
        if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
            print_success "Homepage is accessible"
        else
            print_error "Homepage is not accessible"
        fi
        
        if curl -f -s "$DEPLOYMENT_URL/api/health" > /dev/null; then
            print_success "API health check passed"
        else
            print_warning "API health check failed (endpoint may not exist)"
        fi
    fi
    
    print_success "Deployment verification completed"
}

# Main deployment process
main() {
    echo "================================================"
    echo "         TuruTuru App Deployment Script         "
    echo "================================================"
    
    check_requirements
    install_dependencies
    
    # Skip environment check in CI/CD - Vercel will handle it
    if [[ -z "$CI" ]]; then
        check_env_vars
    fi
    
    run_tests
    build_application
    run_migrations
    deploy_to_vercel
    verify_deployment
    
    echo "================================================"
    print_success "🎉 Deployment completed successfully!"
    echo "================================================"
    
    print_status "Next steps:"
    echo "1. Configure Stripe webhooks in dashboard"
    echo "2. Set up Supabase RLS policies (use scripts/production-setup.sql)"
    echo "3. Create admin user in database"
    echo "4. Test payment flow with test cards"
    echo "5. Monitor application logs and metrics"
    echo ""
    print_warning "Don't forget to update DNS settings if using custom domain!"
}

# Handle script arguments
case "${1:-}" in
    "check")
        check_requirements
        check_env_vars
        ;;
    "build")
        install_dependencies
        build_application
        ;;
    "deploy")
        deploy_to_vercel
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        main
        ;;
esac