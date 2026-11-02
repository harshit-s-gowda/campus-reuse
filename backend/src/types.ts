export type Role = 'STUDENT' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type ProductStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type TransactionType = 'SALE' | 'EXCHANGE' | 'RENTAL';

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  department: string | null;
  studentId: string | null;
  profileImage: string | null;
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface Product {
  id: number;
  sellerId: number;
  sellerName?: string;
  sellerEmail?: string;
  title: string;
  description: string;
  category: string;
  subject: string;
  course: string;
  department: string;
  semester: string;
  authorOrBrand: string;
  originalPrice: number;
  sellingPrice: number;
  condition: string;
  transactionType: TransactionType;
  campusLocation: string;
  images: string[];
  status: ProductStatus;
  rejectionReason: string | null;
  isActive: boolean;
  popularity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  recipientId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Order {
  id: number;
  buyerId: number;
  sellerId: number;
  productId: number;
  amount: number;
  paymentStatus: 'CREATED' | 'PAID' | 'FAILED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  rejectedListings: number;
  totalPurchases: number;
  totalSales: number;
}

export interface AdminStats {
  totalStudents: number;
  totalListings: number;
  pendingListings: number;
  approvedListings: number;
  rejectedListings: number;
  totalTransactions: number;
  totalSalesValue: number;
  monthlyRegistrations: { label: string; value: number }[];
  monthlyListings: { label: string; value: number }[];
  categoryDistribution: { label: string; value: number }[];
}
