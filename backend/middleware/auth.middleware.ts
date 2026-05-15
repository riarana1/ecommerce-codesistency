import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import User, { IUser } from '../models/user.model.js'
import { AuthRequest } from '../types/index.js'

export const protectRoute = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accessToken = req.cookies.accessToken

    if (!accessToken) {
      return res
        .status(401)
        .json({ message: 'Unauthorized - No access token provided' })
    }

    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET!,
      ) as JwtPayload
      const user = await User.findById(decoded.userId).select('-password')

      if (!user) {
        return res.status(401).json({ message: 'User not found' })
      }

      req.user = user

      next()
    } catch (error: unknown) {
      // Explicitly type error as unknown
      if (error instanceof jwt.TokenExpiredError) {
        return res
          .status(401)
          .json({ message: 'Unauthorized - Access token expired' })
      }
      if (error instanceof jwt.JsonWebTokenError) {
        // Handle other JWT errors like invalid signature
        return res
          .status(401)
          .json({ message: `Unauthorized - Invalid token: ${error.message}` })
      }
      // For any other unexpected errors during token verification or user lookup
      console.error('Error during token verification or user lookup:', error)
      return res
        .status(401)
        .json({ message: 'Unauthorized - Invalid access token' })
    }
  } catch (error: unknown) {
    // Explicitly type error as unknown
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error in protectRoute middleware:', errorMessage) // Use console.error for errors
    return res.status(401).json({ message: `Unauthorized - ${errorMessage}` })
  }
}

export const adminRoute = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role === 'admin') {
    // Use optional chaining for cleaner access
    next()
  } else {
    return res.status(403).json({ message: 'Access denied - Admin only' }) // Ensure adminRoute always sends a response
  }
}
