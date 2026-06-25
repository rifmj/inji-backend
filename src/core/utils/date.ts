// The current instant.
//
// A Date is a timezone-independent epoch value, so `new Date()` already *is*
// the correct UTC instant — Prisma/Postgres persist it as UTC regardless of the
// host timezone. Do NOT reintroduce a `setHours(... getTimezoneOffset())` shift:
// that mutates the epoch by the server's offset, returning an instant that is
// hours off on any non-UTC host (and only correct by accident on a UTC server).
// See date.spec.ts for the regression guard.
export function getNowUtcDate(): Date {
  return new Date();
}
