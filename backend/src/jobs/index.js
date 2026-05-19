// Background job stubs (extend with BullMQ/Inngest in production).
import { logger } from '../config/logger.js';

export function scheduleJobs() {
  logger.info('Background jobs registered (stubs).');
}
