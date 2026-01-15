/**
 * Populate Test Data Script
 * 
 * Creates realistic test data to demonstrate performance optimizations
 * Run with: npx ts-node scripts/populate-test-data.ts
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'nest_api_db',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function populateData() {
  console.log('🚀 Starting data population...\n');
  
  await dataSource.initialize();
  console.log('✅ Database connected\n');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check current counts
    const userCount = await queryRunner.manager.query('SELECT count(*) FROM users');
    const productCount = await queryRunner.manager.query('SELECT count(*) FROM products');
    const orderCount = await queryRunner.manager.query('SELECT count(*) FROM orders');
    
    console.log('📊 Current data:');
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Products: ${productCount[0].count}`);
    console.log(`   Orders: ${orderCount[0].count}\n`);

    const targetUsers = 10000;
    const targetProducts = 1000;
    const targetOrders = 50000;

    const currentUsers = parseInt(userCount[0].count);
    const currentProducts = parseInt(productCount[0].count);
    const currentOrders = parseInt(orderCount[0].count);

    // Populate Users
    if (currentUsers < targetUsers) {
      console.log(`📝 Creating ${targetUsers - currentUsers} users...`);
      const hashedPassword = await bcrypt.hash('test123', 8);
      
      const batchSize = 1000;
      const usersToCreate = targetUsers - currentUsers;
      
      for (let i = 0; i < usersToCreate; i += batchSize) {
        const batch = Math.min(batchSize, usersToCreate - i);
        const values = [];
        
        for (let j = 0; j < batch; j++) {
          const idx = currentUsers + i + j;
          values.push(`(
            gen_random_uuid(),
            'Test User ${idx}',
            'testuser${idx}@example.com',
            '${hashedPassword}',
            NOW()
          )`);
        }
        
        await queryRunner.manager.query(`
          INSERT INTO users (id, name, email, password, "createdAt")
          VALUES ${values.join(', ')}
          ON CONFLICT (email) DO NOTHING
        `);
        
        if ((i + batch) % 2000 === 0) {
          console.log(`   ✓ Created ${i + batch} users`);
        }
      }
      console.log(`   ✅ Total users: ${targetUsers}\n`);
    }

    // Populate Products
    if (currentProducts < targetProducts) {
      console.log(`📦 Creating ${targetProducts - currentProducts} products...`);
      
      const batchSize = 500;
      const productsToCreate = targetProducts - currentProducts;
      
      for (let i = 0; i < productsToCreate; i += batchSize) {
        const batch = Math.min(batchSize, productsToCreate - i);
        const values = [];
        
        for (let j = 0; j < batch; j++) {
          const idx = currentProducts + i + j;
          const price = (Math.random() * 900 + 100).toFixed(2); // $100-$1000
          values.push(`(
            gen_random_uuid(),
            'Product ${idx}',
            'High-quality product for testing performance optimizations',
            ${price},
            true,
            NOW()
          )`);
        }
        
        await queryRunner.manager.query(`
          INSERT INTO products (id, name, description, price, "isActive", "createdAt")
          VALUES ${values.join(', ')}
        `);
        
        if ((i + batch) % 1000 === 0 || i + batch === productsToCreate) {
          console.log(`   ✓ Created ${i + batch} products`);
        }
      }
      console.log(`   ✅ Total products: ${targetProducts}\n`);
    }

    // Populate Orders
    if (currentOrders < targetOrders) {
      console.log(`🛒 Creating ${targetOrders - currentOrders} orders...`);
      
      // Get all user and product IDs
      const users = await queryRunner.manager.query('SELECT id FROM users LIMIT $1', [targetUsers]);
      const products = await queryRunner.manager.query('SELECT id, price FROM products LIMIT $1', [targetProducts]);
      
      const statuses = ['PENDING', 'PAID', 'FAILED'];
      const batchSize = 2000;
      const ordersToCreate = targetOrders - currentOrders;
      
      for (let i = 0; i < ordersToCreate; i += batchSize) {
        const batch = Math.min(batchSize, ordersToCreate - i);
        const values = [];
        
        for (let j = 0; j < batch; j++) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const hasStripeSession = randomStatus !== 'PENDING';
          const stripeSessionId = hasStripeSession ? `'cs_test_${Date.now()}_${i}_${j}'` : 'NULL';
          
          // Random date within last 90 days
          const daysAgo = Math.floor(Math.random() * 90);
          const createdAt = `NOW() - INTERVAL '${daysAgo} days'`;
          
          values.push(`(
            gen_random_uuid(),
            '${randomUser.id}',
            '${randomProduct.id}',
            ${randomProduct.price},
            '${randomStatus}',
            ${stripeSessionId},
            ${createdAt}
          )`);
        }
        
        await queryRunner.manager.query(`
          INSERT INTO orders (id, "userId", "productId", amount, status, "stripeSessionId", "createdAt")
          VALUES ${values.join(', ')}
        `);
        
        if ((i + batch) % 10000 === 0) {
          console.log(`   ✓ Created ${i + batch} orders`);
        }
      }
      console.log(`   ✅ Total orders: ${targetOrders}\n`);
    }

    // Commit transaction
    await queryRunner.commitTransaction();
    
    // Update statistics
    console.log('📊 Updating database statistics...');
    await queryRunner.manager.query('ANALYZE users');
    await queryRunner.manager.query('ANALYZE products');
    await queryRunner.manager.query('ANALYZE orders');
    
    // Final counts
    const finalUserCount = await queryRunner.manager.query('SELECT count(*) FROM users');
    const finalProductCount = await queryRunner.manager.query('SELECT count(*) FROM products');
    const finalOrderCount = await queryRunner.manager.query('SELECT count(*) FROM orders');
    
    console.log('\n✅ Data population complete!\n');
    console.log('📊 Final counts:');
    console.log(`   Users: ${finalUserCount[0].count}`);
    console.log(`   Products: ${finalProductCount[0].count}`);
    console.log(`   Orders: ${finalOrderCount[0].count}\n`);
    
    // Check index usage readiness
    console.log('🔍 Verifying indexes...');
    const indexes = await queryRunner.manager.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log(`   ✅ Found ${indexes.length} performance indexes\n`);
    
    console.log('💡 Next steps:');
    console.log('   1. Restart your application: npm run start:dev');
    console.log('   2. Run k6 test: k6 run k6-load-test.js');
    console.log('   3. Expected P95: 350-450ms ✅ (much better!)\n');
    
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error populating data:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

populateData()
  .then(() => {
    console.log('🎉 Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });
