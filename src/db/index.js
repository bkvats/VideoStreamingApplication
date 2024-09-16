import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
export default async function connectDB() {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("CONNECTED SUCCESFULLY, DB HOST:", connection.connection.host);
    } catch (error) {
        console.log("DATABASE CONNECTION FAILED:", error.message);
        process.exit(1);
    }
}