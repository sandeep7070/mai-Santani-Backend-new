// import { uploadOnCloudinary } from '../utils/cloudinary.js';
// import { HeroSection } from "../models/heroSection.model.js";

// const createHeroSection = async (req, res) => {
//     try {
//         const { title } = req.body;
//         const bannerFile = req.files?.bannerImage?.[0];
//         const coverFile = req.files?.coverImage?.[0];

//         if (!req.files || !req.files.bannerImage || !req.files.coverImage) {
//             return res.status(400).json({
//                 status: 400,
//                 success: false,
//                 message: "Both banner image and cover image files are required"
//             });
//         }

//         if (!title) {
//             return res.status(400).json({
//                 status: 400,
//                 success: false,
//                 message: "Title is required"
//             });
//         }

//         if (!bannerFile || !coverFile) {
//             return res.status(400).json({
//                 status: 400,
//                 success: false,
//                 message: "Both banner image and cover image are required"
//             });
//         }

//         const [bannerResponse, coverResponse] = await Promise.all([
//             uploadOnCloudinary(bannerFile),
//             uploadOnCloudinary(coverFile)
//         ]);

//         if (!bannerResponse || !coverResponse) {
//             return res.status(400).json({
//                 status: 400,
//                 success: false,
//                 message: "Image upload failed"
//             });
//         }

//         const heroSection = await HeroSection.create({
//             title,
//             bannerImage: bannerResponse.secure_url,
//             coverImage: coverResponse.secure_url
//         });

//         return res.status(201).json({
//             status: 201,
//             success: true,
//             message: "Hero section created successfully",
//             data: heroSection
//         });

//     } catch (error) {
//         console.error("Error creating hero section:", error);
//         return res.status(500).json({
//             status: 500,
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// const getAllHeroSection = async (req, res) => {
//     try {
//         const heroSections = await HeroSection.find();
        
//         if (!heroSections || heroSections.length === 0) {
//             return res.status(404).json({
//                 status: 404,
//                 success: false,
//                 message: "No hero sections found"
//             });
//         }

//         return res.status(200).json({
//             status: 200,
//             success: true,
//             message: "Hero sections fetched successfully",
//             data: heroSections
//         });

//     } catch (error) {
//         console.error("Error fetching hero sections:", error);
//         return res.status(500).json({
//             status: 500,
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// const getHeroSectionById = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Validate MongoDB ObjectId
//         if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
//             return res.status(400).json({
//                 status: 400,
//                 success: false,
//                 message: "Invalid hero section ID format"
//             });
//         }

//         const heroSection = await HeroSection.findById(id);
        
//         if (!heroSection) {
//             return res.status(404).json({
//                 status: 404,
//                 success: false,
//                 message: "Hero section not found"
//             });
//         }

//         return res.status(200).json({
//             status: 200,
//             success: true,
//             message: "Hero section fetched successfully",
//             data: heroSection
//         });

//     } catch (error) {
//         console.error("Error fetching hero section:", error);
//         return res.status(500).json({
//             status: 500,
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// const deleteHeroSection = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Validate MongoDB ObjectId
//         if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
//             return res.status(400).json({
//                 status: 400,
//                 success: false,
//                 message: "Invalid hero section ID format"
//             });
//         }

//         const deletedHeroSection = await HeroSection.findByIdAndDelete(id);

//         if (!deletedHeroSection) {
//             return res.status(404).json({
//                 status: 404,
//                 success: false,
//                 message: "Hero section not found"
//             });
//         }

//         return res.status(200).json({
//             status: 200,
//             success: true,
//             message: "Hero section deleted successfully",
//             data: deletedHeroSection
//         });

//     } catch (error) {
//         console.error("Error deleting hero section:", error);
//         return res.status(500).json({
//             status: 500,
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// const updateHeroSection = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { title } = req.body;
//         const bannerFile = req.files?.bannerImage?.[0];
//         const coverFile = req.files?.coverImage?.[0];

//         // Validate MongoDB ObjectId
//         if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
//             return res.status(400).json({
//                 status: 400,
//                 success: false,
//                 message: "Invalid hero section ID format"
//             });
//         }

//         // Check if hero section exists
//         const existingHeroSection = await HeroSection.findById(id);
//         if (!existingHeroSection) {
//             return res.status(404).json({
//                 status: 404,
//                 success: false,
//                 message: "Hero section not found"
//             });
//         }

//         // Prepare update data
//         const updateData = {};
        
//         if (title) {
//             updateData.title = title;
//         }

//         // Handle image uploads if provided
//         if (bannerFile || coverFile) {
//             const uploadPromises = [];
            
//             if (bannerFile) {
//                 uploadPromises.push(uploadOnCloudinary(bannerFile));
//             }
            
//             if (coverFile) {
//                 uploadPromises.push(uploadOnCloudinary(coverFile));
//             }

//             const uploadResults = await Promise.all(uploadPromises);
            
//             let resultIndex = 0;
//             if (bannerFile) {
//                 const bannerResponse = uploadResults[resultIndex++];
//                 if (!bannerResponse) {
//                     return res.status(400).json({
//                         status: 400,
//                         success: false,
//                         message: "Banner image upload failed"
//                     });
//                 }
//                 updateData.bannerImage = bannerResponse.secure_url;
//             }

//             if (coverFile) {
//                 const coverResponse = uploadResults[resultIndex++];
//                 if (!coverResponse) {
//                     return res.status(400).json({
//                         status: 400,
//                         success: false,
//                         message: "Cover image upload failed"
//                     });
//                 }
//                 updateData.coverImage = coverResponse.secure_url;
//             }
//         }

//         // Check if there's something to update
//         if (Object.keys(updateData).length === 0) {
//             return res.status(400).json({
//                 status: 400,
//                 success: false,
//                 message: "No valid fields provided for update"
//             });
//         }

//         const updatedHeroSection = await HeroSection.findByIdAndUpdate(
//             id,
//             updateData,
//             { new: true, runValidators: true }
//         );

//         return res.status(200).json({
//             status: 200,
//             success: true,
//             message: "Hero section updated successfully",
//             data: updatedHeroSection
//         });

//     } catch (error) {
//         console.error("Error updating hero section:", error);
//         return res.status(500).json({
//             status: 500,
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// export {
//     createHeroSection,
//     getAllHeroSection,
//     getHeroSectionById,
//     deleteHeroSection,
//     updateHeroSection
// };