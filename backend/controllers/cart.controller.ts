import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose' // Import Types for ObjectId
import Product, { IProduct } from '../models/product.model.js'

import { AuthRequest } from '../types/index.js'

export const getCartProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user.cartItems) {
      return res.status(400).json({ message: 'User or cart items not found' })
    }

    const productIds = req.user.cartItems.map((item) => item.product)
    const products: IProduct[] = await Product.find({
      _id: { $in: productIds },
    })

    // add quantity for each product
    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.product.toString() === product._id.toString(),
      )
      return { ...product.toJSON(), quantity: item?.quantity || 0 } // Use optional chaining and default quantity
    })

    res.json(cartItems)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in getCartProducts controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body
    const user = req.user

    if (!user) return res.status(401).json({ message: 'User not found' })

    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId,
    )

    if (existingItem) {
      existingItem.quantity += 1
    } else if (productId) {
      // Ensure productId exists before pushing
      user.cartItems.push({
        product: new Types.ObjectId(productId),
        quantity: 1,
      })
    } else {
      return res.status(400).json({ message: 'Product ID is required' })
    }

    await user.save()
    res.json(user.cartItems)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in addToCart controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const removeAllFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body
    const user = req.user
    if (!user) return res.status(400).json({ message: 'User not found' })

    if (!productId) {
      user.cartItems = []
    } else {
      user.cartItems = user.cartItems.filter(
        (item) => item.product.toString() !== productId,
      )
    }
    await user.save()
    res.json(user.cartItems)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const updateQuantity = async (
  req: AuthRequest<{ id: string }>,
  res: Response,
) => {
  try {
    const { id: productId } = req.params
    const { quantity } = req.body
    const user = req.user
    if (!user) return res.status(400).json({ message: 'User not found' })
    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId,
    )

    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(
          (item) => item.product.toString() !== productId,
        )
        await user.save()
        return res.json(user.cartItems)
      }

      existingItem.quantity = quantity
      await user.save()
      res.json(user.cartItems)
    } else {
      res.status(404).json({ message: 'Product not found' })
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in updateQuantity controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}
