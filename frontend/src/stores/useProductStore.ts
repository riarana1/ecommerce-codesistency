import { create } from 'zustand'
import { isAxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import axios from '../lib/axios'
import type { Product } from '../types'

interface ProductState {
  products: Product[]
  isLoading: boolean
  error: string | null
  setProducts: (products: Product[]) => void
  createProduct: (
    productData: Omit<
      Product,
      '_id' | 'isFeatured' | 'createdAt' | 'updatedAt'
    >,
  ) => Promise<void>
  fetchAllProducts: () => Promise<void>
  fetchProductsByCategory: (categoryId: string) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  toggleFeaturedProduct: (productId: string) => Promise<void>
  fetchFeaturedProducts: () => Promise<void>
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,
  error: null,

  setProducts: (products: Product[]) => set({ products }),
  createProduct: async (
    productData: Omit<
      Product,
      '_id' | 'isFeatured' | 'createdAt' | 'updatedAt'
    >,
  ) => {
    set({ isLoading: true })
    try {
      const res = await axios.post('/products', productData)
      set((prevState) => ({
        products: [...prevState.products, res.data],
        isLoading: false,
      }))
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.error
        : 'An error occurred'
      toast.error(message || 'An error occurred')
      set({ isLoading: false })
    }
  },
  fetchAllProducts: async () => {
    set({ isLoading: true })
    try {
      const response = await axios.get('/products')
      set({ products: response.data.products, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch products', isLoading: false })
      const message = isAxiosError(error)
        ? error.response?.data?.error
        : 'Failed to fetch products'
      toast.error(message || 'Failed to fetch products')
    }
  },
  fetchProductsByCategory: async (category: string) => {
    set({ isLoading: true })
    try {
      const response = await axios.get(`/products/category/${category}`)
      set({ products: response.data.products, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch products', isLoading: false })
      const message = isAxiosError(error)
        ? error.response?.data?.error
        : 'Failed to fetch products'
      toast.error(message || 'Failed to fetch products')
    }
  },
  deleteProduct: async (productId: string) => {
    set({ isLoading: true })
    try {
      await axios.delete(`/products/${productId}`)
      set((prevState) => ({
        products: prevState.products.filter(
          (product) => product._id !== productId,
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      const message = isAxiosError(error)
        ? error.response?.data?.error
        : 'Failed to delete product'
      toast.error(message || 'Failed to delete product')
    }
  },
  toggleFeaturedProduct: async (productId: string) => {
    set({ isLoading: true })
    try {
      const response = await axios.patch(`/products/${productId}`)
      // this will update the isFeatured prop of the product
      set((prevState) => ({
        products: prevState.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: response.data.isFeatured }
            : product,
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      const message = isAxiosError(error)
        ? error.response?.data?.error
        : 'Failed to update product'
      toast.error(message || 'Failed to update product')
    }
  },
  fetchFeaturedProducts: async () => {
    set({ isLoading: true })
    try {
      const response = await axios.get('/products/featured')
      set({ products: response.data, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch products', isLoading: false })
      console.log('Error fetching featured products:', error)
    }
  },
}))
