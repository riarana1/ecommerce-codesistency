import { create } from 'zustand'
import { isAxiosError } from 'axios'
import axios from '../lib/axios'
import { toast } from 'react-hot-toast'
import type { Product, CartItem, Coupon } from '../types'

interface CartState {
  cart: CartItem[]
  coupon: Coupon | null
  total: number
  subtotal: number
  isCouponApplied: boolean
  getMyCoupon: () => Promise<void>
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => void
  getCartItems: () => Promise<void>
  clearCart: () => Promise<void>
  addToCart: (product: Product) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  calculateTotals: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [] as CartItem[],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  getMyCoupon: async () => {
    try {
      const response = await axios.get('/coupons')
      set({ coupon: response.data })
    } catch (error) {
      console.error('Error fetching coupon:', error)
    }
  },
  applyCoupon: async (code: string) => {
    try {
      const response = await axios.post('/coupons/validate', { code })
      set({ coupon: response.data, isCouponApplied: true })
      get().calculateTotals()
      toast.success('Coupon applied successfully')
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : 'Failed to apply coupon'
      toast.error(message || 'Failed to apply coupon')
    }
  },
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false })
    get().calculateTotals()
    toast.success('Coupon removed')
  },

  getCartItems: async () => {
    try {
      const res = await axios.get('/cart')
      set({ cart: res.data })
      get().calculateTotals()
    } catch (error) {
      set({ cart: [] })
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : 'An error occurred'
      toast.error(message || 'An error occurred')
    }
  },
  clearCart: async () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0 })
  },
  addToCart: async (product: Product) => {
    try {
      await axios.post('/cart', { productId: product._id })
      toast.success('Product added to cart')

      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) => item._id === product._id,
        )
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [...prevState.cart, { ...product, quantity: 1 }]
        return { cart: newCart }
      })
      get().calculateTotals()
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : 'An error occurred'
      toast.error(message || 'An error occurred')
    }
  },
  removeFromCart: async (productId: string) => {
    await axios.delete(`/cart`, { data: { productId } })
    set((prevState) => ({
      cart: prevState.cart.filter((item) => item._id !== productId),
    }))
    get().calculateTotals()
  },
  updateQuantity: async (productId: string, quantity: number) => {
    if (quantity === 0) {
      get().removeFromCart(productId)
      return
    }

    await axios.put(`/cart/${productId}`, { quantity })
    set((prevState) => ({
      cart: prevState.cart.map((item) =>
        item._id === productId ? { ...item, quantity } : item,
      ),
    }))
    get().calculateTotals()
  },
  calculateTotals: () => {
    const { cart, coupon } = get()
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
    let total = subtotal

    if (coupon) {
      const discount = subtotal * (coupon.discountPercentage / 100)
      total = subtotal - discount
    }

    set({ subtotal, total })
  },
}))
