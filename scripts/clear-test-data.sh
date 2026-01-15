#!/bin/bash

# Clear Test Data Script
# WARNING: This will delete ALL data from the database!

echo "⚠️  WARNING: This will delete ALL data from the database!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo ""
echo "🗑️  Clearing test data..."

sudo -u postgres psql -d nest_api_db << EOF
-- Delete all data in reverse dependency order
DELETE FROM orders;
DELETE FROM products;
DELETE FROM users;

-- Reset sequences if any
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Vacuum to reclaim space
VACUUM ANALYZE orders;
VACUUM ANALYZE products;
VACUUM ANALYZE users;

-- Show final counts
SELECT 'Users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Products', count(*) FROM products
UNION ALL
SELECT 'Orders', count(*) FROM orders;
EOF

echo ""
echo "✅ Test data cleared successfully!"
echo ""
echo "💡 To repopulate with large dataset:"
echo "   npm run populate-data"
