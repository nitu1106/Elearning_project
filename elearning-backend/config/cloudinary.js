const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for course videos
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'elearning/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
  },
});

// Storage for course materials (PDFs, docs)
const materialStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'elearning/materials',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
  },
});

// Storage for thumbnails/images
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'elearning/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, quality: 'auto' }],
  },
});

const uploadVideo    = multer({ storage: videoStorage });
const uploadMaterial = multer({ storage: materialStorage });
const uploadImage    = multer({ storage: imageStorage });

module.exports = { cloudinary, uploadVideo, uploadMaterial, uploadImage };
