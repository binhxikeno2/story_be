import { randomInt } from 'crypto';

export async function randomDelay(options: {
    min: number;
    max: number;
    skipLast?: boolean;
}): Promise<void> {
    if (options.skipLast) {
        return;
    }

    const delayMs = randomInt(options.min, options.max + 1);

    return new Promise((resolve) => setTimeout(resolve, delayMs));
}

