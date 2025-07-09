import React, { useState } from 'react';
import { AddReviewRequest, BathroomRating } from '../../shared/types/bathroom';

interface ReviewFormProps {
  onSubmit: (data: AddReviewRequest) => Promise<{ success: boolean; error?: string }>;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<AddReviewRequest>({
    locationName: '',
    address: '',
    city: '',
    rating: 1,
    cleanliness: 1,
    accessibility: 1,
    supplies: 1,
    privacy: 1,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submission started');
    
    setSubmitting(true);
    setError('');

    try {
      const result = await onSubmit(formData);
      
      if (result.success) {
        console.log('Review submitted successfully');
        // Reset form
        setFormData({
          locationName: '',
          address: '',
          city: '',
          rating: 1,
          cleanliness: 1,
          accessibility: 1,
          supplies: 1,
          privacy: 1,
          comment: '',
        });
      } else {
        console.error('Review submission failed:', result.error);
        setError(result.error || 'Failed to submit review');
      }
    } catch (submitError) {
      console.error('Review submission error:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit review');
    }
    
    setSubmitting(false);
  };

  const handleButtonClick = async () => {
    console.log('Submit button clicked');
    
    // Validate required fields
    if (!formData.locationName.trim()) {
      setError('Location name is required');
      return;
    }
    
    if (!formData.city.trim()) {
      setError('City is required');
      return;
    }
    
    if (!formData.comment.trim()) {
      setError('Review comment is required');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const result = await onSubmit(formData);
      
      if (result.success) {
        console.log('Review submitted successfully');
        // Reset form
        setFormData({
          locationName: '',
          address: '',
          city: '',
          rating: 1,
          cleanliness: 1,
          accessibility: 1,
          supplies: 1,
          privacy: 1,
          comment: '',
        });
      } else {
        console.error('Review submission failed:', result.error);
        setError(result.error || 'Failed to submit review');
      }
    } catch (submitError) {
      console.error('Review submission error:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit review');
    }
    
    setSubmitting(false);
  };

  const RatingInput: React.FC<{
    label: string;
    value: BathroomRating;
    onChange: (value: BathroomRating) => void;
    description?: string;
  }> = ({ label, value, onChange, description }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {description && <span className="text-gray-500 text-xs ml-1">({description})</span>}
      </label>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating as BathroomRating)}
            className={`w-8 h-8 rounded-full border-2 font-medium text-sm transition-colors ${
              value >= rating
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-gray-300 text-gray-400 hover:border-red-300'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="font-medium">Error:</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Use div instead of form to avoid sandbox issues */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">
              Location Name *
            </label>
            <input
              type="text"
              id="locationName"
              required
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              placeholder="e.g., McDonald's, Central Park, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              type="text"
              id="city"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., New York, Los Angeles, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address (optional)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RatingInput
            label="Overall Rating"
            value={formData.rating}
            onChange={(value) => setFormData({ ...formData, rating: value })}
            description="1 = Worst, 5 = Best"
          />
          
          <RatingInput
            label="Cleanliness"
            value={formData.cleanliness}
            onChange={(value) => setFormData({ ...formData, cleanliness: value })}
          />
          
          <RatingInput
            label="Accessibility"
            value={formData.accessibility}
            onChange={(value) => setFormData({ ...formData, accessibility: value })}
          />
          
          <RatingInput
            label="Supplies"
            value={formData.supplies}
            onChange={(value) => setFormData({ ...formData, supplies: value })}
            description="TP, soap, etc."
          />
          
          <RatingInput
            label="Privacy"
            value={formData.privacy}
            onChange={(value) => setFormData({ ...formData, privacy: value })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            Review Comment *
          </label>
          <textarea
            id="comment"
            required
            rows={4}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Describe your experience with this bathroom..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={submitting}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};