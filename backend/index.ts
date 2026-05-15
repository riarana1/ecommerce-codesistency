import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import path from 'path'
import cors from 'cors'

import authRoutes from './routes/auth.route.js'
import productRoutes from './routes/product.route.js'
import cartRoutes from './routes/cart.route.js'
import couponRoutes from './routes/coupon.route.js'
import paymentRoutes from './routes/payment.route.js'
import analyticsRoutes from './routes/analytics.route.js'

import { connectDB } from './lib/db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true,
  }),
)

const __dirname = path.resolve()

app.use(express.json({ limit: '10mb' })) // allows you to parse the body of the request
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/analytics', analyticsRoutes)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/dist')))

  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
  })
}

const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
  }
}

startServer()
