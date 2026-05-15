import { Request, Response, NextFunction } from 'express'

import { redis } from '../lib/redis.js'
import cloudinary from '../lib/cloudinary.js'
import Product, { IProduct } from '../models/product.model.js' // Import IProduct

export const getAllProducts = async (
  req: Request, // Already typed
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await Product.find({}) // find all products
    res.json({ products })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in getAllProducts controller:', errorMessage) // Use console.error
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    let featuredProductsString = await redis.get('featured_products')
    if (featuredProductsString) {
      return res.json(JSON.parse(featuredProductsString))
    }

    // if not in redis, fetch from mongodb
    const featuredProducts: IProduct[] = await Product.find({
      isFeatured: true,
    }).lean()

    if (featuredProducts.length === 0) {
      // Check for empty array instead of !featuredProducts
      return res.status(404).json({ message: 'No featured products found' })
    }

    // store in redis for future quick access
    await redis.set('featured_products', JSON.stringify(featuredProducts))

    res.json(featuredProducts)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in getFeaturedProducts controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

interface CreateProductRequestBody {
  name: string
  description: string
  price: number
  image?: string
  category: string
}

export const createProduct = async (
  req: Request<{}, {}, CreateProductRequestBody>,
  res: Response,
) => {
  try {
    const { name, description, price, image, category } = req.body

    let cloudinaryResponse: { secure_url: string } | null = null

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: 'products',
      })
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url || '', // Use || "" for default empty string
      category,
    })

    res.status(201).json(product)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in createProduct controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const deleteProduct = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    if (product.image) {
      const publicId = product.image.split('/').pop()?.split('.')[0] // Use optional chaining
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`)
          console.log('deleted image from cloudinary')
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'An unknown error occurred'
          console.error('error deleting image from cloudinary:', errorMessage)
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id)

    res.json({ message: 'Product deleted successfully' })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in deleteProduct controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const getRecommendedProducts = async (req: Request, res: Response) => {
  try {
    const products: IProduct[] = await Product.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ])

    res.json(products)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in getRecommendedProducts controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const getProductsByCategory = async (
  req: Request<{ category: string }>,
  res: Response,
) => {
  const { category } = req.params
  try {
    const products: IProduct[] = await Product.find({ category })
    res.json({ products })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in getProductsByCategory controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

export const toggleFeaturedProduct = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const product = await Product.findById(req.params.id)
    if (product) {
      product.isFeatured = !product.isFeatured
      const updatedProduct = await product.save()
      await updateFeaturedProductsCache()
      res.json(updatedProduct)
    } else {
      res.status(404).json({ message: 'Product not found' })
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in toggleFeaturedProduct controller:', errorMessage)
    res.status(500).json({ message: 'Server error', error: errorMessage })
  }
}

async function updateFeaturedProductsCache() {
  try {
    // The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

    const featuredProducts: IProduct[] = await Product.find({
      isFeatured: true,
    }).lean()
    await redis.set('featured_products', JSON.stringify(featuredProducts))
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in update cache function:', errorMessage)
  }
}
