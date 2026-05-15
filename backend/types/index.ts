import { IUser } from '../models/user.model.js'
import { Request } from 'express'

export type AuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> = Request<P, ResBody, ReqBody, ReqQuery> & {
  user?: IUser
}

export type CheckoutProduct = {
  _id: string // Assuming product ID is a string
  name: string
  image: string
  price: number
  quantity: number
}

export type CreateCheckoutSessionRequestBody = {
  products: CheckoutProduct[]
  couponCode?: string
}
