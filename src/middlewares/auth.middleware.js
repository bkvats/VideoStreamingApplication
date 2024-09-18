import { User } from "../modles/user.model";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization").split(" ")[1];
        if (!token) throw new ApiError(400, "Unauthorised Access");
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) throw new ApiError(401, "Invalid Access Token");
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong in jwt verify");
    }
})