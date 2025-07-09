import jwt from "jsonwebtoken";
import  {Admin}  from "../models/admin.models.js";

export const verifyJWT = async (req, res, next) => {
  try {
    // Get token from cookies or authorization header
    const token = req.cookies?.accessToken || 
                  req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request - No token provided"
      });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user
    const user = await Admin.findById(decodedToken?._id).select("-password -refreshToken");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Access Token"
      });
    }

    // Attach the user to the request object
    req.user = user;
    next();
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error?.message || "Invalid access token"
    });
  }
};

