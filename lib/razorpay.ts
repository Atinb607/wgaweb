import Razorpay from 'razorpay';

export function cleanRazorpayKey(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Returns a lazily-initialised Razorpay instance.
 * Trims whitespace and quotes so pasted keys don't fail authentication.
 */
export function getRazorpay(): Razorpay {
  const keyId = cleanRazorpayKey(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
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
