import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Link, Check, X, AlertCircle, Info, Search, Globe, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ManualImageInputProps {
  onImageSelect: (imageUrl: string) => void;
  trigger?: React.ReactNode;
  selectedImages?: string[];
  maxImages?: number;
  buttonText?: string;
}

export function ManualImageInput({
  onImageSelect,
  trigger,
  selectedImages = [],
  maxImages = 5,
  buttonText = "Add Images"
}: ManualImageInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [browserUrl, setBrowserUrl] = useState('https://www.google.com/search?q=food+images&tbm=isch');
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const validateImageUrl = async (url: string) => {
    if (!url.trim()) {
      setPreviewUrl(null);
      setValidationError(null);
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Basic URL validation
      new URL(url);
      
      // Check if URL looks like an image
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => 
        url.toLowerCase().includes(ext)
      );
      
      if (!hasImageExtension && !url.includes('unsplash') && !url.includes('pixabay') && !url.includes('pexels')) {
        setValidationError('URL does not appear to be an image. Make sure it ends with .jpg, .png, etc.');
        setPreviewUrl(null);
        setIsValidating(false);
        return;
      }

      // Try to load the image to validate it
      const img = new Image();
      img.onload = () => {
        setPreviewUrl(url);
        setValidationError(null);
        setIsValidating(false);
      };
      img.onerror = () => {
        setValidationError('Unable to load image from this URL. Please check if the URL is correct.');
        setPreviewUrl(null);
        setIsValidating(false);
      };
      img.src = url;
    } catch (error) {
      setValidationError('Please enter a valid URL starting with http:// or https://');
      setPreviewUrl(null);
      setIsValidating(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateImageUrl(url);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleAddImage = () => {
    if (!previewUrl || selectedImages.length >= maxImages) return;
    
    if (selectedImages.includes(previewUrl)) {
      toast({
        title: "Image already added",
        description: "This image is already in your selection.",
        variant: "destructive"
      });
      return;
    }

    onImageSelect(previewUrl);
    setImageUrl('');
    setPreviewUrl(null);
    setValidationError(null);
    
    toast({
      title: "Image added",
      description: "Image has been added to your product.",
    });

    if (selectedImages.length + 1 >= maxImages) {
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Image from URL</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="browser" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browser" className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Browse Images
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center">
              <Link className="w-4 h-4 mr-2" />
              Paste URL
            </TabsTrigger>
          </TabsList>

          {/* Browser Tab */}
          <TabsContent value="browser" className="space-y-4">
            {/* Search Controls */}
            <div className="flex space-x-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for images (e.g., food, electronics, clothes)"
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' images')}&tbm=isch`;
                    setBrowserUrl(searchUrl);
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (searchQuery.trim()) {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' images')}&tbm=isch`;
                    setBrowserUrl(searchUrl);
                  }
                }}
                size="sm"
                disabled={!searchQuery.trim()}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Search Buttons */}
            <div className="flex flex-wrap gap-2">
              {['Food Images', 'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'].map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(category)}&tbm=isch`;
                    setBrowserUrl(searchUrl);
                    setSearchQuery(category);
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How to copy image URLs:</strong>
                <br />1. Search for images in the browser below
                <br />2. Right-click any image → "Open image in new tab" 
                <br />3. Copy the URL from the new tab's address bar
                <br />4. Switch to "Paste URL" tab and paste it
              </AlertDescription>
            </Alert>

            {/* Embedded Browser */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-3 py-2 text-sm flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span className="truncate">{browserUrl}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(browserUrl, '_blank')}
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <iframe
                ref={iframeRef}
                src={browserUrl}
                className="w-full h-96 border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                title="Image Search Browser"
              />
            </div>
          </TabsContent>

          {/* Manual URL Tab */}
          <TabsContent value="manual" className="space-y-4">
            {/* Simple Copy-Paste Instructions */}
            <Alert>
              <Copy className="h-4 w-4" />
              <AlertDescription>
                <strong>Simple Copy & Paste:</strong>
                <br />Paste your image URL below. The image will be validated automatically.
              </AlertDescription>
            </Alert>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste image URL here (https://example.com/image.jpg)"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.readText().then((text) => {
                      if (text && text.startsWith('http')) {
                        setImageUrl(text);
                        handleUrlChange(text);
                      }
                    }).catch(() => {
                      toast({
                        title: "Paste failed",
                        description: "Please paste manually using Ctrl+V",
                        variant: "destructive"
                      });
                    });
                  }}
                  title="Paste from clipboard"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              {isValidating && (
                <p className="text-sm text-muted-foreground flex items-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Validating image...
                </p>
              )}
              
              {validationError && (
                <p className="text-sm text-destructive flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {validationError}
                </p>
              )}
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Common Footer */}
          <div className="pt-4 border-t">
            {/* Selected Images Count */}
            {selectedImages.length > 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                {selectedImages.length} of {maxImages} images selected
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setImageUrl('');
                  setPreviewUrl(null);
                  setValidationError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddImage}
                disabled={!previewUrl || selectedImages.length >= maxImages}
                className="flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}