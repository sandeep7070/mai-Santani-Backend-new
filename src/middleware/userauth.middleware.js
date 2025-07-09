import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies.accessToken || 
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Find user and check if token hasn't been revoked
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Invalid or expired token',
      error: error.message 
    });
  }
};