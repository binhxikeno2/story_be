/**
 * Interface for worker implementations
 */
export interface IWorker {
    /**
     * Worker name/identifier
     */
    getName(): string;

    /**
     * Start processing a job
     */
    start(): Promise<void>;

    /**
     * Check if the worker is currently running
     */
    isRunning(): boolean;
}

