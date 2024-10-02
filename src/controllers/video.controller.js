import { Video } from "../modles/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 1, sortBy = "createdAt", sortType = 1, userId} = req.query;
    if (!userId) throw new ApiError(401, "No user found");
    const videos = await Video.aggregate([
        {
            $match: {
                owner: userId
            }
        },
        {
            $sort: {
                sortBy: sortType
            }
        }
    ]);
    const options = {page, limit};
    const paginateResult = await Video.aggregatePaginate(videos, options);
    res.status(200).json(new ApiResponse(200, paginateResult, "videos fetched successfully"));
});
export {getAllVideos};