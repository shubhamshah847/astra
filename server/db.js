import mongoose from 'mongoose';

// Connect to MongoDB using the address from the .env file
export async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Add it to server/.env');
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
}
