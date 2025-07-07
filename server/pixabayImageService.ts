/**
 * Pixabay Image Service - Free API with actual search results
 * Provides real search-specific images without quota restrictions
 */

export interface PixabayImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
  links: {
    download: string;
    html: string;
  };
}

export interface PixabayImageSearchResponse {
  total: number;
  total_pages: number;
  results: PixabayImage[];
}

export class PixabayImageService {
  private baseUrl = 'https://pixabay.com/api/';
  private apiKey = '47458629-2ac0da0bb3d8055a970a60c54'; // Free public key
  
  constructor() {
    console.log('✅ Pixabay Image Service initialized - Free API with search-specific results');
  }

  isConfigured(): boolean {
    return true; // Always available
  }

  /**
   * Search for actual images by query using Pixabay
   */
  async searchImages(
    query: string,
    count: number = 20,
    options: {
      imageType?: 'all' | 'photo' | 'illustration' | 'vector';
      category?: string;
      minWidth?: number;
      minHeight?: number;
      safesearch?: boolean;
    } = {}
  ): Promise<PixabayImageSearchResponse> {
    try {
      const {
        imageType = 'photo',
        minWidth = 640,
        minHeight = 480,
        safesearch = true
      } = options;

      const searchParams = new URLSearchParams({
        key: this.apiKey,
        q: encodeURIComponent(query),
        image_type: imageType,
        per_page: Math.min(count, 200).toString(),
        min_width: minWidth.toString(),
        min_height: minHeight.toString(),
        safesearch: safesearch.toString(),
        order: 'popular',
        orientation: 'all'
      });

      const response = await fetch(`${this.baseUrl}?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert Pixabay format to our standard format
      const results: PixabayImage[] = data.hits.map((hit: any, index: number) => ({
        id: `pixabay-${hit.id}-${index}`,
        urls: {
          raw: hit.largeImageURL || hit.webformatURL,
          full: hit.largeImageURL || hit.webformatURL,
          regular: hit.webformatURL,
          small: hit.previewURL,
          thumb: hit.previewURL
        },
        alt_description: `${query} - ${hit.tags}`,
        description: `High quality ${query} image - ${hit.tags}`,
        user: {
          name: hit.user,
          username: hit.user.toLowerCase().replace(/\s+/g, '')
        },
        links: {
          download: hit.largeImageURL || hit.webformatURL,
          html: hit.pageURL
        }
      }));

      return {
        total: data.total,
        total_pages: Math.ceil(data.total / count),
        results
      };
    } catch (error) {
      console.error('Error fetching images from Pixabay:', error);
      throw error;
    }
  }

  /**
   * Get search-specific product images
   */
  async getProductImages(query: string, count: number = 6): Promise<PixabayImage[]> {
    const response = await this.searchImages(query, count, {
      imageType: 'photo',
      minWidth: 400,
      minHeight: 300,
      safesearch: true
    });
    return response.results;
  }

  /**
   * Get random images for a category with actual relevance
   */
  async getRandomImages(query: string, count: number = 6): Promise<PixabayImage[]> {
    return this.getProductImages(query, count);
  }

  /**
   * Track image usage (no-op for free service)
   */
  async trackDownload(image: PixabayImage): Promise<boolean> {
    // No tracking needed for Pixabay
    return true;
  }
}

export const pixabayImageService = new PixabayImageService();