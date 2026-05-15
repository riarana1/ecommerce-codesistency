import { Request, Response, NextFunction } from 'express'
import Coupon from '../models/coupon.model.js'

import { AuthRequest } from '../types/index.js'

export const getCoupon = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    })
    res.json(coupon || null)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.log('Error in getCoupon controller', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user._id,
      isActive: true,
    })

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' })
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false
      await coupon.save()
      return res.status(404).json({ message: 'Coupon expired' })
    }

    res.json({
      message: 'Coupon is valid',
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.log('Error in validateCoupon controller', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}
