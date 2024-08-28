import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String,
        required: true,
        unique: true
    },
    thumbnail: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: "true"
    },
    description: {type: String},
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        required: true,
        default: 0
    },
    isPublished: {
        type: boolean,
        required: true,
        default: true
    }
}, {timestamps: true});
videoSchema.plugin(mongooseAggregatePaginate);
export default Video = mongoose.Model("Video", videoSchema);