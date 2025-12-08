export function isLocal(): boolean {
  return process.env.ENV === 'local';
}

export function isProd(): boolean {
  return process.env.ENV === 'prod';
}

export function isTest(): boolean {
  return process.env.ENV === 'test';
}
