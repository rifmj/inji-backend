import { customAlphabet } from 'nanoid';

// Short, single-use handshake code sent over WhatsApp/Telegram to bind a phone
// to a pending auth request. The alphabet omits visually ambiguous characters
// (no 0/O, 1/I) so the code reads cleanly inside the WhatsApp message. With 32
// symbols and length 8 that is 32^8 ≈ 1.1e12 combinations — ample for a code
// that is single-use and expires in ~10 minutes.
export const AUTH_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const AUTH_CODE_LENGTH = 8;

export const generateAuthCode = customAlphabet(
  AUTH_CODE_ALPHABET,
  AUTH_CODE_LENGTH,
);

// Matches the code anywhere inside a free-form message (e.g. "… Код: ABC23456"),
// so the client can send a human-readable sentence rather than the bare code.
// Built from the alphabet/length above so the two never drift apart. None of the
// alphabet characters are special inside a regex character class.
export const AUTH_CODE_RE = new RegExp(
  `[${AUTH_CODE_ALPHABET}]{${AUTH_CODE_LENGTH}}`,
);
