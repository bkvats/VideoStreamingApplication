import { Router } from "express";
import { refreshAccessToken, registerUser, userLogin, userLogout } from "../controllers/user.controller.js";
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
userRouter.route("/logout").post(verifyJWT, userLogout);
userRouter.route("/refresh-token").post(refreshAccessToken);
export default userRouter;