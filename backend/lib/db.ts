import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error connecting to MONGODB:', errorMessage)
    process.exit(1)
  }
}
