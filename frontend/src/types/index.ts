export type Product = {
  _id: string
  name: string
  description?: string | null
  price: number
  image: string
  category?: string
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}

export type Category = {
  _id?: string
  name?: string
  href?: string
  imageUrl?: string
}

export type User = {
  _id: string
  name: string
  email: string
  role: string
}

export type CartItem = Product & {
  quantity: number
}

export type Coupon = {
  code: string
  discountPercentage: number
}

export type AnalyticsData = {
  users: number
  products: number
  totalSales: number
  totalRevenue: number
}

export type DailySalesData = {
  name: string
  sales: number
  revenue: number
}
