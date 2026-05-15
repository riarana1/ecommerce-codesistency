import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IProduct extends Document {
  name: string
  description: string
  price: number
  image?: string
  category: string
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}

const productSchema: Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    category: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

const Product = mongoose.model<IProduct>('Product', productSchema)

export default Product
