import express from 'express'
import { adminRoute, protectRoute } from '../middleware/auth.middleware.js'
import {
  getAnalyticsData,
  getDailySalesData,
} from '../controllers/analytics.controller.js'
import { AuthRequest } from '../types/index.js' // Import AuthRequest if needed for other routes, though not directly used here

const router = express.Router()

router.get('/', protectRoute, adminRoute, async (_req: AuthRequest, res) => {
  try {
    const analyticsData = await getAnalyticsData()

    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const dailySalesData = await getDailySalesData(startDate, endDate)

    res.json({
      analyticsData,
      dailySalesData,
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in analytics route:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
})

export default router
