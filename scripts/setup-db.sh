#!/bin/bash

# Database Setup Script
# Run this script to create the PostgreSQL database and user

echo "🚀 Setting up PostgreSQL database for NestJS API..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first."
    exit 1
fi

# Default values
DB_NAME="nest_api_db"
DB_USER="postgres"

echo "📦 Creating database: $DB_NAME"

# Create database
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"

echo "✅ Database setup complete!"
echo ""
echo "📝 Update your .env file with these credentials:"
echo "DATABASE_HOST=localhost"
echo "DATABASE_PORT=5432"
echo "DATABASE_USERNAME=$DB_USER"
echo "DATABASE_PASSWORD=<your-postgres-password>"
echo "DATABASE_NAME=$DB_NAME"
echo ""
echo "🎯 Next steps:"
echo "1. Update .env file with your database credentials"
echo "2. Run: npm run start:dev"
echo "3. Test API at http://localhost:3000"
