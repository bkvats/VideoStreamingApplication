import {v2 as cloudniary} from "cloudinary";
import fs from "fs";
cloudniary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
export default async function uploadOnCloudinary(localFilePath) {
    try {
        if (localFilePath) {
            const result = await cloudniary.uploader.upload(localFilePath, {resource_type: "auto"});
            fs.unlinkSync(localFilePath);
            return result;
        }
    } catch (error) {
        fs.unlinkSync(localFilePath);
    }
}