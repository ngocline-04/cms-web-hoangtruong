import dayjs from "dayjs";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/App";
import type {
  AppUser,
  CreateOrderPayload,
  OrderDoc,
  PromotionDoc,
  ProductDoc,
  SelectedOrderProduct,
  ShippingProviderId,
  UserLevel,
} from "./order.types";

export const CURRENT_ADMIN_ID = "staff_001";

export const SHIPPING_PROVIDERS: Array<{
  id: ShippingProviderId;
  label: string;
  feePerKg: number;
}> = [
  { id: "SPX", label: "ShopeeExpress", feePerKg: 15000 },
  { id: "JNT", label: "J&T", feePerKg: 30000 },
];

export const SHOWROOM_OPTIONS = [
  {
    value: "KCG-HN01",
    label: "KCG-HN01 - 214 Nguyễn Khánh Toàn, Cầu Giấy, Hà Nội",
    address: "214 Nguyễn Khánh Toàn, Cầu Giấy, Hà Nội",
  },
  {
    value: "KCG-HCM01",
    label: "KCG-HCM01 - 22 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM",
    address: "22 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM",
  },
];

export const ORDER_STATUS_TABS = [
  { key: "PENDING_SHIPPING", label: "Đang chờ vận chuyển" },
  { key: "CANCELLED", label: "Đã huỷ" },
  { key: "SUCCESS", label: "Thành công" },
] as const;

export const normalizeUserLevel = (level?: string): UserLevel => {
  if (level === "BTB") return "BTB";
  if (level === "CTV") return "CTV";
  return "BTC";
};

export const getPriceByUserType = (
  product: ProductDoc,
  typeUser: UserLevel,
) => {
  const prices = product?.variants?.[0]?.prices || {};
  if (typeUser === "BTB") return Number(prices.btb || 0);
  if (typeUser === "CTV") return Number(prices.ctv || 0);
  return Number(prices.btc || 0);
};

export const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";

export const calcShipFee = (
  providerId?: ShippingProviderId,
  weight?: number,
) => {
  if (!providerId || !weight) return 0;
  const provider = SHIPPING_PROVIDERS.find((item) => item.id === providerId);
  if (!provider) return 0;
  return Math.ceil(Number(weight)) * provider.feePerKg;
};

export const sortByCreatedDesc = <T extends { createdAt?: string }>(
  items: T[],
) => {
  return [...items].sort(
    (a, b) =>
      dayjs(b.createdAt || 0).valueOf() - dayjs(a.createdAt || 0).valueOf(),
  );
};

export const subscribeOrders = (callback: (orders: OrderDoc[]) => void) => {
  const q = query(collection(db, "Orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as OrderDoc[];

    callback(sortByCreatedDesc(data));
  });
};

export const getInitialOrderReferences = async () => {
  const [userSnap, productSnap, promotionSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "Users"),
        where("isStaff", "==", false),
        where("status", "==", "ACTIVE"),
      ),
    ),
    getDocs(
      query(collection(db, "Products"), where("status", "==", "AVAILABLE")),
    ),
    getDocs(collection(db, "Promotions")),
  ]);

  const users = userSnap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as AppUser[];

  const products = productSnap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as ProductDoc[];

  const promotions = promotionSnap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as PromotionDoc[];

  return { users, products, promotions };
};

export const findCustomerByPhone = (users: AppUser[], phoneNumber: string) => {
  return (
    users.find(
      (item) =>
        String(item.phoneNumber || "").trim() === String(phoneNumber).trim(),
    ) || null
  );
};

export const getProductPromotion = (
  promotions: PromotionDoc[],
  productId: string,
): PromotionDoc | undefined => {
  return promotions.find((promo) => {
    if (promo.status !== "ONGOING") return false;
    if (promo.scope !== "PRODUCT") return false;

    const productInPromo = promo.products?.find(
      (item) => item.idProduct === productId,
    );
    if (!productInPromo) return false;

    const usedAmount = Number(productInPromo.usedAmount || 0);
    const totalAmount = Number(productInPromo.totalAmount || 0);

    return usedAmount < totalAmount;
  });
};

export const getDiscountedUnitPrice = (
  product: ProductDoc,
  typeUser: UserLevel,
  promotions: PromotionDoc[],
) => {
  const basePrice = getPriceByUserType(product, typeUser);
  const campaign = getProductPromotion(promotions, product.id);
  if (!campaign) return basePrice;

  const productCampaign = campaign.products?.find(
    (item) => item.idProduct === product.id,
  );
  if (!productCampaign) return basePrice;

  const discountValue =
    typeUser === "BTB"
      ? Number(productCampaign.priceBtb || 0)
      : typeUser === "CTV"
        ? Number(productCampaign.priceCtv || 0)
        : Number(productCampaign.priceBtc || 0);

  if (!discountValue) return basePrice;

  if (campaign.discountType === "percent") {
    return Math.max(0, basePrice - (basePrice * discountValue) / 100);
  }

  return Math.max(0, basePrice - discountValue);
};

export const buildSelectedOrderProduct = (
  product: ProductDoc,
  typeUser: UserLevel,
  promotions: PromotionDoc[],
): SelectedOrderProduct => {
  const unitPrice = getDiscountedUnitPrice(product, typeUser, promotions);
  const campaign = getProductPromotion(promotions, product.id);
  const productCampaign = campaign?.products?.find(
    (item) => item.idProduct === product.id,
  );

  const discountValue =
    typeUser === "BTB"
      ? Number(productCampaign?.priceBtb || 0)
      : typeUser === "CTV"
        ? Number(productCampaign?.priceCtv || 0)
        : Number(productCampaign?.priceBtc || 0);

  return {
    id: product.id,
    name: product.name,
    image: product.images?.[0] || "",
    category: product.category,
    quantity: 1,
    unitPrice,
    lineTotal: unitPrice,
    promotion: campaign
      ? {
          campaignId: campaign.id,
          campaignName: campaign.name,
          discountType: campaign.discountType,
          discountValue,
        }
      : null,
  };
};

