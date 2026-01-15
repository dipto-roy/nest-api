/**
 * Decorator to skip rate limiting for specific routes
 * 
 * Usage:
 * @SkipThrottle()           // Skip for all request methods
 * @SkipThrottle({ default: false })  // Apply rate limiting
 */
import { SkipThrottle } from '@nestjs/throttler';

export { SkipThrottle };
