import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clipboard, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManualImageInputProps {
  onImageSelect: (imageUrl: string) => void;
  selectedImages: string[];
  maxImages: number;
  buttonText?: string;
}

interface SampleImage {
  url: string;
  title: string;
  source: string;
}

export function ManualImageInput({ 
  onImageSelect, 
  selectedImages, 
  maxImages, 
  buttonText = "Add Images" 
}: ManualImageInputProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const { toast } = useToast();

  // Sample images for different categories to show multiple options
  const sampleImages = {
    food: [
      { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', title: 'Pizza', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', title: 'Burger', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', title: 'Salad', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400', title: 'Pasta', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400', title: 'Sandwich', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', title: 'Soup', source: 'Unsplash' }
    ],
    electronics: [
      { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', title: 'Smartphone', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', title: 'Laptop', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', title: 'Headphones', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?w=400', title: 'Camera', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400', title: 'Tablet', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400', title: 'Smartwatch', source: 'Unsplash' }
    ],
    clothing: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', title: 'T-Shirt', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', title: 'Jeans', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1556137996-627b7f7b1e3e?w=400', title: 'Sneakers', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', title: 'Dress', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', title: 'Jacket', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', title: 'Hat', source: 'Unsplash' }
    ],
    furniture: [
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', title: 'Chair', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', title: 'Sofa', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400', title: 'Table', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=400', title: 'Bed', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=400', title: 'Bookshelf', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', title: 'Desk', source: 'Unsplash' }
    ],
    beauty: [
      { url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', title: 'Lipstick', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1515688594390-b649af70d282?w=400', title: 'Perfume', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400', title: 'Skincare', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1583241800698-2f249c97b8c8?w=400', title: 'Makeup', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400', title: 'Shampoo', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1553531384-397688e2e0b3?w=400', title: 'Nail Polish', source: 'Unsplash' }
    ],
    sports: [
      { url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400', title: 'Football', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', title: 'Basketball', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400', title: 'Tennis', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d57?w=400', title: 'Dumbbells', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', title: 'Running Shoes', source: 'Unsplash' },
      { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', title: 'Gym Equipment', source: 'Unsplash' }
    ]
  };

  const validateAndPreviewImage = async (url: string) => {
    if (!url.trim()) {
      setPreviewUrl('');
      return;
    }

    setIsValidating(true);
    try {
      const img = new Image();
      img.onload = () => {
        setPreviewUrl(url);
        setIsValidating(false);
      };
      img.onerror = () => {
        setPreviewUrl('');
        setIsValidating(false);
        toast({
          title: "Invalid Image",
          description: "This URL doesn't point to a valid image",
          variant: "destructive"
        });
      };
      img.src = url;
    } catch (error) {
      setIsValidating(false);
      setPreviewUrl('');
    }
  };

  const handleAddImage = (url?: string) => {
    const imageToAdd = url || previewUrl;
    
    if (!imageToAdd) {
      toast({
        title: "No Image",
        description: "Please select an image first",
        variant: "destructive"
      });
      return;
    }

    if (selectedImages.includes(imageToAdd)) {
      toast({
        title: "Duplicate Image",
        description: "This image has already been added",
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

    onImageSelect(imageToAdd);
    if (!url) {
      setImageUrl('');
      setPreviewUrl('');
    }
    toast({
      title: "Image Added",
      description: "Image has been successfully added to your product"
    });
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http') || text.startsWith('data:'))) {
        setImageUrl(text);
        validateAndPreviewImage(text);
        toast({
          title: "URL Pasted",
          description: "Image URL pasted from clipboard"
        });
      } else {
        toast({
          title: "No URL Found",
          description: "No valid image URL found in clipboard",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Clipboard Access",
        description: "Unable to access clipboard. Please paste manually.",
        variant: "destructive"
      });
    }
  };

  const quickSearchSites = [
    { name: "Unsplash", url: "https://unsplash.com/s/photos/" },
    { name: "Pixabay", url: "https://pixabay.com/images/search/" },
    { name: "Pexels", url: "https://www.pexels.com/search/" },
    { name: "Freepik", url: "https://www.freepik.com/search?format=search&query=" }
  ];

  const categories = Object.keys(sampleImages);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {buttonText}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Sample Images</TabsTrigger>
            <TabsTrigger value="paste">Paste URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Choose from sample images or search professional image sites:
            </div>
            
            {/* Category Selection */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Sample Images Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {sampleImages[selectedCategory as keyof typeof sampleImages]?.map((img, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img 
                    src={img.url} 
                    alt={img.title}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-2">
                    <div className="text-xs font-medium truncate">{img.title}</div>
                    <div className="text-xs text-gray-500">{img.source}</div>
                    <Button
                      onClick={() => handleAddImage(img.url)}
                      size="sm"
                      className="w-full mt-1 text-xs"
                      disabled={maxImages <= 0 || selectedImages.includes(img.url)}
                    >
                      {selectedImages.includes(img.url) ? 'Added' : 'Add Image'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Professional Search Sites */}
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Find more professional images:</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {quickSearchSites.map((site) => (
                  <Button
                    key={site.name}
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`${site.url}${selectedCategory}`, '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {site.name}
                  </Button>
                ))}
              </div>

              <div className="border rounded-lg p-3 bg-gray-50">
                <h4 className="font-medium mb-2 text-sm">How to get custom images:</h4>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. Click any search button above to open image site</li>
                  <li>2. Find an image you like</li>
                  <li>3. Right-click → "Open image in new tab"</li>
                  <li>4. Copy URL from address bar</li>
                  <li>5. Come back and paste in "Paste URL" tab</li>
                </ol>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL here (https://...)"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    validateAndPreviewImage(e.target.value);
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handlePasteFromClipboard}
                  variant="outline"
                  size="icon"
                  title="Paste from clipboard"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>

              {isValidating && (
                <div className="text-sm text-blue-600">Validating image...</div>
              )}

              {previewUrl && (
                <div className="space-y-3">
                  <div className="border rounded-lg p-2">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded"
                      onError={() => setPreviewUrl('')}
                    />
                  </div>
                  <Button 
                    onClick={() => handleAddImage()}
                    className="w-full"
                    disabled={maxImages <= 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add This Image ({selectedImages.length + 1}/{selectedImages.length + maxImages})
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}