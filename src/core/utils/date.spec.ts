import { getNowUtcDate } from './date';

describe('getNowUtcDate', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('returns a Date', () => {
    expect(getNowUtcDate()).toBeInstanceOf(Date);
  });

  it('returns the current instant — within a few ms of Date.now()', () => {
    const before = Date.now();
    const got = getNowUtcDate().getTime();
    const after = Date.now();

    // The old implementation shifted the epoch by the host timezone offset,
    // landing hours outside this [before, after] bracket on any non-UTC host.
    expect(got).toBeGreaterThanOrEqual(before);
    expect(got).toBeLessThanOrEqual(after);
  });

  it('is timezone-independent: no double-shift even in a non-UTC zone', () => {
    // The previous bug — now.setHours(getHours() + getTimezoneOffset() / 60) —
    // was invisible on a UTC server (offset 0) and only surfaced off-UTC. Pin a
    // non-UTC zone (V8 re-reads process.env.TZ) so the regression is caught even
    // on a UTC CI box, where the bracket test above would pass against bad code.
    process.env.TZ = 'Asia/Almaty';
    expect(new Date().getTimezoneOffset()).not.toBe(0); // sanity: zone applied

    const drift = Math.abs(getNowUtcDate().getTime() - Date.now());
    expect(drift).toBeLessThan(1000); // old code drifted by ~5h here
  });
});
