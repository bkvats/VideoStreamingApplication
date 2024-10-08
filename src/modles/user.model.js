import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: [true, "Password Required.."],
    },
    refreshToken: {type: String},
    avatar: {
        type: String,
        required: true,
    },
    coverImage: {type: String},
    watchHistory: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }],
    }
}, {timestamps: true});
userSchema.pre("save", async function(next) {
    if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 8);
    next();
});
userSchema.methods.checkPassword = async function(inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
}
userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        userName: this.userName,
        email: this.email,
        fullName: this.fullName
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY});
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRY});
}
export const User = mongoose.model("User", userSchema);