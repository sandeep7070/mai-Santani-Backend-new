import mongoose from "mongoose";

const HeroSectionSchema = new mongoose.Schema({
    bannerImage: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        required: true
    },
}, { timestamps: true });

export const HeroSection = mongoose.model("HeroSection", HeroSectionSchema);