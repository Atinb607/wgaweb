/**
 * Warehouse and Delivery Calculation Service
 *
 * Automated checkout delivery is available in:
 *   - Chandigarh
 *   - Panchkula
 *   - Mohali
 * (Selecting "Others" directs the customer to request delivery via WhatsApp.)
 *
 * Eligible Free Delivery Pincodes (managed in Admin -> Free Delivery Pincodes):
 *   - 140306: Mohali Sectors 81, 82, 83, Manauli, Aerocity area
 *   - 160062: Chandigarh Sectors 61, 62, 65, 67 / Mohali-side areas
 *   - 160071: Mohali Sector 71
 *   - 160059: Chandigarh Sectors 59, 60
 *   - 160055: Chandigarh/Mohali-side Sectors 55, 56 and Balongi area
 *
 * Rules:
 *   1. Pincodes in the active Free Delivery Pincodes list get FREE Delivery (₹0) on all orders.
 *   2. Any other pincode in Chandigarh, Panchkula, or Mohali:
 *      - If order subtotal is below ₹500 -> Fixed ₹69 delivery fee.
 *      - If order subtotal is ₹500 or above -> FREE Delivery (₹0).
 */

export const WAREHOUSE_CONFIG = {
  pincode: '140306',
  city: 'Mohali',
  name: 'Wild About Greens Urban Farm Warehouse',
  freeThresholdPaise: 50000, // ₹500.00
  standardFeePaise: 6900, // ₹69.00
} as const;

export const DELIVERABLE_CITIES = ['Chandigarh', 'Panchkula', 'Mohali'] as const;
export const CHECKOUT_CITY_OPTIONS = ['Chandigarh', 'Panchkula', 'Mohali', 'Others'] as const;
export type DeliverableCity = (typeof DELIVERABLE_CITIES)[number];
export type CheckoutCitySelection = DeliverableCity | 'Others' | '';

export function isDeliverableCity(city: string | undefined | null): boolean {
  if (!city || typeof city !== 'string') return false;
  const normalized = city.trim().toLowerCase();
  return (
    normalized === 'chandigarh' ||
    normalized === 'panchkula' ||
    normalized === 'mohali'
  );
}

/**
 * Default PIN codes eligible for Free Delivery on all order amounts.
 */
export const FREE_DELIVERY_PINCODES = new Set<string>([
  '140306', // Mohali Sectors 81, 82, 83, Manauli, Aerocity
  '160062', // Chandigarh Sectors 61, 62, 65, 67 / Mohali-side
  '160071', // Mohali Sector 71
  '160059', // Chandigarh Sectors 59, 60
  '160055', // Chandigarh/Mohali-side Sectors 55, 56 and Balongi
]);

export interface DeliveryCalculation {
  deliveryFeePaise: number;
  isFreeDelivery: boolean;
  isUnder4Km: boolean;
  distanceKm: number | null;
  reason: 'warehouse_local' | 'order_threshold' | 'standard_fee' | 'invalid_pincode';
  message: string;
  freeDeliveryThresholdRemainingPaise: number;
}

/**
 * Calculates delivery fee based on customer pincode and order subtotal.
 */
export function calculateDeliveryFee(
  pincode: string | undefined | null,
  subtotalPaise: number,
  eligibleFreePincodes?: Set<string> | string[]
): DeliveryCalculation {
  const cleanPin = pincode ? pincode.trim() : '';
  const safeSubtotal = Math.max(0, Number(subtotalPaise) || 0);
  const eligibleSet =
    eligibleFreePincodes instanceof Set
      ? eligibleFreePincodes
      : Array.isArray(eligibleFreePincodes)
      ? new Set(eligibleFreePincodes)
      : FREE_DELIVERY_PINCODES;

  // If pincode is incomplete / not yet 6 digits
  if (!/^\d{6}$/.test(cleanPin)) {
    const isFree = safeSubtotal >= WAREHOUSE_CONFIG.freeThresholdPaise;
    return {
      deliveryFeePaise: isFree ? 0 : WAREHOUSE_CONFIG.standardFeePaise,
      isFreeDelivery: isFree,
      isUnder4Km: false,
      distanceKm: null,
      reason: isFree ? 'order_threshold' : 'invalid_pincode',
      message: isFree
        ? 'Free Delivery! Order qualifies for free delivery (₹500+).'
        : 'Enter your 6-digit delivery pincode to calculate delivery charges.',
      freeDeliveryThresholdRemainingPaise: Math.max(
        0,
        WAREHOUSE_CONFIG.freeThresholdPaise - safeSubtotal
      ),
    };
  }

  // Check if pincode is one of the eligible free delivery pincodes
  const isEligibleFreePincode = eligibleSet.has(cleanPin);

  // Rule 1: Eligible Free Pincode -> FREE Delivery regardless of order price
  if (isEligibleFreePincode) {
    return {
      deliveryFeePaise: 0,
      isFreeDelivery: true,
      isUnder4Km: true,
      distanceKm: null,
      reason: 'warehouse_local',
      message: 'Free Delivery! Your address qualifies for complimentary local farm delivery.',
      freeDeliveryThresholdRemainingPaise: 0,
    };
  }

  // Rule 2: Outside free-delivery pincodes, but order subtotal is ₹500 or above -> FREE Delivery
  if (safeSubtotal >= WAREHOUSE_CONFIG.freeThresholdPaise) {
    return {
      deliveryFeePaise: 0,
      isFreeDelivery: true,
      isUnder4Km: false,
      distanceKm: null,
      reason: 'order_threshold',
      message: 'Free Delivery! Your order is ₹500 or above.',
      freeDeliveryThresholdRemainingPaise: 0,
    };
  }

  // Rule 3: Outside free-delivery pincodes and order subtotal is below ₹500 -> ₹69 delivery fee
  const remainingPaise = WAREHOUSE_CONFIG.freeThresholdPaise - safeSubtotal;
  return {
    deliveryFeePaise: WAREHOUSE_CONFIG.standardFeePaise,
    isFreeDelivery: false,
    isUnder4Km: false,
    distanceKm: null,
    reason: 'standard_fee',
    message: `Delivery Fee: ₹69. Add ₹${Math.ceil(remainingPaise / 100)} more for FREE delivery!`,
    freeDeliveryThresholdRemainingPaise: remainingPaise,
  };
}
