export function generateUniqueFileName(prefix = '', extension?: string): string {
  const timestamp = Date.now();
  const randomId1 = Math.random().toString(36).substring(2, 15);
  const randomId2 = Math.random().toString(36).substring(2, 15);

  const uniqueId = `${timestamp}-${randomId1}${randomId2}`;
  const result = prefix ? `${prefix}-${uniqueId}` : uniqueId;

  if (extension) {
    return `${result}${extension}`;
  }

  return result;
}
