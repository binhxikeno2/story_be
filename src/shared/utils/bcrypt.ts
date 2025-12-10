import * as bcrypt from 'bcrypt';
import { LengthConfig } from 'shared/constants/app.constant';

export const hashBcrypt = async (data: string, length?: number): Promise<string> => {
  if (!data) {
    return '';
  }

  return await bcrypt.hash(data, length || LengthConfig.hash);
};

export const checkHash = async (data: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(data, hash);
};
