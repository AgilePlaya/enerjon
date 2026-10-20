import { CurrencySymbol, DistanceUnit, FuelUnit } from '../types';

export const DEFAULT_CURRENCY: CurrencySymbol = '₹';
export const DEFAULT_DISTANCE_UNIT: DistanceUnit = 'km';
export const DEFAULT_FUEL_UNIT: FuelUnit = 'liters';

/**
 * Format a number into Indian currency style (e.g. ₹12,450.00 or ₹1,20,000.00)
 */
export function formatCurrency(amount: number, symbol: CurrencySymbol = DEFAULT_CURRENCY): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0.00`;
  }
  
  // Format with standard decimals
  const fixed = Math.abs(amount).toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Indian numbering grouping: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formattedInteger}.${decimalPart}`;
}

/**
 * Format distance in km or mi
 */
export function formatDistance(distance: number, unit: DistanceUnit = DEFAULT_DISTANCE_UNIT): string {
  if (isNaN(distance) || distance === null || distance === undefined) {
    return `0 ${unit}`;
  }
  const formatted = Math.round(distance).toLocaleString('en-IN');
  return `${formatted} ${unit}`;
}

/**
 * Format fuel volume in Liters or Gallons
 */
export function formatVolume(volume: number, unit: FuelUnit = DEFAULT_FUEL_UNIT): string {
  if (isNaN(volume) || volume === null || volume === undefined) {
    return `0.00 ${unit === 'liters' ? 'L' : 'Gal'}`;
  }
  const unitLabel = unit === 'liters' ? 'L' : 'Gal';
  return `${volume.toFixed(2)} ${unitLabel}`;
}

/**
 * Format efficiency metric (km/L or MPG)
 */
export function formatEfficiency(efficiency: number, distanceUnit: DistanceUnit = DEFAULT_DISTANCE_UNIT): string {
  if (isNaN(efficiency) || efficiency === null || efficiency === undefined || efficiency <= 0) {
    return distanceUnit === 'km' ? '-- km/L' : '-- MPG';
  }
  const label = distanceUnit === 'km' ? 'km/L' : 'MPG';
  return `${efficiency.toFixed(1)} ${label}`;
}

/**
 * Unit Conversion Helpers
 */
export const KM_PER_MILE = 1.60934;
export const LITERS_PER_GALLON = 3.78541;

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

export function milesToKm(miles: number): number {
  return miles * KM_PER_MILE;
}

export function litersToGallons(liters: number): number {
  return liters / LITERS_PER_GALLON;
}

export function gallonsToLiters(gallons: number): number {
  return gallons * LITERS_PER_GALLON;
}

export function kmPerLToMpg(kmPerL: number): number {
  // 1 km/L = 2.35214583 MPG (US)
  return kmPerL * 2.35215;
}

export function mpgToKmPerL(mpg: number): number {
  return mpg / 2.35215;
}

