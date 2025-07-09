import React from 'react';
import { BathroomLocation } from '../../shared/types/bathroom';

interface LocationDetailsProps {
  location: BathroomLocation;
  onVote: (reviewId: string, voteType: 'up' | 'down') => void;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({ location, onVote }) => {
  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-600 bg-red-50';
    if (rating <= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRatingEmoji = (rating: number) => {
    if (rating <= 1.5) return '💩';
    if (rating <= 2.5) return '😷';
    if (rating <= 3.5) return '😐';
    if (rating <= 4.5) return '😊';
    return '✨';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const RatingBar: React.FC<{ label: string; rating: number }> = ({ label, rating }) => (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-gray-700 w-20">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-red-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 w-8">{rating}</span>
    </div>
  );

  // Calculate average ratings for each category
  const avgRatings = location.reviews.reduce(
    (acc, review) => ({
      cleanliness: acc.cleanliness + review.cleanliness,
      accessibility: acc.accessibility + review.accessibility,
      supplies: acc.supplies + review.supplies,
      privacy: acc.privacy + review.privacy,
    }),
    { cleanliness: 0, accessibility: 0, supplies: 0, privacy: 0 }
  );

  const reviewCount = location.reviews.length;
  if (reviewCount > 0) {
    avgRatings.cleanliness /= reviewCount;
    avgRatings.accessibility /= reviewCount;
    avgRatings.supplies /= reviewCount;
    avgRatings.privacy /= reviewCount;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{location.name}</h1>
            <div className="text-gray-600 space-y-1">
              <p className="flex items-center space-x-1">
                <span>📍</span>
                <span>{location.city}</span>
                {location.address && <span>• {location.address}</span>}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">{getRatingEmoji(location.averageRating)}</span>
              <span
                className={`px-3 py-1 rounded-full text-lg font-bold ${getRatingColor(
                  location.averageRating
                )}`}
              >
                {location.averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {location.totalReviews} review{location.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Rating breakdown */}
        {reviewCount > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-medium text-gray-900 mb-3">Rating Breakdown</h3>
            <RatingBar label="Clean" rating={Number(avgRatings.cleanliness.toFixed(1))} />
            <RatingBar label="Access" rating={Number(avgRatings.accessibility.toFixed(1))} />
            <RatingBar label="Supplies" rating={Number(avgRatings.supplies.toFixed(1))} />
            <RatingBar label="Privacy" rating={Number(avgRatings.privacy.toFixed(1))} />
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
        
        {location.reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-600">No reviews yet for this location.</p>
          </div>
        ) : (
          location.reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {review.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.username}</p>
                    <p className="text-sm text-gray-600">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getRatingEmoji(review.rating)}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${getRatingColor(
                      review.rating
                    )}`}
                  >
                    {review.rating}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-md">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Clean</p>
                  <p className="font-medium">{review.cleanliness}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Access</p>
                  <p className="font-medium">{review.accessibility}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Supplies</p>
                  <p className="font-medium">{review.supplies}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Privacy</p>
                  <p className="font-medium">{review.privacy}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onVote(review.id, 'up')}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{review.upvotes}</span>
                </button>
                <button
                  onClick={() => onVote(review.id, 'down')}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{review.downvotes}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};