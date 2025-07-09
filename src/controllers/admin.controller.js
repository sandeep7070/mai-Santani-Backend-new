import { Admin } from '../models/admin.models.js'
import sendPasswordRestEmail from '../utils/changepassword.js'

const generateAccessTokenandRefreshToken = async (userid) => {
  try {
    const user = await Admin.findById(userid);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Something went wrong while generating tokens");
  }
};

const CreateAdmin = async (req, res) => {
  const {username, email, password, adminType} = req.body

  if (!username || !email || !password || !adminType) {
    return res.status(400).json({
      success: false,
      message: "All fields required!"
    });
  }
     
  try {
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
    });

    if (existingAdmin) {
      return res.status(400).json({
        status: 400,
        message: "Admin already exists",
        success: false
      });
    }
  
    const admin = await Admin.create({
      username,
      email,
      password,
      adminType
    });
  
    return res.status(200).json({
      status: 200,
      message: "Admin Created Successfully",
      success: true,
      data: admin
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Internal Server Error"
    });
  }
}

const adminloging = async (req, res) => {
  const { email, password } = req.body  // Fixed: added password parameter

  if (!email || !password) {  // Fixed: check for both email and password
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Email and password are required"
    });
  }

  try {
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false
      });
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      return res.status(403).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(
      user._id
    );
    
    const loggedInUser = await Admin.findById(user._id).select(  // Fixed: findById not findbyId
      "-password -refreshToken"
    );
    
    const options = {  // Fixed: added missing options declaration
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"  // Only use secure in production
    };
    
    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        data: loggedInUser,
        adminType: loggedInUser.adminType,
        id: loggedInUser._id,
        senderType: "admin",
        success: true,
        accessToken: accessToken,
        refreshToken: refreshToken,  // Fixed: spelling of refreshToken
        message: "Logged in successfully!"
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
}

const logoutAdmin = async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(  // Fixed: spelling of findByIdAndUpdate
      req.user?._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      { new: true }    
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    };

    return res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)  // Fixed: spelling of refreshToken
      .json({
        message: "Admin Logged Out Successfully",
        success: true
      });
  } catch (error) {
    return res.status(500).json({
      message: "Error during logout",
      success: false,
      error: error.message
    });
  }
}

const getAllAdmin = async (req, res) => {
  try {
    const admins = await Admin.find({}).select("-password -refreshToken");
    const count = admins.length;
    console.log("Admin count:", count);
    
    return res.status(200).json({
      data: admins,
      count: count,
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server Error",
      success: false,
      error: error.message
    });
  }
}

function generateOTP() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

const sendMailTochangePassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      message: "Email is required",
      success: false
    });
  }
  
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ 
        message: "Admin not Found",
        success: false
      });
    }
    
    const generatedOTP = generateOTP();
    admin.changepasswordcode = generatedOTP;  // Fixed: variable name and typo
    await admin.save();
    
    const emailSent = await sendPasswordRestEmail(email, generatedOTP);  // Fixed: variable name
    
    if (emailSent) {  // Fixed: logic was inverted
      return res.status(200).json({
        message: "Password reset email sent",
        success: true
      });
    } else {
      return res.status(500).json({
        message: "Failed to send password reset email",
        success: false
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error while sending password reset email",
      success: false,
      error: error.message
    });
  }
}

const changepassword = async (req, res) => {
  const { newPassword, otp, email } = req.body;
  
  if (!newPassword || !otp || !email) {  // Fixed: logic error in condition
    return res.status(400).json({
      message: "New password, OTP, and Email are required!",
      success: false 
    });
  }

  try {
    const admin = await Admin.findOne({
      email: email,
      changepasswordcode: otp,
    });
    
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found or OTP is expired",
        success: false
      });
    }
    
    admin.password = newPassword;
    admin.changepasswordcode = null;
    await admin.save();

    return res.status(200).json({
      message: "Password updated successfully",
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while updating password",
      success: false,
      error: error.message
    });
  }
}

const deleteAdmin = async (req, res) => {
  const { email } = req.body;
  
  try {
    const deletedAdmin = await Admin.findOneAndDelete({ email });

    if (!deletedAdmin) {
      return res.status(404).json({
        message: "Admin Not Found!",
        success: false
      });
    }

    return res.status(200).json({
      data: deletedAdmin,
      message: "Admin Deleted Successfully!",
      success: true  // Fixed: was incorrectly set to false
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error Deleting Admin!",
      success: false,
      error: error.message
    });
  }
}

const getCurrentAdmin = async (req, res) => {
  try {
    const _id = req.user?._id;
    const admin = await Admin.findById(_id).select("-password -refreshToken");
    
    if (!admin) {
      return res.status(404).json({
        message: "Admin Not Found!",
        success: false
      });
    }
    
    return res.status(200).json({
      data: admin,
      message: "Admin Found",
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while getting admin info",
      success: false,
      error: error.message
    });
  }
}

export {
  CreateAdmin,
  adminloging,
  logoutAdmin,
  getAllAdmin,
  sendMailTochangePassword,
  changepassword,
  deleteAdmin,
  getCurrentAdmin
}