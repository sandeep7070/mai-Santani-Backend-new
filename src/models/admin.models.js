import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const adminSchema = new Schema(
  {
    username: {
      type: String,  
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    changepasswordcode: {
      type: String
    },
    adminType: {
      type: String,
      enum: ["Admin", "Manager", "Hr"],
      required: true,
    },
    accessToken: { type: String },
    refreshToken: { type: String },
    massage: [
      {
        message: String,
        sender: {
          type: String,
        },
        receiver: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },       
        status: {
          type: String,
          enum: ['sent', 'delivered', 'read'],
          default: 'sent'
        },
        read: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
adminSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,                   
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const Admin = mongoose.model("Admin", adminSchema);
