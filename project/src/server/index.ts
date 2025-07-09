import express from 'express';
import { createServer, getContext, getServerPort } from '@devvit/server';
import { getRedis } from '@devvit/redis';
import {
  BathroomLocation,
  BathroomReview,
  AddReviewRequest,
  AddReviewResponse,
  GetLocationsResponse,
  VoteRequest,
  VoteResponse,
} from '../shared/types/bathroom';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add CORS headers for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const getLocationKey = (locationId: string) => `bathroom:location:${locationId}`;
const getReviewKey = (reviewId: string) => `bathroom:review:${reviewId}`;
const getLocationListKey = () => 'bathroom:locations:list';
const getUserVoteKey = (userId: string, reviewId: string) => `bathroom:vote:${userId}:${reviewId}`;

// Health check endpoint
app.get('/api/health', async (req, res) => {
  console.log('=== HEALTH CHECK ===');
  try {
    const redis = getRedis();
    console.log('✓ Redis instance created');
    
    // Test Redis connection with a simple operation
    const testKey = 'bathroom:health:test';
    const testValue = 'health_check_' + Date.now();
    
    await redis.set(testKey, testValue);
    const retrievedValue = await redis.get(testKey);
    
    console.log('✓ Redis test - set:', testValue, 'got:', retrievedValue);
    
    // Clean up test key
    await redis.del(testKey);
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      redis: 'connected'
    });
  } catch (error) {
    console.error('✗ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get all locations
app.get('/api/locations', async (req, res) => {
  console.log('=== GET LOCATIONS ===');
  
  try {
    const redis = getRedis();
    console.log('✓ Redis instance obtained');
    
    // Get location IDs from the list - using hGetAll to get all locations at once
    // Since Devvit Redis might not support lists, we'll use a hash to store location IDs
    const locationListData = await redis.get(getLocationListKey());
    let locationIds: string[] = [];
    
    if (locationListData) {
      try {
        locationIds = JSON.parse(locationListData);
      } catch (parseError) {
        console.log('Error parsing location list, treating as empty:', parseError);
        locationIds = [];
      }
    }
    
    console.log(`✓ Found ${locationIds.length} location IDs:`, locationIds);
    
    const locations: BathroomLocation[] = [];
    
    if (locationIds.length === 0) {
      console.log('No locations found, returning empty array');
      res.json({
        status: 'success',
        locations: [],
        message: 'No bathroom reviews yet. Be the first to add one!'
      });
      return;
    }
    
    // Process each location
    for (const locationId of locationIds) {
      try {
        console.log(`Processing location: ${locationId}`);
        const locationData = await redis.get(getLocationKey(locationId));
        
        if (locationData) {
          const location: BathroomLocation = JSON.parse(locationData);
          console.log(`✓ Loaded location: ${location.name}`);
          
          // Get all reviews for this location
          const reviews: BathroomReview[] = [];
          console.log(`Loading ${location.reviews.length} reviews...`);
          
          for (const reviewId of location.reviews) {
            try {
              const reviewData = await redis.get(getReviewKey(reviewId));
              if (reviewData) {
                const review = JSON.parse(reviewData);
                reviews.push(review);
                console.log(`✓ Loaded review: ${review.id}`);
              } else {
                console.log(`⚠ Review not found: ${reviewId}`);
              }
            } catch (reviewError) {
              console.error(`✗ Error loading review ${reviewId}:`, reviewError);
            }
          }
          
          // Sort reviews by creation date (newest first)
          reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          locations.push({
            ...location,
            reviews,
          });
        } else {
          console.log(`⚠ Location data not found for: ${locationId}`);
        }
      } catch (locationError) {
        console.error(`✗ Error processing location ${locationId}:`, locationError);
      }
    }
    
    console.log(`✓ Returning ${locations.length} locations`);
    
    // Sort locations by average rating (worst first)
    locations.sort((a, b) => a.averageRating - b.averageRating);
    
    res.json({
      status: 'success',
      locations,
    });
  } catch (error) {
    console.error('✗ Error getting locations:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to get locations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Add a new review
app.post('/api/reviews', async (req, res) => {
  console.log('=== ADD REVIEW ===');
  console.log('Request body:', req.body);
  
  try {
    const redis = getRedis();
    console.log('✓ Redis instance obtained');
    
    // Get context for user info (if available)
    let userId: string;
    try {
      const context = getContext();
      userId = context.userId || 'anonymous_' + generateId();
    } catch {
      userId = 'anonymous_' + generateId();
    }
    console.log('✓ User ID:', userId);
    
    const { locationName, address, city, rating, cleanliness, accessibility, supplies, privacy, comment } = req.body;
    
    // Validate required fields
    if (!locationName || !city || !comment) {
      console.log('✗ Missing required fields');
      res.status(400).json({
        status: 'error',
        message: 'Location name, city, and comment are required',
      });
      return;
    }
    
    // Validate ratings
    const ratings = [rating, cleanliness, accessibility, supplies, privacy];
    if (ratings.some(r => !r || r < 1 || r > 5)) {
      console.log('✗ Invalid ratings');
      res.status(400).json({
        status: 'error',
        message: 'All ratings must be between 1 and 5',
      });
      return;
    }
    
    // Create location key based on name and city
    const locationKey = `${locationName.toLowerCase().trim()}_${city.toLowerCase().trim()}`;
    const locationId = Buffer.from(locationKey).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    console.log('✓ Generated location ID:', locationId);
    
    // Check if location exists
    let location: BathroomLocation;
    const existingLocationData = await redis.get(getLocationKey(locationId));
    
    if (existingLocationData) {
      location = JSON.parse(existingLocationData);
      console.log('✓ Found existing location:', location.name);
    } else {
      // Create new location
      location = {
        id: locationId,
        name: locationName.trim(),
        address: address?.trim() || '',
        city: city.trim(),
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
      };
      
      console.log('✓ Creating new location:', location.name);
      
      // Add to location list - using JSON array stored as string
      const locationListData = await redis.get(getLocationListKey());
      let locationIds: string[] = [];
      
      if (locationListData) {
        try {
          locationIds = JSON.parse(locationListData);
        } catch {
          locationIds = [];
        }
      }
      
      if (!locationIds.includes(locationId)) {
        locationIds.unshift(locationId); // Add to beginning
        await redis.set(getLocationListKey(), JSON.stringify(locationIds));
        console.log('✓ Added location to list');
      }
    }
    
    // Create review
    const reviewId = generateId();
    const review: BathroomReview = {
      id: reviewId,
      locationName: locationName.trim(),
      address: address?.trim() || '',
      city: city.trim(),
      rating,
      cleanliness,
      accessibility,
      supplies,
      privacy,
      comment: comment.trim(),
      userId,
      username: `User${userId.slice(-4)}`,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
    };
    
    console.log('✓ Created review:', reviewId);
    
    // Save review
    await redis.set(getReviewKey(reviewId), JSON.stringify(review));
    console.log('✓ Saved review to Redis');
    
    // Update location
    location.reviews.unshift(reviewId);
    location.totalReviews = location.reviews.length;
    
    // Recalculate average rating
    const allReviews: BathroomReview[] = [];
    for (const rId of location.reviews) {
      try {
        const reviewData = await redis.get(getReviewKey(rId));
        if (reviewData) {
          allReviews.push(JSON.parse(reviewData));
        }
      } catch (reviewError) {
        console.error(`Error loading review for average calculation ${rId}:`, reviewError);
      }
    }
    
    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      location.averageRating = Number((totalRating / allReviews.length).toFixed(1));
    }
    
    console.log('✓ Updated location with new average rating:', location.averageRating);
    
    // Save updated location
    await redis.set(getLocationKey(locationId), JSON.stringify(location));
    console.log('✓ Saved updated location to Redis');
    
    res.json({
      status: 'success',
      review,
      message: 'Review added successfully!'
    });
  } catch (error) {
    console.error('✗ Error adding review:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to add review: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Vote on a review
app.post('/api/vote', async (req, res) => {
  console.log('=== VOTE ON REVIEW ===');
  console.log('Request body:', req.body);
  
  try {
    const redis = getRedis();
    console.log('✓ Redis instance obtained');
    
    // Get context for user info (if available)
    let userId: string;
    try {
      const context = getContext();
      userId = context.userId || 'anonymous_' + generateId();
    } catch {
      userId = 'anonymous_' + generateId();
    }
    console.log('✓ Vote from user:', userId);
    
    const { reviewId, voteType } = req.body;
    
    if (!reviewId || !voteType || !['up', 'down'].includes(voteType)) {
      res.status(400).json({
        status: 'error',
        message: 'Review ID and valid vote type (up/down) are required',
      });
      return;
    }
    
    // Get review
    const reviewData = await redis.get(getReviewKey(reviewId));
    if (!reviewData) {
      console.log('✗ Review not found:', reviewId);
      res.status(404).json({
        status: 'error',
        message: 'Review not found',
      });
      return;
    }
    
    const review: BathroomReview = JSON.parse(reviewData);
    console.log('✓ Found review for voting:', review.id);
    
    // Check if user has already voted
    const existingVote = await redis.get(getUserVoteKey(userId, reviewId));
    console.log('Existing vote:', existingVote);
    
    // Update vote counts
    if (existingVote) {
      // User has voted before, remove old vote
      if (existingVote === 'up') {
        review.upvotes = Math.max(0, review.upvotes - 1);
      } else {
        review.downvotes = Math.max(0, review.downvotes - 1);
      }
    }
    
    // Add new vote if different from existing
    if (!existingVote || existingVote !== voteType) {
      if (voteType === 'up') {
        review.upvotes += 1;
      } else {
        review.downvotes += 1;
      }
      await redis.set(getUserVoteKey(userId, reviewId), voteType);
      console.log('✓ Added new vote:', voteType);
    } else {
      // Same vote type, remove vote
      await redis.del(getUserVoteKey(userId, reviewId));
      console.log('✓ Removed existing vote');
    }
    
    // Save updated review
    await redis.set(getReviewKey(reviewId), JSON.stringify(review));
    console.log('✓ Updated vote counts - upvotes:', review.upvotes, 'downvotes:', review.downvotes);
    
    res.json({
      status: 'success',
      upvotes: review.upvotes,
      downvotes: review.downvotes,
    });
  } catch (error) {
    console.error('✗ Error voting:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to vote: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Catch-all error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    details: err.message
  });
});

const port = getServerPort();
const server = createServer(app);

server.on('error', (err) => {
  console.error(`Server error: ${err.stack}`);
});

server.listen(port, () => {
  console.log(`🚫 Do NOT Go In There API running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET /api/health - Health check');
  console.log('  GET /api/locations - Get all bathroom locations');
  console.log('  POST /api/reviews - Add a new review');
  console.log('  POST /api/vote - Vote on a review');
});