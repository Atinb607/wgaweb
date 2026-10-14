import { isDeliverablePincode, DEFAULT_AVAILABLE_DELIVERY_PINCODES } from './delivery';

/**
 * Delivery serviceable pincodes.
 * Configured for the client's 47 selected deliverable postal codes.
 */
export function isServiceable(pincode: string, availableSet?: Set<string> | string[]): boolean {
  if (!pincode || typeof pincode !== 'string') return false;
  return isDeliverablePincode(pincode, availableSet || DEFAULT_AVAILABLE_DELIVERY_PINCODES);
}

export const SERVICEABLE_PINCODES = {
  has: (pincode: string, availableSet?: Set<string> | string[]) => isServiceable(pincode, availableSet),
};
