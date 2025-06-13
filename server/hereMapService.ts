import fetch from 'node-fetch';

export interface HereRouteResponse {
  routes: Array<{
    id: string;
    sections: Array<{
      id: string;
      type: string;
      departure: {
        time: string;
        place: {
          location: {
            lat: number;
            lng: number;
          };
        };
      };
      arrival: {
        time: string;
        place: {
          location: {
            lat: number;
            lng: number;
          };
        };
      };
      summary: {
        length: number;
        duration: number;
        baseDuration: number;
      };
      polyline: string;
      transport: {
        mode: string;
      };
    }>;
  }>;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
  routeId: string;
}

export class HereMapService {
  private apiKey: string;
  private baseUrl = 'https://router.hereapi.com/v8';

  constructor() {
    if (!process.env.HERE_API_KEY) {
      throw new Error('HERE_API_KEY environment variable is required');
    }
    this.apiKey = process.env.HERE_API_KEY;
  }

  /**
   * Calculate route between two points
   */
  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    transportMode: string = 'bicycle' // bicycle for delivery partners
  ): Promise<RouteInfo> {
    try {
      const url = `${this.baseUrl}/routes`;
      const params = new URLSearchParams({
        transportMode,
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        return: 'polyline,summary',
        apikey: this.apiKey
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as HereRouteResponse;
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes found');
      }

      const route = data.routes[0];
      const section = route.sections[0];

      return {
        distance: section.summary.length,
        duration: section.summary.duration,
        polyline: section.polyline,
        routeId: route.id
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }

  /**
   * Get estimated travel time considering current traffic
   */
  async getEstimatedTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    transportMode: string = 'bicycle'
  ): Promise<{ duration: number; distance: number }> {
    try {
      const routeInfo = await this.calculateRoute(origin, destination, transportMode);
      return {
        duration: routeInfo.duration,
        distance: routeInfo.distance
      };
    } catch (error) {
      console.error('Error getting travel time:', error);
      throw error;
    }
  }

  /**
   * Decode HERE polyline to coordinates array
   */
  decodePolyline(polyline: string): Array<{ lat: number; lng: number }> {
    // HERE uses a specific polyline encoding format
    // This is a simplified decoder - in production, use HERE's official decoder
    const coordinates: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < polyline.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = polyline.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = polyline.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coordinates.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return coordinates;
  }

  /**
   * Get geocoding for address
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = 'https://geocode.search.hereapi.com/v1/geocode';
      const params = new URLSearchParams({
        q: address,
        apikey: this.apiKey
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HERE Geocoding API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.items && data.items.length > 0) {
        const location = data.items[0].position;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }
}

export const hereMapService = new HereMapService();