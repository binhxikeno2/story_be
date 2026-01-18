import { Injectable, OnModuleInit } from '@nestjs/common';
import { logger } from 'shared/logger/app.logger';

import { IWorker } from './worker.interface';

/**
 * Manager service to register and manage multiple workers
 */
@Injectable()
export class WorkerManager implements OnModuleInit {
  private workers = new Map<string, IWorker>();

  onModuleInit() {
    logger.info(`[WorkerManager] Initialized with ${this.workers.size} workers`);
  }

  /**
   * Register a worker
   */
  register(worker: IWorker): void {
    const name = worker.getName();

    if (this.workers.has(name)) {
      logger.warn(`[WorkerManager] Worker "${name}" is already registered, replacing...`);
    }

    this.workers.set(name, worker);
    logger.info(`[WorkerManager] Registered worker: ${name}`);
  }

  /**
   * Get a worker by name
   */
  getWorker(name: string): IWorker | undefined {
    return this.workers.get(name);
  }

  /**
   * Get all registered worker names
   */
  getWorkerNames(): string[] {
    return Array.from(this.workers.keys());
  }

  /**
   * Start a job by worker name
   */
  async startJob(workerName: string): Promise<void> {
    const worker = this.getWorker(workerName);

    if (!worker) {
      throw new Error(`Worker "${workerName}" not found`);
    }

    // Check if worker is already running
    if (worker.isRunning()) {
      logger.warn(`[WorkerManager] Worker "${workerName}" is already running, skipping...`);

      return;
    }

    await worker.start();
    logger.info(`[WorkerManager] Started job for worker "${workerName}"`);
  }

  /**
   * Check if worker is currently running
   */
  isWorkerRunning(workerName: string): boolean {
    const worker = this.getWorker(workerName);

    if (!worker) {
      return false;
    }

    return worker.isRunning();
  }
}
