export type UserLevel = "BTC" | "BTB" | "CTV";
export type OrderStatus = "PENDING_SHIPPING" | "CANCELLED" | "SUCCESS";
export type PaymentStatus = "UNPAID" | "PAID";
export type PaymentType = "COD" | "BANK_TRANSFER";
export type ShippingProviderId = "SPX" | "JNT";

export type AppUser = {
  id: string;
  name: string;
  phoneNumber: string;
  address?: string;
  email?: string;
  level?: "CUSTOMER" | "BTB" | "CTV";
  branchCode?: string;
  isStaff?: boolean;
  status?: string;
  totalOrders?: number;
  totalSpent?: number;
  amountBought?: Array<{
    orderId: string;
    createdAt: string;
  }>;
};

export type ProductDoc = {
  id: string;
  name: string;
  category?: string;
  images?: string[];
  status?: string;
  variants?: Array<{
    stock?: number;
    prices?: {
      btc?: number;
      btb?: number;
      ctv?: number;
    };
    attributes?: Record<string, any>;
  }>;
};

export type PromotionDoc = {
  id: string;
  name: string;
  status: "UPCOMING" | "ONGOING" | "EXPIRED" | "DISABLED";
  discountType: "percent" | "amount";
  scope: "CUSTOMER" | "CART" | "PRODUCT";
  products?: Array<{
    idProduct: string;
    priceBtc: number | null;
    priceBtb: number | null;
    priceCtv: number | null;
    totalAmount: number;
    usedAmount?: number;
    totalSale?: number;
    totalRevenue?: number;
  }>;
  totalSale?: number;
  totalRevenue?: number;
  updatedAt?: string;
};

export type SelectedOrderProduct = {
  id: string;
  name: string;
  image?: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  promotion?: {
    campaignId: string;
    campaignName: string;
    discountType: "percent" | "amount";
    discountValue: number;
  } | null;
};

export type OrderDoc = {
  id: string;
  idUser: string;
  customerName: string;
  customerPhone: string;
  typeUser: UserLevel;
  addressShowroom: string;
  addressReceive: string;
  products: SelectedOrderProduct[];
  totalProductAmount: number;
  shipFee: number;
  totalAmount: number;
  idDVVC: ShippingProviderId;
  status: OrderStatus;
  statusPayment: PaymentStatus;
  typePayment: PaymentType;
  weight: number;
  length: number;
  width: number;
  height: number;
  cancelReason?: string;
  createdAt: string;
  createdBy: string;
};

export type CreateOrderPayload = {
  idUser: string;
  customerName: string;
  customerPhone: string;
  typeUser: UserLevel;
  addressShowroom: string;
  addressReceive: string;
  products: SelectedOrderProduct[];
  totalProductAmount: number;
  shipFee: number;
  totalAmount: number;
  idDVVC: ShippingProviderId;
  status: OrderStatus;
  statusPayment: PaymentStatus;
  typePayment: PaymentType;
  weight: number;
  length: number;
  width: number;
  height: number;
  createdAt: string;
  createdBy: string;
};