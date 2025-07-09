import { User } from '../models/user.models.js';

// Consistent spacing
// import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const generateTokensAndSetCookies = (user, res) => {
  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refreshToken to database
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });

  // Set cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return { accessToken, refreshToken };
};

 const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user'
    });

    // Generate tokens and set cookies
    generateTokensAndSetCookies(user, res);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Registration failed',
      error: error.message 
    });
  }
};
            
 const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens and set cookies
    generateTokensAndSetCookies(user, res);

    // Return user without sensitive data
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    
    res.json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message 
    });
  }
};

 const logoutUser = async (req, res) => {
  try {
    // Clear refresh token in DB
    await User.findByIdAndUpdate(
      req.user.id,
      { $set: { refreshToken: null } },
      { new: true }
    );

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Logout failed',
      error: error.message 
    });
  }
};

 const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching profile',
      error: error.message 
    });
  }
};

 const updateUserProfile = async (req, res) => {
  try {
    const { username, profile } = req.body;
    const updateData = { username, profile };

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Profile update failed',
      error: error.message 
    });
  }
};

 const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isMatch = await user.isPasswordCorrect(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all sessions by clearing refresh token
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    res.status(400).json({ 
      message: 'Password change failed',
      error: error.message 
    });
  }
};

 const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token (this will be sent to the user)
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In a real application, you would send an email here
    // For now, we'll just return the token (for testing purposes)
    res.json({
      message: 'Password reset token generated',
      resetToken,
      expires: user.passwordResetExpires
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Password reset failed',
      error: error.message 
    });
  }
};

 const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token to compare with stored
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check expiration
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all sessions
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Password reset successfully. Please log in again.' });
  } catch (error) {
    res.status(400).json({ 
      message: 'Password reset failed',
      error: error.message 
    });
  }
};

 const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!incomingRefreshToken) {
      return res.status(401).json({ message: 'Unauthorized - No refresh token' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token - user not found' });
    }

    // Check if token matches
    if (incomingRefreshToken !== user.refreshToken) {
      return res.status(401).json({ message: 'Refresh token is expired or used' });
    }

    // Generate new access token
    const accessToken = user.generateAccessToken();

    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({ 
      message: 'Access token refreshed',
      accessToken 
    });
  } catch (error) {
    res.status(401).json({ 
      message: 'Invalid refresh token',
      error: error.message 
    });
  }
};

 const getAllUsers = async (req, res) => {
  try {
    // Only allow admins
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    const users = await User.find().select('-password -refreshToken');
    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching users',
      error: error.message 
    });
  }
};
 const updateUserRole = async (req, res) => {
  try {
    // Only allow admins
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    const { role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Role update failed',
      error: error.message 
    });
  }
};

 const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Forbidden - Not authorized' });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear cookies if self-deletion
    if (req.user.id === userId) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'User deletion failed',
      error: error.message 
    });
  }
};


export {
    registerUser, 
loginUser,
    logoutUser,
    forgotPassword,
    getUserProfile,
    updateUserProfile,
    changePassword,
    resetPassword,
    refreshAccessToken,
    getAllUsers,
    updateUserRole,
    deleteUser
}