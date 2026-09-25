import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'ss_vastra_admin_jwt_secret_jaipur_2026';

export interface CustomerPayload {
  uid: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface CustomerAuthRequest extends Request {
  user?: CustomerPayload;
}

export interface AdminPayload {
  id: number;
  adminId: string;
  email?: string;
  name: string;
  role: 'super_admin' | 'staff';
  mustChangePassword?: boolean;
}

export interface AdminAuthRequest extends Request {
  admin?: AdminPayload;
}

// Middleware for Customer verification using JWT
export const requireCustomerAuth = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET) as CustomerPayload;
    req.user = decodedToken;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
};

// Middleware for Admin verification using JWT
export const requireAdminAuth = (allowedRoles: ('super_admin' | 'staff')[] = ['super_admin', 'staff']) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication required' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Super Admin privilege required for this action',
          roleRequired: allowedRoles,
          currentRole: decoded.role,
        });
      }
      req.admin = decoded;
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired admin session' });
    }
  };
};

export const signAdminToken = (payload: AdminPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
};
