import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ExternalLink, Copy, RefreshCw, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageBrowserProps {
  onImageSelect: (imageUrl: string) => void;
  selectedImages: string[];
  maxImages: number;
}

export function ImageBrowser({ onImageSelect, selectedImages, maxImages }: ImageBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [selectedSite, setSelectedSite] = useState('unsplash');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const imageSites = {
    unsplash: {
      name: 'Unsplash',
      baseUrl: 'https://unsplash.com',
      searchUrl: 'https://unsplash.com/s/photos/',
      icon: '📷'
    },
    pixabay: {
      name: 'Pixabay', 
      baseUrl: 'https://pixabay.com',
      searchUrl: 'https://pixabay.com/images/search/',
      icon: '🖼️'
    },
    pexels: {
      name: 'Pexels',
      baseUrl: 'https://pexels.com',
      searchUrl: 'https://pexels.com/search/',
      icon: '📸'
    },
    freepik: {
      name: 'Freepik',
      baseUrl: 'https://freepik.com',
      searchUrl: 'https://freepik.com/search?format=search&query=',
      icon: '🎨'
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    const site = imageSites[selectedSite as keyof typeof imageSites];
    const searchUrl = `${site.searchUrl}${encodeURIComponent(searchTerm)}`;
    setCurrentUrl(searchUrl);
    
    if (iframeRef.current) {
      iframeRef.current.src = searchUrl;
    }
  };

  const handleSiteChange = (siteKey: string) => {
    setSelectedSite(siteKey);
    const site = imageSites[siteKey as keyof typeof imageSites];
    setCurrentUrl(site.baseUrl);
    
    if (iframeRef.current) {
      iframeRef.current.src = site.baseUrl;
    }
  };

  const handleUrlSubmit = () => {
    if (!currentUrl.trim()) return;
    
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleGoHome = () => {
    const site = imageSites[selectedSite as keyof typeof imageSites];
    setCurrentUrl(site.baseUrl);
    if (iframeRef.current) {
      iframeRef.current.src = site.baseUrl;
    }
  };

  const handleCopyUrl = () => {
    if (currentUrl) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        toast({
          title: "URL Copied",
          description: "Current page URL copied to clipboard"
        });
      });
    }
  };

  const handleAddFromUrl = () => {
    if (!currentUrl.trim()) {
      toast({
        title: "No URL",
        description: "Please navigate to an image first",
        variant: "destructive"
      });
      return;
    }

    if (selectedImages.includes(currentUrl)) {
      toast({
        title: "Duplicate Image",
        description: "This image URL has already been added",
        variant: "destructive"
      });
      return;
    }

    if (maxImages <= 0) {
      toast({
        title: "Image Limit Reached",
        description: "You've reached the maximum number of images",
        variant: "destructive"
      });
      return;
    }

    onImageSelect(currentUrl);
    toast({
      title: "Image Added",
      description: "Image URL has been successfully added to your product"
    });
  };

  // Quick search categories
  const quickCategories = [
    'food', 'electronics', 'clothing', 'furniture', 'beauty', 'sports',
    'pizza', 'burger', 'smartphone', 'laptop', 'shoes', 'chair'
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Image Browser
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Site Selection */}
          <div className="flex gap-2 mb-4">
            {Object.entries(imageSites).map(([key, site]) => (
              <Button
                key={key}
                variant={selectedSite === key ? "default" : "outline"}
                size="sm"
                onClick={() => handleSiteChange(key)}
                className="text-xs"
              >
                <span className="mr-1">{site.icon}</span>
                {site.name}
              </Button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Category Buttons */}
          <div className="grid grid-cols-4 gap-1 mb-4">
            {quickCategories.map((category) => (
              <Button
                key={category}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm(category);
                  const site = imageSites[selectedSite as keyof typeof imageSites];
                  const searchUrl = `${site.searchUrl}${encodeURIComponent(category)}`;
                  setCurrentUrl(searchUrl);
                  if (iframeRef.current) {
                    iframeRef.current.src = searchUrl;
                  }
                }}
                className="text-xs capitalize"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Browser Controls */}
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={handleGoHome}>
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Enter URL..."
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleCopyUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Browser Frame */}
          <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
            <iframe
              ref={iframeRef}
              src={imageSites[selectedSite as keyof typeof imageSites].baseUrl}
              className="w-full h-full"
              title="Image Browser"
              onLoad={() => {
                // Try to get the current URL from iframe (limited due to CORS)
                try {
                  if (iframeRef.current?.contentWindow?.location.href) {
                    setCurrentUrl(iframeRef.current.contentWindow.location.href);
                  }
                } catch (e) {
                  // CORS restriction - this is expected
                }
              }}
            />
          </div>

          {/* Instructions */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-medium mb-2 text-sm">How to copy image URLs:</h4>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Search for images using the search bar above</li>
              <li>2. Click on an image you like in the browser</li>
              <li>3. Right-click the image → "Open image in new tab"</li>
              <li>4. Copy the image URL from the new tab's address bar</li>
              <li>5. Paste it in the "Paste URL" tab to add to your product</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddFromUrl}
              disabled={maxImages <= 0 || !currentUrl}
              className="flex-1"
            >
              Add Current URL as Image
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(currentUrl, '_blank')}
              disabled={!currentUrl}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}