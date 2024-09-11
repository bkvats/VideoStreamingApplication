import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../modles/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
// const registerUser = (req, res) => {
//     res.code(200).json({message: "success"});
// }
const registerUser = asyncHandler(async (req, res) => {
    const {userName, email, fullName, password} = req.body;
    if ([userName, email, fullName, password].some((i) => i?.trim() === "")) {
        throw new ApiError(400, "All Fields are required");
    }
    const existedUser = User.findOne({$or: [userName, email]});
    if (existedUser) throw new ApiError(409, "User Already exists");
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) throw new ApiError(409, "Avatar is required...");
    const avatarImage = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarImage) throw new ApiError("Avatar is required");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    });
    const successfullyCreated = await User.findById(user._id).select("-password -refreshToken");
    if (!successfullyCreated) throw new ApiError("Somthing went wrong while registering user");
    res.sendStatus(201).json(new ApiResponse(200, successfullyCreated, "User Created Successfully"));
})
export default registerUser;