export const createOrder = async (payload: CreateOrderPayload) => {
  return addDoc(collection(db, "Orders"), payload);
};

export const updateUserPurchaseStats = async (params: {
  userId: string;
  orderId: string;
  totalAmount: number;
  usersByPhone: AppUser[];
}) => {
  const { userId, orderId, totalAmount, usersByPhone } = params;
  const userRef = doc(db, "Users", userId);

  await updateDoc(userRef, {
    totalOrders: increment(1),
    totalSpent: increment(Number(totalAmount || 0)),
  }).catch(async () => {
    await updateDoc(userRef, {
      totalOrders: 1,
      totalSpent: Number(totalAmount || 0),
    });
  });

  const userSnapshot = usersByPhone.find((item) => item.id === userId);
  const oldAmountBought = Array.isArray(userSnapshot?.amountBought)
    ? userSnapshot.amountBought
    : [];

  await updateDoc(userRef, {
    amountBought: [
      ...oldAmountBought,
      {
        orderId,
        createdAt: dayjs().toISOString(),
      },
    ],
  });
};

export const updatePromotionStatsForOrder = async (params: {
  products: SelectedOrderProduct[];
  promotions: PromotionDoc[];
}) => {
  const { products, promotions } = params;
  const batch = writeBatch(db);

  const groupedByCampaign = new Map<
    string,
    { revenue: number; quantity: number; productId: string }
  >();

  products.forEach((item) => {
    if (!item.promotion?.campaignId) return;

    const existing = groupedByCampaign.get(item.promotion.campaignId);

    if (existing) {
      groupedByCampaign.set(item.promotion.campaignId, {
        ...existing,
        revenue: existing.revenue + item.lineTotal,
        quantity: existing.quantity + item.quantity,
      });
      return;
    }

    groupedByCampaign.set(item.promotion.campaignId, {
      revenue: item.lineTotal,
      quantity: item.quantity,
      productId: item.id,
    });
  });

  for (const [campaignId, info] of groupedByCampaign.entries()) {
    const promo = promotions.find((item) => item.id === campaignId);
    if (!promo) continue;

    const productIndex = promo.products?.findIndex(
      (item) => item.idProduct === info.productId,
    );

    if (productIndex === undefined || productIndex < 0) continue;

    const nextProducts = [...(promo.products || [])];
    nextProducts[productIndex] = {
      ...nextProducts[productIndex],
      usedAmount:
        Number(nextProducts[productIndex].usedAmount || 0) + info.quantity,
      totalSale:
        Number(nextProducts[productIndex].totalSale || 0) + info.quantity,
      totalRevenue:
        Number(nextProducts[productIndex].totalRevenue || 0) +
        Number(info.revenue || 0),
    };

    const promoRef = doc(db, "Promotions", campaignId);
    batch.update(promoRef, {
      products: nextProducts,
      totalSale: increment(info.quantity),
      totalRevenue: increment(info.revenue),
      updatedAt: dayjs().toISOString(),
    });
  }

  await batch.commit();
};

export const ensureConversationForCustomer = async (params: {
  userId: string;
  customerName: string;
}) => {
  const { userId, customerName } = params;

  const q = query(
    collection(db, "conversations"),
    where("customerId", "==", userId),
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const conversationRef = await addDoc(collection(db, "conversations"), {
    customerId: userId,
    customerName,
    customerAvatar: "",
    staffId: CURRENT_ADMIN_ID,
    staffName: "Admin",
    participants: [userId, CURRENT_ADMIN_ID],
    lastMessage: "",
    lastMessageType: "system",
    lastMessageAt: dayjs().toISOString(),
    lastSenderId: CURRENT_ADMIN_ID,
    unreadCustomer: 0,
    unreadStaff: 0,
    botEnabled: true,
    botPending: false,
    isClosed: false,
    createdAt: dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
  });

  return conversationRef.id;
};

export const sendOrderMessageToCustomer = async (params: {
  userId: string;
  customerName: string;
  products: SelectedOrderProduct[];
  orderId: string;
}) => {
  const { userId, customerName, products, orderId } = params;

  const conversationId = await ensureConversationForCustomer({
    userId,
    customerName,
  });

  const productSummary = products
    .map(
      (item) =>
        `- ${item.name} x${item.quantity} (${formatCurrency(item.lineTotal)})`,
    )
    .join("\n");

  const text = `Shop đã tạo đơn hàng cho anh/chị.\nMã đơn: ${orderId}\nDanh sách sản phẩm:\n${productSummary}`;

  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    senderId: CURRENT_ADMIN_ID,
    senderRole: "staff",
    type: "text",
    text,
    imageUrl: null,
    product: null,
    createdAt: serverTimestamp(),
    seenBy: [CURRENT_ADMIN_ID],
    metadata: {
      orderId,
    },
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: `Mã đơn: ${orderId}`,
    lastMessageType: "text",
    lastSenderId: CURRENT_ADMIN_ID,
    unreadCustomer: increment(1),
    updatedAt: serverTimestamp(),
  });
};

export const cancelOrder = async (orderId: string, cancelReason: string) => {
  await updateDoc(doc(db, "Orders", orderId), {
    status: "CANCELLED",
    cancelReason,
  });
};
