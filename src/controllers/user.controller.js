import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../modles/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
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
    if ([userName, email, fullName, password].some((i) => i?.trim() === "")) {
        throw new ApiError(400, "All Fields are required");
    }
    const existedUser = await User.findOne({$or: [{userName}, {email}]});
    if (existedUser) throw new ApiError(409, "User Already exists");
    let avatarLocalPath = "";
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) avatarLocalPath = req.files.avatar[0].path;
    let coverImageLocalPath = "";
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) coverImageLocalPath = req.files.coverImage[0].path;
    if (!avatarLocalPath) throw new ApiError(409, "Avatar is required....");
    const avatarImage = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarImage) throw new ApiError(409, "Avatar is required");
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
    if (!successfullyCreated) throw new ApiError("Somthing went wrong while registering user");
    res.status(201).json(new ApiResponse(200, successfullyCreated, "User Created Successfully"));
});
const userLogin = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    console.log(email, password);
    if (!email || !password) throw new ApiError(400, "Kindly fill the required fields");
    const user = await User.findOne({email});
    if (!user) throw new ApiError(404, "User does'nt exists");
    // const isPasswordCorrect = await user.checkPassword(password);
    // console.log(isPasswordCorrect);
    if (! await user.checkPassword(password)) throw new ApiError(401, "Invalid login credentials");
    console.log("after password....");
    const {accessToken, refreshToken} = await getAccessAndRefreshToken(user);
    let loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {httpOnly: true, secure: true};
    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "LogIn Successfully"));
});
const userLogout = asyncHandler(async (req, res) => {
    const user = req.user;
    console.log("in logout user:", user);
    await User.findByIdAndUpdate(user._id,
        {
            refreshToken: ""
        },
        {
            new: true
        }
    );
    const options = {httpOnly: true, secure: true};
    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "Logged out successfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
    const inputRefreshToken = req.cookies.refresToken || req.body.refreshToken || req.header("Authorization")?.split(" ")[1];
    if (!inputRefreshToken) throw new ApiError(401, "Unauthorized Access");
    const decodedToken = jwt.verify(inputRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decodedToken) throw new ApiError(401, "Invalid Refresh Token");
    const user = User.findById(decodedToken._id)?.select("-passsword");
    if (user.refreshToken != inputRefreshToken) throw new ApiError(401, "Refresh Token is eitheir expired or used");
    const {newAccessToken, newRefreshToken} = await getAccessAndRefreshToken(user);
    const options = {httpOnly: true, secure: true};
    res.status(200).cookie("accessToken", newAccessToken).cookie("refreshToken", newRefreshToken).json(new ApiResponse(200, {user, accessToken: newAccessToken, refreshToken: newRefreshToken}, "Access Token generated successfully"));
});
export { registerUser, userLogin, userLogout, refreshAccessToken};