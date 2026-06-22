import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
    process.exit(0);
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
}

test();