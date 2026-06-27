// Canonical phone identity subject.
//
// Every auth path that ends in resolveUserByIdentity('phone', subject) — SMS
// register, the Telegram contact share, the WhatsApp chatId, and the flash-call
// — MUST funnel its phone through here. If two flows derive a slightly different
// subject for the same person (e.g. "77001234567" vs "7001234567", or a raw
// WhatsApp "<id>@lid"), findUserByIdentity() misses and a brand-new duplicate
// User (with a fresh random Saleor email) is minted on every login.
//
// The canonical form is the Kazakhstan national 10-digit number: the country
// code (leading 7 or 8) is stripped and only a plausible 10-digit number is
// accepted. Anything else returns null so a LID / group id / "status@broadcast"
// never becomes a bogus identity subject. The client collects phones as 10
// digits already, so existing AuthIdentity rows match this output unchanged.
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  let national = digits;
  if (national.length === 11 && (national[0] === '7' || national[0] === '8')) {
    national = national.slice(1);
  }
  if (national.length !== 10) return null;
  return national;
}

// Extracts a phone from a WhatsApp/Green API chatId, but ONLY for direct user
// chats ("<phone>@c.us"). Group chats ("@g.us"), the privacy LID addressing
// ("@lid") and "status@broadcast" carry no usable phone, so we return null and
// the caller skips them instead of writing a junk number for the auth hash.
export function phoneFromWhatsappChatId(chatId?: string | null): string | null {
  if (!chatId || !chatId.endsWith('@c.us')) return null;
  return normalizePhone(chatId.slice(0, -'@c.us'.length));
}
