import React from 'react';
import { BathroomLocation } from '../../shared/types/bathroom';

interface LocationListProps {
  locations: BathroomLocation[];
  onLocationClick: (location: BathroomLocation) => void;
}

export const LocationList: React.FC<LocationListProps> = ({ locations, onLocationClick }) => {
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

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚽</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bathroom reviews yet</h3>
        <p className="text-gray-600">Be the first to add a bathroom review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {locations.map((location) => (
        <div
          key={location.id}
          onClick={() => onLocationClick(location)}
          className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{getRatingEmoji(location.averageRating)}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${getRatingColor(
                      location.averageRating
                    )}`}
                  >
                    {location.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="text-gray-600 space-y-1">
                <p className="flex items-center space-x-1">
                  <span>📍</span>
                  <span>{location.city}</span>
                  {location.address && <span>• {location.address}</span>}
                </p>
                <p className="flex items-center space-x-1">
                  <span>📝</span>
                  <span>{location.totalReviews} review{location.totalReviews !== 1 ? 's' : ''}</span>
                </p>
              </div>

              {location.reviews.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    "{location.reviews[0].comment}"
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    - {location.reviews[0].username}
                  </p>
                </div>
              )}
            </div>
            
            <div className="ml-4 text-gray-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};