import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';

const privateKey = fs.readFileSync(path.resolve(__dirname, '../../ ../../../configs/shaKey/private.key'));

console.log(path.resolve(__dirname, '../../ ../../../configs/shaKey/private.key'));

export const signData = <T extends object>(payload: T, expiresIn?: string): string => {
  return jwt.sign(payload, privateKey, {
    expiresIn: expiresIn || '1h',
    algorithm: 'RS256',
  });
};

export const verifyData = <T>(token: string): T => {
  return jwt.verify(token, privateKey, { algorithms: ['RS256'] }) as T;
};
