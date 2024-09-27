import { Router } from "express";
import { changePassword, deleteUser, getCurrentUser, getUserChannelProfile, getUserWatchHistory, refreshAccessToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage, userLogin, userLogout } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter = Router();
userRouter.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }]
), registerUser);
userRouter.route("/login").post(userLogin);
// SECURED ROUTES
userRouter.route("/delete-user").delete(verifyJWT, deleteUser);
userRouter.route("/logout").post(verifyJWT, userLogout);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/change-password").post(verifyJWT, changePassword);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/update-details").patch(verifyJWT, updateAccountDetails);
userRouter.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
userRouter.route("/change-coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
userRouter.route("/channel/:userName").get(verifyJWT, getUserChannelProfile);
userRouter.route("/watchHistory").get(verifyJWT, getUserWatchHistory);
export default userRouter;