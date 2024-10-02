import { Router } from "express";
import { getAllVideos } from "../controllers/video.controller.js";
const videoRouter = Router();
videoRouter.route("/").get(getAllVideos);
export default videoRouter;