import Razorpay from 'razorpay';

export function cleanRazorpayKey(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Resolves the Razorpay Key ID from server env (with public env fallback)
 * and warns if both are set to different values.
 */
export function getRazorpayKeyId(): string {
  const serverKey = cleanRazorpayKey(process.env.RAZORPAY_KEY_ID);
  const publicKey = cleanRazorpayKey(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

  if (serverKey && publicKey && serverKey !== publicKey) {
    console.warn(
      `[razorpay] Warning: RAZORPAY_KEY_ID (${serverKey.slice(0, 12)}...) differs from NEXT_PUBLIC_RAZORPAY_KEY_ID (${publicKey.slice(0, 12)}...). Using RAZORPAY_KEY_ID.`
    );
  }

  return serverKey || publicKey;
}

/**
 * Returns a lazily-initialised Razorpay instance.
 * Trims whitespace and quotes so pasted keys don't fail authentication.
 */
export function getRazorpay(): Razorpay {
  const keyId = getRazorpayKeyId();
  const keySecret = cleanRazorpayKey(process.env.RAZORPAY_KEY_SECRET);

  if (!keyId) {
    throw new Error('Razorpay configuration error: RAZORPAY_KEY_ID is missing or empty.');
  }
  if (!keySecret) {
    throw new Error('Razorpay configuration error: RAZORPAY_KEY_SECRET is missing or empty.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}
