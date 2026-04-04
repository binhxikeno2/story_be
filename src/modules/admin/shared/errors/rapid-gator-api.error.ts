export class RapidGatorApiError extends Error {
  constructor(public readonly statusCode: number, message?: string) {
    super(message ?? `RapidGator API status ${statusCode}`);
    this.name = 'RapidGatorApiError';
  }
}
