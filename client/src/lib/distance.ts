// Distance calculation utilities for delivery fee estimation

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryZone {
  id: number;
  name: string;
  minDistance: string;
  maxDistance: string;
  baseFee: string;
  perKmRate: string;
  isActive: boolean;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery fee based on distance and delivery zones
 */
export function calculateDeliveryFee(
  distance: number,
  deliveryZones: DeliveryZone[]
): { fee: number; zone: DeliveryZone | null } {
  // Find the appropriate zone for this distance
  const applicableZone = deliveryZones
    .filter(zone => zone.isActive)
    .find(zone => {
      const minDist = parseFloat(zone.minDistance);
      const maxDist = parseFloat(zone.maxDistance);
      return distance >= minDist && distance <= maxDist;
    });

  if (!applicableZone) {
    // Default fee if no zone found (fallback to furthest zone)
    const furthestZone = deliveryZones
      .filter(zone => zone.isActive)
      .sort((a, b) => parseFloat(b.maxDistance) - parseFloat(a.maxDistance))[0];
    
    if (furthestZone) {
      const baseFee = parseFloat(furthestZone.baseFee);
      const perKmRate = parseFloat(furthestZone.perKmRate);
      const fee = baseFee + (distance * perKmRate);
      return { fee: Math.round(fee * 100) / 100, zone: furthestZone };
    }
    
    return { fee: 100, zone: null }; // Default fallback fee
  }

  const baseFee = parseFloat(applicableZone.baseFee);
  const perKmRate = parseFloat(applicableZone.perKmRate);
  const fee = baseFee + (distance * perKmRate);

  return { fee: Math.round(fee * 100) / 100, zone: applicableZone };
}

/**
 * Parse address to coordinates (mock implementation)
 * In a real app, this would use a geocoding service like Google Maps API
 */
export async function getCoordinatesFromAddress(address: string): Promise<Coordinates | null> {
  // Mock coordinates for Siraha, Nepal area
  const mockCoordinates: Record<string, Coordinates> = {
    'siraha': { latitude: 26.6618, longitude: 86.2025 },
    'janakpur': { latitude: 26.7288, longitude: 85.9248 },
    'birgunj': { latitude: 27.0104, longitude: 84.8804 },
    'kathmandu': { latitude: 27.7172, longitude: 85.3240 },
    'pokhara': { latitude: 28.2096, longitude: 83.9856 },
    'chitwan': { latitude: 27.5291, longitude: 84.3542 },
    'dharan': { latitude: 26.8104, longitude: 87.2847 },
    'hetauda': { latitude: 27.4287, longitude: 85.0327 },
  };

  const normalizedAddress = address.toLowerCase();
  
  // Find matching city
  for (const [city, coords] of Object.entries(mockCoordinates)) {
    if (normalizedAddress.includes(city)) {
      return coords;
    }
  }

  // Default to Siraha if no match found
  return mockCoordinates.siraha;
}

/**
 * Estimate delivery time based on distance
 * Returns estimated time in minutes
 */
export function estimateDeliveryTime(distance: number): number {
  // Base time: 30 minutes
  // Additional time: 10 minutes per km
  const baseTime = 30;
  const timePerKm = 10;
  
  return Math.round(baseTime + (distance * timePerKm));
}