/**
 * Interface for worker implementations
 */
export interface IWorker {
    /**
     * Worker name/identifier
     */
    getName(): string;

    /**
     * Start processing a job with given ID
     * @param id - Job/process ID to start
     */
    start(id: number): Promise<void>;

    /**
     * Check if a job is currently running
     * @param id - Job/process ID to check
     */
    isRunning(id: number): boolean;
}

