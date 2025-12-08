export function getNowUtcDate(): Date {
  const now = new Date();
  now.setHours(now.getHours() + now.getTimezoneOffset() / 60);

  return now;
}
