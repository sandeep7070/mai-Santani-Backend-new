import mongoose from "mongoose";

const HeroSectionSchema = new mongoose.Schema({
      
    bannerImage: {
          type: String,
      },
      title: {
          type: String,
      },
     coverImage: {
          type: String,
      },
});

export const HeroSection = mongoose.model("HeroSection", HeroSectionSchema);