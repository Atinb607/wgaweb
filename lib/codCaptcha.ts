import crypto from 'crypto';
import { getCodChallengeSecret, isCodEnabled } from './codConfig';

export interface ChallengePayload {
  a: number;
  b: number;
  op: '+' | '-' | '*';
  exp: number; // UNIX timestamp ms
  nonce: string;
}

export interface ChallengeResult {
  question: string;
  token: string;
}

/**
 * Generates a math captcha challenge with signed token.
 */
export function generateCodChallenge(): ChallengeResult {
  if (!isCodEnabled()) {
    throw new Error('Cash on delivery is currently disabled.');
  }

  const secret = getCodChallengeSecret();
  if (!secret) {
    throw new Error('COD_CHALLENGE_SECRET is missing.');
  }

  // Operators: addition (+), subtraction (-), multiplication (*)
  const ops: Array<'+' | '-' | '*'> = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number;
  let b: number;
  let questionDisplay: string;

  if (op === '+') {
    a = Math.floor(Math.random() * 16) + 3; // 3 to 18
    b = Math.floor(Math.random() * 14) + 2; // 2 to 15
    questionDisplay = `${a} + ${b} = ?`;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 18) + 12; // 12 to 29
    b = Math.floor(Math.random() * (a - 3)) + 1; // 1 to a-3 (positive integer answer >= 3)
    questionDisplay = `${a} - ${b} = ?`;
  } else {
    a = Math.floor(Math.random() * 8) + 2; // 2 to 9
    b = Math.floor(Math.random() * 8) + 2; // 2 to 9
    questionDisplay = `${a} × ${b} = ?`;
  }

  const exp = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  const nonce = crypto.randomBytes(8).toString('hex');

  const payload: ChallengePayload = { a, b, op, exp, nonce };
  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr, 'utf8').toString('base64url');

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadBase64);
  const sigBase64 = hmac.digest('base64url');

  const token = `${payloadBase64}.${sigBase64}`;

  return {
    question: questionDisplay,
    token,
  };
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a challenge token and checks if the supplied answer matches.
 */
export function verifyCodChallenge(
  token: string | undefined | null,
  rawAnswer: number | string | undefined | null
): VerificationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Challenge token is missing.' };
  }

  if (rawAnswer === undefined || rawAnswer === null || String(rawAnswer).trim() === '') {
    return { valid: false, error: 'Captcha answer is required.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed challenge token.' };
  }

  const [payloadBase64, providedSig] = parts;
  const secret = getCodChallengeSecret();
  if (!secret) {
    return { valid: false, error: 'Server challenge configuration error.' };
  }

  // Verify HMAC signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadBase64);
  const expectedSig = hmac.digest('base64url');

  const providedBuffer = Buffer.from(providedSig);
  const expectedBuffer = Buffer.from(expectedSig);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return { valid: false, error: 'Invalid or forged challenge token.' };
  }

  // Parse payload
  let payload: ChallengePayload;
  try {
    const jsonStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    payload = JSON.parse(jsonStr);
  } catch {
    return { valid: false, error: 'Invalid challenge payload.' };
  }

  // Check expiry
  if (!payload.exp || Date.now() > payload.exp) {
    return { valid: false, error: 'Challenge has expired. Please solve a fresh question.' };
  }

  // Compute expected answer
  let expectedAnswer: number;
  if (payload.op === '+') {
    expectedAnswer = payload.a + payload.b;
  } else if (payload.op === '-') {
    expectedAnswer = payload.a - payload.b;
  } else if (payload.op === '*') {
    expectedAnswer = payload.a * payload.b;
  } else {
    return { valid: false, error: 'Unsupported challenge operator.' };
  }

  const parsedUserAnswer = parseInt(String(rawAnswer).trim(), 10);
  if (isNaN(parsedUserAnswer) || parsedUserAnswer !== expectedAnswer) {
    return { valid: false, error: 'Incorrect answer. Please try again.' };
  }

  return { valid: true };
}
