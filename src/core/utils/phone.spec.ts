import { normalizePhone, phoneFromWhatsappChatId } from './phone';

describe('normalizePhone', () => {
  it('keeps a bare 10-digit national number', () => {
    expect(normalizePhone('7001234567')).toBe('7001234567');
  });

  it('strips the leading 7 country code', () => {
    expect(normalizePhone('77001234567')).toBe('7001234567');
  });

  it('strips the leading 8 country code', () => {
    expect(normalizePhone('87001234567')).toBe('7001234567');
  });

  it('strips formatting (+, spaces, dashes, parens)', () => {
    expect(normalizePhone('+7 (700) 123-45-67')).toBe('7001234567');
  });

  it('returns null for empty / nullish input', () => {
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone('')).toBeNull();
  });

  it('returns null for a WhatsApp LID rather than guessing a number', () => {
    // Last 10 chars of a LID used to leak through .slice(-10) as a fake subject.
    expect(normalizePhone('123456789012345@lid')).toBeNull();
  });

  it('returns null for too-short or too-long numbers', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('700123456789')).toBeNull();
  });
});

describe('phoneFromWhatsappChatId', () => {
  it('extracts and normalizes a direct chat id', () => {
    expect(phoneFromWhatsappChatId('77001234567@c.us')).toBe('7001234567');
  });

  it('rejects LID / group / broadcast addresses', () => {
    expect(phoneFromWhatsappChatId('123456789012345@lid')).toBeNull();
    expect(phoneFromWhatsappChatId('120363000000000000@g.us')).toBeNull();
    expect(phoneFromWhatsappChatId('status@broadcast')).toBeNull();
  });

  it('rejects nullish input', () => {
    expect(phoneFromWhatsappChatId(undefined)).toBeNull();
    expect(phoneFromWhatsappChatId(null)).toBeNull();
  });
});
