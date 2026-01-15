/**
 * Health Check Controller
 * 
 * Provides endpoints to monitor application and database health
 * including connection pool statistics
 */
import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  /**
   * Basic health check endpoint
   * Tests database connectivity and returns connection pool stats
   */
  @Get()
  async check() {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      // Test database connection
      const startTime = Date.now();
      await queryRunner.query('SELECT 1');
      const dbLatency = Date.now() - startTime;
      
      // Get connection pool statistics
      const pool = (this.dataSource.driver as any).master;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: true,
          latency: `${dbLatency}ms`,
          pool: {
            total: pool?.totalCount || 0,
            idle: pool?.idleCount || 0,
            waiting: pool?.waitingCount || 0,
          },
        },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Database metrics endpoint
   * Returns counts of various entities
   */
  @Get('metrics')
  async metrics() {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          (SELECT count(*) FROM users) as total_users,
          (SELECT count(*) FROM products) as total_products,
          (SELECT count(*) FROM orders) as total_orders,
          (SELECT count(*) FROM orders WHERE status = 'PAID') as paid_orders,
          (SELECT count(*) FROM orders WHERE status = 'PENDING') as pending_orders,
          (SELECT count(*) FROM orders WHERE status = 'FAILED') as failed_orders
      `);
      
      return {
        timestamp: new Date().toISOString(),
        ...result[0],
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Database performance metrics
   * Shows query performance and index usage
   */
  @Get('db-performance')
  async dbPerformance() {
    try {
      // Get table sizes
      const tableSizes = await this.dataSource.query(`
        SELECT 
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `);

      // Get index usage statistics
      const indexUsage = await this.dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 10;
      `);

      // Get cache hit ratio
      const cacheHitRatio = await this.dataSource.query(`
        SELECT 
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          CASE 
            WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 0
            ELSE round(sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))::numeric * 100, 2)
          END as cache_hit_ratio_percent
        FROM pg_statio_user_tables;
      `);

      return {
        timestamp: new Date().toISOString(),
        tableSizes,
        indexUsage,
        cacheHitRatio: cacheHitRatio[0],
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
