export type BathroomRating = 1 | 2 | 3 | 4 | 5;

export interface BathroomReview {
  id: string;
  locationName: string;
  address: string;
  city: string;
  rating: BathroomRating;
  cleanliness: BathroomRating;
  accessibility: BathroomRating;
  supplies: BathroomRating;
  privacy: BathroomRating;
  comment: string;
  userId: string;
  username: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
}

export interface BathroomLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  averageRating: number;
  totalReviews: number;
  reviews: BathroomReview[];
}

export type AddReviewRequest = {
  locationName: string;
  address: string;
  city: string;
  rating: BathroomRating;
  cleanliness: BathroomRating;
  accessibility: BathroomRating;
  supplies: BathroomRating;
  privacy: BathroomRating;
  comment: string;
};

export type AddReviewResponse = {
  status: 'success' | 'error';
  message?: string;
  review?: BathroomReview;
};

export type GetLocationsResponse = {
  status: 'success' | 'error';
  message?: string;
  locations?: BathroomLocation[];
};

export type VoteRequest = {
  reviewId: string;
  voteType: 'up' | 'down';
};

export type VoteResponse = {
  status: 'success' | 'error';
  message?: string;
  upvotes?: number;
  downvotes?: number;
};