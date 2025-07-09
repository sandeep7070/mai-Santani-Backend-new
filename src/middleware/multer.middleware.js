import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = file.fieldname + '-' + uniqueSuffix + ext;
        cb(null, name);
    }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, BMP, TIFF, and GIF are allowed.'), false);
  }
};

// File filter for images only
// const fileFilter = (req, file, cb) => {
//     // Check if file is an image
//     if (file.mimetype.startsWith('image/')) {
//         cb(null, true);
//     } else {
//         cb(new Error('Only image files are allowed!'), false);
//     }
// };

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    },
    fileFilter: fileFilter
});


// Different upload configurations
export const uploadConfigs = {
    // Single file upload
    single: (fieldName) => upload.single(fieldName),
    
    // Multiple files from same field
    array: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
    
    // Multiple fields with different file types
    fields: (fieldsArray) => upload.fields(fieldsArray),
    
    // For product-specific uploads
    productImages: upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'productImage', maxCount: 1 },
        { name: 'benefitImages', maxCount: 8 }
    ]),
    
    // Single product image only
    singleProductImage: upload.single('productImage'),
    
    // Multiple benefit images only
    multipleBenefitImages: upload.array('benefitImages', 8)
};

// Error handling middleware for multer
export const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 10MB per file.'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many files. Maximum allowed is 10 files.'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected field name for file upload.'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + error.message
                });
        }
    } else if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
};


export default upload;
