import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../modles/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
async function getAccessAndRefreshToken(user) {
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});
        return {accessToken, refreshToken};
    }
    catch (error) {
        throw new ApiError(500, "An error occurred while generating access and refresh token");
    }
}
const registerUser = asyncHandler(async (req, res) => {
    const {userName, email, fullName, password} = req.body;
    if ([userName, email, fullName, password].some((i) => i ? i.trim() === "" : true)) {
        throw new ApiError(400, "All Fields are required");
    }
    const existedUser = await User.findOne({$or: [{userName}, {email}]});
    if (existedUser) throw new ApiError(409, "User Already exists");
    let avatarLocalPath = "";
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) avatarLocalPath = req.files.avatar[0].path;
    let coverImageLocalPath = "";
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) coverImageLocalPath = req.files.coverImage[0].path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");
    const avatarImage = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarImage) throw new ApiError(400, "Error while uploading avatar");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    const user = await User.create({
        fullName,
        avatar: avatarImage.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    });
    const successfullyCreated = await User.findById(user._id)?.select("-password -refreshToken");
    if (!successfullyCreated) throw new ApiError(500, "Somthing went wrong while registering user");
    res.status(201).json(new ApiResponse(200, successfullyCreated, "User Created Successfully"));
});
const deleteUser = asyncHandler(async (req, res) => {
    const isUserDeleted = await User.findOneAndDelete(req.user?._id);
    if (!isUserDeleted) throw new ApiError(500, "Something went wrong");
    const options = {httpOnly: true, secure: true};
    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User deleted Successfully"));
})
const userLogin = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) throw new ApiError(400, "Kindly fill the required fields");
    const user = await User.findOne({email});
    if (!user) throw new ApiError(404, "User does'nt exists");
    if (! await user.checkPassword(password)) throw new ApiError(401, "Invalid login credentials");
    const {accessToken, refreshToken} = await getAccessAndRefreshToken(user);
    let loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {httpOnly: true, secure: true};
    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "LogIn Successfully"));
});
const userLogout = asyncHandler(async (req, res) => {
    const user = req.user;
    await User.findByIdAndUpdate(user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );
    const options = {httpOnly: true, secure: true};
    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "Logged out successfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
    const inputRefreshToken = req.cookies.refreshToken || req.body.refreshToken || req.header("Authorization")?.split(" ")[1];
    if (!inputRefreshToken) throw new ApiError(401, "Unauthorized Access");
    const decodedToken = jwt.verify(inputRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decodedToken) throw new ApiError(401, "Invalid Refresh Token");
    const user = User.findById(decodedToken._id)?.select("-passsword");
    if (user.refreshToken != inputRefreshToken) throw new ApiError(401, "Refresh Token is eitheir expired or used");
    const {newAccessToken, newRefreshToken} = await getAccessAndRefreshToken(user);
    const options = {httpOnly: true, secure: true};
    res.status(200).cookie("accessToken", newAccessToken).cookie("refreshToken", newRefreshToken).json(new ApiResponse(200, {user, accessToken: newAccessToken, refreshToken: newRefreshToken}, "Access Token generated successfully"));
});
const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(401, "Invalid request");
    const {oldPassword, newPassword} = req.body;
    if (!oldPassword || !newPassword) throw new ApiError(400, "All fields are required");
    if (oldPassword == newPassword) throw new ApiError(400, "New password should be different from the old one");
    const isPasswordCorrect = await user.checkPassword(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(401, "Incorrect Old Password");
    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    res.status(200).json(new ApiResponse(200, {}, "Password changed succesfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "success"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;
    if (!fullName || !email) throw new ApiError(400, "required fields are empty");
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {fullName, email}
    }, {new: true}).select("-password -refreshToken");
    res.status(200).json(new ApiResponse(200, user, "Succesfully updated the details"));
});
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar not found");
    const cloud = await uploadOnCloudinary(avatarLocalPath);
    if (!cloud) throw new ApiError(500, "Error while uploading avatar");
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {avatar: cloud.url}
    }, {new: true}).select("-password -refreshToken");
    res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) throw new ApiError(401, "CoverImage not found");
    const cloud = await uploadOnCloudinary(coverImageLocalPath);
    if (!cloud) throw new ApiError(500, "Error while upload cover image");
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {coverImage: cloud.url}
    }, {new: true}).select("-password -refreshToken");
    res.status(200).json(new ApiResponse(200, user, "Cover Image Uploaded successfully"));
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {userName} = req.params;
    if (!userName?.trim()) throw new ApiError(400, "Username is missing");
    const channel = await User.aggregate([
        {
            $match: {
                userName: userName.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                email: 1,
                userName: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ]);
    if (!channel?.length) throw new ApiError(404, "Channel not found");
    res.status(200).json(new ApiResponse(200, channel[0], "channel found successfully"));
});
const getUserWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);
    res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history retrieved successfully"));
});
export { registerUser, deleteUser, userLogin, userLogout, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile, getUserWatchHistory };