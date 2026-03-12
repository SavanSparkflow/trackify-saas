const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (base64Image, folderName = "attendance") => {
    try {
        const response = await cloudinary.uploader.upload(base64Image, {
            folder: `trackify/${folderName}`,
            resource_type: "auto"
        });
        return response.secure_url;
    } catch (error) {
        console.error("Cloudinary upload Error:", error);
        return null;
    }
};

module.exports = { uploadToCloudinary };
