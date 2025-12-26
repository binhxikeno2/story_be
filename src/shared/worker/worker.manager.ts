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
     * Start a job with a specific worker
     */
    async startJob(workerName: string, id: number): Promise<void> {
        const worker = this.getWorker(workerName);

        if (!worker) {
            throw new Error(`Worker "${workerName}" not found`);
        }

        await worker.start(id);
    }

    /**
     * Check if a job is running in a specific worker
     */
    isJobRunning(workerName: string, id: number): boolean {
        const worker = this.getWorker(workerName);

        if (!worker) {
            return false;
        }

        return worker.isRunning(id);
    }
}

