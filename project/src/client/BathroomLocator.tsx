import React, { useState, useEffect } from 'react';
import { BathroomLocation, AddReviewRequest, BathroomRating } from '../shared/types/bathroom';
import { ReviewForm } from './components/ReviewForm';
import { LocationList } from './components/LocationList';
import { LocationDetails } from './components/LocationDetails';

type View = 'list' | 'add' | 'details';

export const BathroomLocator: React.FC = () => {
  const [locations, setLocations] = useState<BathroomLocation[]>([]);
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedLocation, setSelectedLocation] = useState<BathroomLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');

  useEffect(() => {
    loadLocations();
  }, []);

  const makeApiCall = async (endpoint: string, options: RequestInit = {}) => {
    // In Devvit webview, API calls are relative to the current origin
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    console.log(`Making API call to: ${url}`);
    console.log('Request options:', options);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response ok: ${response.ok}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    return data;
  };

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading locations...');
      
      // First try to test the health endpoint
      try {
        const healthData = await makeApiCall('api/health');
        console.log('Health check passed:', healthData);
      } catch (healthError) {
        console.warn('Health check failed, but continuing:', healthError);
      }
      
      const data = await makeApiCall('api/locations');
      
      if (data.status === 'success') {
        setLocations(data.locations || []);
        console.log('Successfully loaded locations:', data.locations?.length || 0);
      } else {
        setError(data.message || 'Failed to load locations');
        console.error('API returned error:', data.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load locations: ${errorMessage}`);
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (reviewData: AddReviewRequest) => {
    try {
      console.log('Submitting review:', reviewData);
      
      const data = await makeApiCall('api/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
      
      if (data.status === 'success') {
        await loadLocations(); // Refresh the list
        setCurrentView('list');
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to add review' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error adding review:', err);
      return { success: false, error: `Failed to submit review: ${errorMessage}` };
    }
  };

  const handleVote = async (reviewId: string, voteType: 'up' | 'down') => {
    try {
      console.log('Voting:', { reviewId, voteType });
      
      const data = await makeApiCall('api/vote', {
        method: 'POST',
        body: JSON.stringify({ reviewId, voteType }),
      });
      
      if (data.status === 'success') {
        await loadLocations(); // Refresh to get updated vote counts
        // Update selected location if viewing details
        if (selectedLocation) {
          const updatedLocation = locations.find(loc => loc.id === selectedLocation.id);
          if (updatedLocation) {
            setSelectedLocation(updatedLocation);
          }
        }
      } else {
        console.error('Vote failed:', data.message);
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const filteredLocations = locations.filter(location =>
    cityFilter === '' || location.city.toLowerCase().includes(cityFilter.toLowerCase())
  );

  const cities = [...new Set(locations.map(loc => loc.city))].sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bathroom locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🚫</div>
              <h1 className="text-2xl font-bold text-gray-900">Do NOT Go In There</h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'list'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => setCurrentView('add')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'add'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Add Review
                </button>
              </nav>
              
              {/* Built with Bolt Badge */}
              <a
                href="https://bolt.new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 3L4 14h7v7l9-11h-7V3z"/>
                </svg>
                <span>Built with Bolt</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="font-medium">Error:</div>
            <div className="text-sm mt-1">{error}</div>
            <button 
              onClick={loadLocations}
              className="mt-2 text-sm underline hover:no-underline bg-red-100 px-2 py-1 rounded"
            >
              Try again
            </button>
          </div>
        )}

        {currentView === 'list' && (
          <div>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Bathroom Locations ({filteredLocations.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <label htmlFor="city-filter" className="text-sm font-medium text-gray-700">
                    Filter by city:
                  </label>
                  <select
                    id="city-filter"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">All cities</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <LocationList
              locations={filteredLocations}
              onLocationClick={(location) => {
                setSelectedLocation(location);
                setCurrentView('details');
              }}
            />
          </div>
        )}

        {currentView === 'add' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Bathroom Review</h2>
            <ReviewForm onSubmit={handleAddReview} />
          </div>
        )}

        {currentView === 'details' && selectedLocation && (
          <div>
            <button
              onClick={() => setCurrentView('list')}
              className="mb-4 text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back to list</span>
            </button>
            <LocationDetails location={selectedLocation} onVote={handleVote} />
          </div>
        )}
      </main>
    </div>
  );
};