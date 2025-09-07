const express = require('express');
const { query } = require('../supabase');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// POST /api/history — Add new detection
router.post('/', authenticateToken, async (req, res) => {
  const { people_count, image_url } = req.body;
  const user_id = req.user.id;

  if (!people_count) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const result = await query(
      `INSERT INTO detection_history 
       (user_id, people_count, image_url, detected_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, user_id, people_count, image_url, detected_at`,
      [user_id, people_count, image_url || null]
    );

    res.status(201).json({ 
      message: 'Detection recorded',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error recording detection:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'An error occurred while recording detection',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /api/history — Get user history
router.get('/', authenticateToken, async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  const userId = req.user.id;

  try {
    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM detection_history WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const result = await query(
      `SELECT id, user_id, people_count, image_url, detected_at 
       FROM detection_history 
       WHERE user_id = $1 
       ORDER BY detected_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    res.json({
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Error fetching history:', {
      message: err.message,
      stack: err.stack
    });
    
    res.status(500).json({ 
      error: 'An error occurred while fetching history',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /api/history/summary - Get summary statistics
router.get('/summary', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.user.id;

  try {
    let queryParams = [userId];
    let dateFilter = '';
    
    // Build date filter if provided
    if (startDate && endDate) {
      queryParams.push(startDate, endDate);
      dateFilter = 'AND detected_at BETWEEN $2 AND $3';
    } else if (startDate) {
      queryParams.push(startDate);
      dateFilter = 'AND detected_at >= $2';
    } else if (endDate) {
      queryParams.push(endDate);
      dateFilter = 'AND detected_at <= $2';
    }

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_detections,
        COALESCE(SUM(people_count), 0) as total_people,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND(AVG(people_count)::numeric, 2)
          ELSE 0 
        END as average_people,
        MAX(detected_at) as last_detection
      FROM detection_history
      WHERE user_id = $1
      ${dateFilter}
    `;

    const result = await query(summaryQuery, queryParams);
    const summary = result.rows[0];

    res.json({
      totalDetections: parseInt(summary.total_detections),
      totalPeople: parseInt(summary.total_people),
      averagePeople: parseFloat(summary.average_people),
      lastDetection: summary.last_detection
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
