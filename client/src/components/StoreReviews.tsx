import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Star, ThumbsUp, MessageCircle, Shield, User } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { apiRequest } from '@/lib/queryClient';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface StoreReview {
  id: number;
  storeId: number;
  customerId: number;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  customer: {
    id: number;
    username: string;
    fullName: string;
  } | null;
}

interface StoreReviewsProps {
  storeId: number;
  currentUserId?: number;
}

export default function StoreReviews({ storeId, currentUserId }: StoreReviewsProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      comment: '',
    },
  });

  // Fetch store reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['/api/stores', storeId, 'reviews'],
    queryFn: () => apiRequest(`/api/stores/${storeId}/reviews`),
  });

  // Ensure reviews is always an array
  const reviews = Array.isArray(reviewsData) ? reviewsData : [];

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/store-reviews', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      toast({
        title: "Review submitted successfully",
        description: "Thank you for your feedback!",
      });
      setIsReviewDialogOpen(false);
      form.reset();
      setSelectedRating(0);
      queryClient.invalidateQueries({ queryKey: ['/api/stores', storeId, 'reviews'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting review",
        description: error.message || "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark review as helpful mutation
  const markHelpfulMutation = useMutation({
    mutationFn: (reviewId: number) => 
      apiRequest(`/api/store-reviews/${reviewId}/helpful`, {
        method: 'POST',
        body: { userId: currentUserId || 9 },
      }),
    onSuccess: () => {
      toast({
        title: "Thank you for your feedback",
        description: "Review marked as helpful!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', storeId, 'reviews'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark review as helpful.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    console.log('Form data being submitted:', data);
    
    const reviewData = {
      ...data,
      rating: selectedRating || data.rating,
      storeId,
      customerId: currentUserId || 9,
    };
    
    console.log('Review data with store info:', reviewData);
    createReviewMutation.mutate(reviewData);
  };

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    form.setValue('rating', rating);
  };

  const handleMarkHelpful = (reviewId: number) => {
    markHelpfulMutation.mutate(reviewId);
  };

  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum: number, review: StoreReview) => sum + (review.rating || 0), 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const matchingReviews = reviews ? reviews.filter((review: StoreReview) => review.rating === rating) : [];
    const count = matchingReviews.length;
    const percentage = reviews && reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    
    return {
      rating,
      count,
      percentage
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Store Reviews</span>
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-rate-store>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Rate Store
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Rate This Store</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => handleRatingClick(star)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`w-8 h-8 ${
                                      star <= selectedRating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief summary of your experience" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share your experience with this store..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsReviewDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createReviewMutation.isPending || selectedRating === 0}
                      >
                        {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
                <StarRating rating={averageRating} />
                <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-2 text-sm">
                  <span className="w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {!reviews || reviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">No reviews yet. Be the first to review this store!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review: StoreReview) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarImage src={`/api/placeholder/40/40`} />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {review.customer?.fullName || review.customer?.username || 'Anonymous'}
                        </span>
                        {review.isVerifiedPurchase && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm text-gray-500">({review.rating}/5)</span>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-medium">{review.title}</h4>
                    )}
                    
                    {review.comment && (
                      <p className="text-gray-700">{review.comment}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkHelpful(review.id)}
                        disabled={markHelpfulMutation.isPending}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Helpful ({review.helpfulCount})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}