import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary, then removes the temp file.
 * @param {string} localFilePath - Temp file path from Multer
 * @param {string} folder        - Cloudinary folder
 * @param {"image"|"video"|"auto"} resourceType
 * @returns {Promise<object>}    - Cloudinary upload result
 */
export const uploadOnCloudinary = async (
  localFilePath,
  folder,
  resourceType = "auto"
) => {
  if (!localFilePath) return null;

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: resourceType,
    });
    // Remove temp file after successful upload
    fs.unlinkSync(localFilePath);
    return result;
  } catch (error) {
    // Remove temp file even on failure
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw error;
  }
};

/**
 * Deletes a file from Cloudinary by its public_id.
 * @param {string} publicId
 * @param {"image"|"video"|"auto"} resourceType
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return null;
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

export default cloudinary;
