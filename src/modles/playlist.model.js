import mongoose from "mongoose";
const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    videos: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true});
export const Playlist = mongoose.Model("Playlist", playlistSchema);