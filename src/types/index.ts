export type FluidType = 'engine_oil' | 'atf' | 'mtf' | 'cvt' | 'dsg' | 'gear_oil' | 'transfer_case' | 'psf' | 'coolant' | 'brake_fluid';

export interface Product {
  id: string;
  brand_name: 'Ravenol' | 'Motul' | 'BARDAHL' | 'Moly Green';
  product_name: string;
  category: FluidType;
  viscosity: string;
  base_technology?: string;
  article_number?: string;
  approvals: string[];
  notes?: string;
  description?: string;
}

export interface Recommendation {
  unit: string;
  fluid_type: FluidType;
  factory_viscosity: string;
  recommended_viscosity: string;
  specification: string;
  approval: string;
  volume_liters: number;
  replacement_interval: string;
  products: Product[];
}

export interface CarData {
  id: string;
  brand: string;
  model: string;
  year_from: number;
  year_to: number;
  generation: string;
  engine: string;
  engine_code: string;
  engine_type: 'petrol' | 'diesel' | 'hybrid' | 'gas';
  drive: 'fwd' | 'rwd' | 'awd';
  transmission_type: 'mt' | 'at' | 'cvt' | 'dsg';
  recommendations: Recommendation[];
}

export type UserRole = 'admin' | 'moderator' | 'user';

export interface UserProfile {
  uid: string;
  nickname: string;
  email: string;
  role: UserRole;
  createdAt: number;
  activePromoCode?: PromoCode | null;
}

export interface PromoCode {
  code: string;
  expiresAt: number;
  maxAttempts: number;
  createdBy: string;
  createdAt: number;
}
