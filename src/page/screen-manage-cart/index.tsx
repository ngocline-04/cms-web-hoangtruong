// import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
// import {
//   Button,
//   Card,
//   Col,
//   Divider,
//   Drawer,
//   Form,
//   Input,
//   InputNumber,
//   Modal,
//   Popconfirm,
//   Radio,
//   Row,
//   Select,
//   Space,
//   Table,
//   Tabs,
//   Tag,
//   Typography,
//   message,
// } from "antd";
// import {
//   PlusCircleOutlined,
//   ReloadOutlined,
//   SearchOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import {
//   addDoc,
//   collection,
//   doc,
//   getDocs,
//   increment,
//   onSnapshot,
//   orderBy,
//   query,
//   runTransaction,
//   serverTimestamp,
//   updateDoc,
//   where,
//   writeBatch,
// } from "firebase/firestore";
// import { db } from "@/App";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";

// const { Text, Title } = Typography;

// /**
//  * =========================
//  * Types
//  * =========================
//  */
// type UserLevel = "BTC" | "BTB" | "CTV";
// type OrderStatus = "PENDING_SHIPPING" | "CANCELLED" | "SUCCESS";
// type PaymentStatus = "UNPAID" | "PAID";
// type PaymentType = "COD" | "BANK_TRANSFER";
// type ShippingProviderId = "SPX" | "JNT";

// type AppUser = {
//   id: string;
//   name: string;
//   phoneNumber: string;
//   address?: string;
//   email?: string;
//   level?: "CUSTOMER" | "BTB" | "CTV";
//   branchCode?: string;
//   isStaff?: boolean;
//   status?: string;
//   totalOrders?: number;
//   totalSpent?: number;
//   amountBought?: Array<{
//     orderId: string;
//     createdAt: string;
//   }>;
// };

// type ProductDoc = {
//   id: string;
//   name: string;
//   category?: string;
//   images?: string[];
//   variants?: Array<{
//     stock?: number;
//     prices?: {
//       btc?: number;
//       btb?: number;
//       ctv?: number;
//     };
//     attributes?: Record<string, any>;
//   }>;
// };

// type PromotionDoc = {
//   id: string;
//   name: string;
//   status: "UPCOMING" | "ONGOING" | "EXPIRED" | "DISABLED";
//   discountType: "percent" | "amount";
//   scope: "CUSTOMER" | "CART" | "PRODUCT";
//   products?: Array<{
//     idProduct: string;
//     priceBtc: number | null;
//     priceBtb: number | null;
//     priceCtv: number | null;
//     totalAmount: number;
//     usedAmount?: number;
//     totalSale?: number;
//     totalRevenue?: number;
//   }>;
// };

// type SelectedOrderProduct = {
//   id: string;
//   name: string;
//   image?: string;
//   category?: string;
//   unitPrice: number;
//   quantity: number;
//   lineTotal: number;
//   promotion?: {
//     campaignId: string;
//     campaignName: string;
//     discountType: "percent" | "amount";
//     discountValue: number;
//   } | null;
// };

// type OrderDoc = {
//   id: string;
//   idUser: string;
//   customerName: string;
//   customerPhone: string;
//   typeUser: UserLevel;
//   addressShowroom: string;
//   addressReceive: string;
//   products: SelectedOrderProduct[];
//   totalProductAmount: number;
//   shipFee: number;
//   totalAmount: number;
//   idDVVC: ShippingProviderId;
//   status: OrderStatus;
//   statusPayment: PaymentStatus;
//   typePayment: PaymentType;
//   weight: number;
//   length: number;
//   width: number;
//   height: number;
//   cancelReason?: string;
//   createdAt: string;
//   createdBy: string;
// };

// /**
//  * =========================
//  * Static config
//  * =========================
//  */
// const SHIPPING_PROVIDERS: Array<{
//   id: ShippingProviderId;
//   label: string;
//   feePerKg: number;
// }> = [
//   { id: "SPX", label: "ShopeeExpress", feePerKg: 15000 },
//   { id: "JNT", label: "J&T", feePerKg: 30000 },
// ];

// const SHOWROOM_OPTIONS = [
//   {
//     value: "KCG-HN01",
//     label: "KCG-HN01 - 214 Nguyễn Khánh Toàn, Cầu Giấy, Hà Nội",
//     address: "214 Nguyễn Khánh Toàn, Cầu Giấy, Hà Nội",
//   },
//   {
//     value: "KCG-HCM01",
//     label: "KCG-HCM01 - 22 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM",
//     address: "22 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM",
//   },
// ];

// const ORDER_STATUS_TABS: Array<{ key: OrderStatus; label: string }> = [
//   { key: "PENDING_SHIPPING", label: "Đang chờ vận chuyển" },
//   { key: "CANCELLED", label: "Đã huỷ" },
//   { key: "SUCCESS", label: "Thành công" },
// ];

// const CURRENT_ADMIN_ID = "staff_001";

// /**
//  * =========================
//  * Helpers
//  * =========================
//  */
// const normalizeUserLevel = (level?: string): UserLevel => {
//   if (level === "BTB") return "BTB";
//   if (level === "CTV") return "CTV";
//   return "BTC";
// };

// const getPriceByUserType = (product: ProductDoc, typeUser: UserLevel) => {
//   const prices = product?.variants?.[0]?.prices || {};
//   if (typeUser === "BTB") return Number(prices.btb || 0);
//   if (typeUser === "CTV") return Number(prices.ctv || 0);
//   return Number(prices.btc || 0);
// };

// const formatCurrency = (value: number) =>
//   Number(value || 0).toLocaleString("vi-VN") + " ₫";

// const calcShipFee = (providerId?: ShippingProviderId, weight?: number) => {
//   if (!providerId || !weight) return 0;
//   const provider = SHIPPING_PROVIDERS.find((item) => item.id === providerId);
//   if (!provider) return 0;
//   return Math.ceil(Number(weight)) * provider.feePerKg;
// };

// const sortByCreatedDesc = <T extends { createdAt?: string }>(items: T[]) => {
//   return [...items].sort((a, b) =>
//     dayjs(b.createdAt || 0).valueOf() - dayjs(a.createdAt || 0).valueOf(),
//   );
// };

// /**
//  * =========================
//  * Component
//  * =========================
//  */
// const Component = () => {
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
//   const [cancelForm] = Form.useForm();
//   const [productPickerForm] = Form.useForm();

//   const [orders, setOrders] = useState<OrderDoc[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState<OrderStatus>("PENDING_SHIPPING");

//   const [createOpen, setCreateOpen] = useState(false);
//   const [detailOpen, setDetailOpen] = useState(false);
//   const [cancelOpen, setCancelOpen] = useState(false);
//   const [selectedOrder, setSelectedOrder] = useState<OrderDoc | null>(null);

//   const [usersByPhone, setUsersByPhone] = useState<AppUser[]>([]);
//   const [foundCustomer, setFoundCustomer] = useState<AppUser | null>(null);
//   const [products, setProducts] = useState<ProductDoc[]>([]);
//   const [promotions, setPromotions] = useState<PromotionDoc[]>([]);
//   const [selectedProducts, setSelectedProducts] = useState<SelectedOrderProduct[]>([]);
//   const [productPickerOpen, setProductPickerOpen] = useState(false);
//   const [productKeyword, setProductKeyword] = useState("");

//   /**
//    * -------------------------
//    * Load orders realtime
//    * -------------------------
//    */
//   useEffect(() => {
//     const q = query(collection(db, "Orders"), orderBy("createdAt", "desc"));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const data = snapshot.docs.map((item) => ({
//         id: item.id,
//         ...item.data(),
//       })) as OrderDoc[];
//       setOrders(sortByCreatedDesc(data));
//     });

//     return () => unsubscribe();
//   }, []);

//   /**
//    * -------------------------
//    * Initial load reference data
//    * -------------------------
//    */
//   useEffect(() => {
//     const bootstrap = async () => {
//       try {
//         setLoading(true);

//         const [userSnap, productSnap, promotionSnap] = await Promise.all([
//           getDocs(query(collection(db, "Users"), where("isStaff", "==", false))),
//           getDocs(query(collection(db, "Products"), where("status", "==", "AVAILABLE"))),
//           getDocs(collection(db, "Promotions")),
//         ]);

//         const users = userSnap.docs.map((item) => ({
//           id: item.id,
//           ...item.data(),
//         })) as AppUser[];

//         const productDocs = productSnap.docs.map((item) => ({
//           id: item.id,
//           ...item.data(),
//         })) as ProductDoc[];

//         const promotionDocs = promotionSnap.docs.map((item) => ({
//           id: item.id,
//           ...item.data(),
//         })) as PromotionDoc[];

//         setUsersByPhone(users);
//         setProducts(productDocs);
//         setPromotions(promotionDocs);
//       } catch (error) {
//         console.error(error);
//         toast.error("Không tải được dữ liệu hệ thống");
//       } finally {
//         setLoading(false);
//       }
//     };

//     bootstrap();
//   }, []);

//   const filteredOrders = useMemo(() => {
//     const keyword = String(form.getFieldValue("keyword") || "").trim().toLowerCase();
//     return orders.filter((item) => {
//       const tabMatched = item.status === activeTab;
//       const keywordMatched = keyword
//         ? item.id.toLowerCase().includes(keyword)
//         : true;
//       return tabMatched && keywordMatched;
//     });
//   }, [orders, activeTab, form]);

//   const filteredProducts = useMemo(() => {
//     const keyword = productKeyword.trim().toLowerCase();
//     if (!keyword) return products;
//     return products.filter(
//       (item) =>
//         item.name?.toLowerCase().includes(keyword) ||
//         item.id?.toLowerCase().includes(keyword),
//     );
//   }, [productKeyword, products]);

//   /**
//    * -------------------------
//    * Customer search by phone
//    * -------------------------
//    */
//   const handleSearchCustomerByPhone = useCallback(() => {
//     const phoneNumber = String(form.getFieldValue("customerPhone") || "").trim();
//     if (!phoneNumber) {
//       toast.warning("Vui lòng nhập số điện thoại khách hàng");
//       return;
//     }

//     const user = usersByPhone.find(
//       (item) => String(item.phoneNumber || "").trim() === phoneNumber,
//     );

//     if (!user) {
//       setFoundCustomer(null);
//       form.setFieldsValue({
//         idUser: undefined,
//         customerName: undefined,
//         typeUser: undefined,
//         addressReceive: undefined,
//       });
//       toast.warning("Không tìm thấy khách hàng trong Users");
//       return;
//     }

//     const typeUser = normalizeUserLevel(user.level);

//     setFoundCustomer(user);
//     form.setFieldsValue({
//       idUser: user.id,
//       customerName: user.name,
//       typeUser,
//       addressReceive: user.address,
//     });

//     const recalculated = selectedProducts.map((item) => {
//       const product = products.find((p) => p.id === item.id);
//       if (!product) return item;
//       const unitPrice = getDiscountedUnitPrice(product, typeUser);
//       return {
//         ...item,
//         unitPrice,
//         lineTotal: unitPrice * item.quantity,
//       };
//     });

//     setSelectedProducts(recalculated);
//     toast.success("Đã lấy thông tin khách hàng");
//   }, [form, products, selectedProducts, usersByPhone]);

//   /**
//    * -------------------------
//    * Promotion / product pricing
//    * -------------------------
//    */
//   const getProductPromotion = useCallback(
//     (productId: string) => {
//       const now = dayjs();
//       return promotions.find((promo) => {
//         if (promo.status !== "ONGOING") return false;
//         if (promo.scope !== "PRODUCT") return false;
//         const productInPromo = promo.products?.find((item) => item.idProduct === productId);
//         if (!productInPromo) return false;
//         const usedAmount = Number(productInPromo.usedAmount || 0);
//         const totalAmount = Number(productInPromo.totalAmount || 0);
//         if (usedAmount >= totalAmount) return false;
//         return true;
//       });
//     },
//     [promotions],
//   );

//   const getDiscountedUnitPrice = useCallback(
//     (product: ProductDoc, typeUser: UserLevel) => {
//       const basePrice = getPriceByUserType(product, typeUser);
//       const campaign = getProductPromotion(product.id);
//       if (!campaign) return basePrice;

//       const productCampaign = campaign.products?.find((item) => item.idProduct === product.id);
//       if (!productCampaign) return basePrice;

//       const discountValue =
//         typeUser === "BTB"
//           ? Number(productCampaign.priceBtb || 0)
//           : typeUser === "CTV"
//             ? Number(productCampaign.priceCtv || 0)
//             : Number(productCampaign.priceBtc || 0);

//       if (!discountValue) return basePrice;

//       if (campaign.discountType === "percent") {
//         return Math.max(0, basePrice - (basePrice * discountValue) / 100);
//       }

//       return Math.max(0, basePrice - discountValue);
//     },
//     [getProductPromotion],
//   );

//   /**
//    * -------------------------
//    * Selected products ops
//    * -------------------------
//    */
//   const addProductToOrder = useCallback(
//     (product: ProductDoc) => {
//       const typeUser = (form.getFieldValue("typeUser") || "BTC") as UserLevel;
//       const unitPrice = getDiscountedUnitPrice(product, typeUser);
//       const campaign = getProductPromotion(product.id);
//       const productCampaign = campaign?.products?.find((item) => item.idProduct === product.id);
//       const discountValue =
//         typeUser === "BTB"
//           ? Number(productCampaign?.priceBtb || 0)
//           : typeUser === "CTV"
//             ? Number(productCampaign?.priceCtv || 0)
//             : Number(productCampaign?.priceBtc || 0);

//       setSelectedProducts((prev) => {
//         const existing = prev.find((item) => item.id === product.id);
//         if (existing) {
//           return prev.map((item) =>
//             item.id === product.id
//               ? {
//                   ...item,
//                   quantity: item.quantity + 1,
//                   lineTotal: item.unitPrice * (item.quantity + 1),
//                 }
//               : item,
//           );
//         }

//         return [
//           ...prev,
//           {
//             id: product.id,
//             name: product.name,
//             image: product.images?.[0] || "",
//             category: product.category,
//             quantity: 1,
//             unitPrice,
//             lineTotal: unitPrice,
//             promotion: campaign
//               ? {
//                   campaignId: campaign.id,
//                   campaignName: campaign.name,
//                   discountType: campaign.discountType,
//                   discountValue,
//                 }
//               : null,
//           },
//         ];
//       });

//       setProductPickerOpen(false);
//     },
//     [form, getDiscountedUnitPrice, getProductPromotion],
//   );

//   const updateProductQuantity = useCallback((productId: string, quantity: number) => {
//     setSelectedProducts((prev) =>
//       prev
//         .map((item) => {
//           if (item.id !== productId) return item;
//           const safeQty = Math.max(1, Number(quantity || 1));
//           return {
//             ...item,
//             quantity: safeQty,
//             lineTotal: item.unitPrice * safeQty,
//           };
//         })
//         .filter(Boolean),
//     );
//   }, []);

//   const removeProductFromOrder = useCallback((productId: string) => {
//     setSelectedProducts((prev) => prev.filter((item) => item.id !== productId));
//   }, []);

//   const totalProductAmount = useMemo(
//     () => selectedProducts.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
//     [selectedProducts],
//   );

//   const shipFeePreview = useMemo(() => {
//     console.log(form.getFieldValue("idDVVC"), form.getFieldValue("weight"))
//     return calcShipFee(form.getFieldValue("idDVVC"), form.getFieldValue("weight"));
//   }, [form]);

//   const grandTotalPreview = totalProductAmount + shipFeePreview;

//   /**
//    * -------------------------
//    * Create order
//    * -------------------------
//    */
//   const handleCreateOrder = useCallback(async () => {
//     try {
//       const values = await form.validateFields();

//       if (!selectedProducts.length) {
//         toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
//         return;
//       }

//       const shipFee = calcShipFee(values.idDVVC, values.weight);
//       const totalProduct = selectedProducts.reduce(
//         (sum, item) => sum + Number(item.lineTotal || 0),
//         0,
//       );
//       const totalAmount = totalProduct + shipFee;

//       const paymentStatus: PaymentStatus =
//         values.typePayment === "BANK_TRANSFER" ? "PAID" : "UNPAID";

//       const orderPayload = {
//         idUser: values.idUser,
//         customerName: values.customerName,
//         customerPhone: values.customerPhone,
//         typeUser: values.typeUser,
//         addressShowroom: values.addressShowroom,
//         addressReceive: values.addressReceive,
//         products: selectedProducts,
//         totalProductAmount: totalProduct,
//         shipFee,
//         totalAmount,
//         idDVVC: values.idDVVC,
//         status: "PENDING_SHIPPING" as OrderStatus,
//         statusPayment: paymentStatus,
//         typePayment: values.typePayment,
//         weight: Number(values.weight),
//         length: Number(values.length),
//         width: Number(values.width),
//         height: Number(values.height),
//         createdAt: dayjs().toISOString(),
//         createdBy: CURRENT_ADMIN_ID,
//       };

//       const orderRef = await addDoc(collection(db, "Orders"), orderPayload);

//       await Promise.all([
//         updateUserPurchaseStats({
//           userId: values.idUser,
//           orderId: orderRef.id,
//           totalAmount,
//         }),
//         updatePromotionStatsForOrder({
//           orderId: orderRef.id,
//           products: selectedProducts,
//         }),
//         sendOrderMessageToCustomer({
//           userId: values.idUser,
//           customerName: values.customerName,
//           products: selectedProducts,
//           orderId: orderRef.id,
//         }),
//       ]);

//       toast.success("Tạo đơn hàng thành công");
//       setCreateOpen(false);
//       setSelectedProducts([]);
//       setFoundCustomer(null);
//       form.resetFields();
//     } catch (error) {
//       console.error(error);
//       toast.error("Tạo đơn hàng thất bại");
//     }
//   }, [form, selectedProducts]);

//   const updateUserPurchaseStats = useCallback(
//     async (params: { userId: string; orderId: string; totalAmount: number }) => {
//       const { userId, orderId, totalAmount } = params;
//       const userRef = doc(db, "Users", userId);

//       await updateDoc(userRef, {
//         totalOrders: increment(1),
//         totalSpent: increment(Number(totalAmount || 0)),
//       }).catch(async () => {
//         await updateDoc(userRef, {
//           totalOrders: 1,
//           totalSpent: Number(totalAmount || 0),
//         });
//       });

//       const userSnapshot = usersByPhone.find((item) => item.id === userId);
//       const oldAmountBought = Array.isArray(userSnapshot?.amountBought)
//         ? userSnapshot?.amountBought
//         : [];

//       await updateDoc(userRef, {
//         amountBought: [
//           ...oldAmountBought,
//           {
//             orderId,
//             createdAt: dayjs().toISOString(),
//           },
//         ],
//       });
//     },
//     [usersByPhone],
//   );

//   const updatePromotionStatsForOrder = useCallback(
//     async (params: { orderId: string; products: SelectedOrderProduct[] }) => {
//       const { products } = params;
//       const batch = writeBatch(db);

//       const groupedByCampaign = new Map<
//         string,
//         { revenue: number; quantity: number; productId: string }
//       >();

//       products.forEach((item) => {
//         if (!item.promotion?.campaignId) return;
//         const existing = groupedByCampaign.get(item.promotion.campaignId);
//         if (existing) {
//           groupedByCampaign.set(item.promotion.campaignId, {
//             ...existing,
//             revenue: existing.revenue + item.lineTotal,
//             quantity: existing.quantity + item.quantity,
//           });
//           return;
//         }
//         groupedByCampaign.set(item.promotion.campaignId, {
//           revenue: item.lineTotal,
//           quantity: item.quantity,
//           productId: item.id,
//         });
//       });

//       for (const [campaignId, info] of groupedByCampaign.entries()) {
//         const promo = promotions.find((item) => item.id === campaignId);
//         if (!promo) continue;
//         const productIndex = promo.products?.findIndex(
//           (item) => item.idProduct === info.productId,
//         );
//         if (productIndex === undefined || productIndex < 0) continue;

//         const nextProducts = [...(promo.products || [])];
//         nextProducts[productIndex] = {
//           ...nextProducts[productIndex],
//           usedAmount: Number(nextProducts[productIndex].usedAmount || 0) + info.quantity,
//           totalSale: Number(nextProducts[productIndex].totalSale || 0) + info.quantity,
//           totalRevenue:
//             Number(nextProducts[productIndex].totalRevenue || 0) + Number(info.revenue || 0),
//         };

//         const promoRef = doc(db, "Promotions", campaignId);
//         batch.update(promoRef, {
//           products: nextProducts,
//           totalSale: increment(info.quantity),
//           totalRevenue: increment(info.revenue),
//           updatedAt: dayjs().toISOString(),
//         });
//       }

//       await batch.commit();
//     },
//     [promotions],
//   );

//   const ensureConversationForCustomer = useCallback(
//     async (params: { userId: string; customerName: string }) => {
//       const { userId, customerName } = params;
//       const q = query(collection(db, "conversations"), where("customerId", "==", userId));
//       const snapshot = await getDocs(q);
//       if (!snapshot.empty) {
//         return snapshot.docs[0].id;
//       }

//       const conversationRef = await addDoc(collection(db, "conversations"), {
//         customerId: userId,
//         customerName,
//         customerAvatar: "",
//         staffId: CURRENT_ADMIN_ID,
//         staffName: "Admin",
//         participants: [userId, CURRENT_ADMIN_ID],
//         lastMessage: "",
//         lastMessageType: "system",
//         lastMessageAt: dayjs().toISOString(),
//         lastSenderId: CURRENT_ADMIN_ID,
//         unreadCustomer: 0,
//         unreadStaff: 0,
//         botEnabled: true,
//         botPending: false,
//         isClosed: false,
//         createdAt: dayjs().toISOString(),
//         updatedAt: dayjs().toISOString(),
//       });

//       return conversationRef.id;
//     },
//     [],
//   );

//   const sendOrderMessageToCustomer = useCallback(
//     async (params: {
//       userId: string;
//       customerName: string;
//       products: SelectedOrderProduct[];
//       orderId: string;
//     }) => {
//       const { userId, customerName, products, orderId } = params;
//       const conversationId = await ensureConversationForCustomer({ userId, customerName });

//       const productSummary = products
//         .map((item) => `- ${item.name} x${item.quantity} (${formatCurrency(item.lineTotal)})`)
//         .join("\n");

//       const text = `Shop đã tạo đơn hàng cho anh/chị.\nMã đơn: ${orderId}\nDanh sách sản phẩm:\n${productSummary}`;

//       await addDoc(collection(db, "conversations", conversationId, "messages"), {
//         senderId: CURRENT_ADMIN_ID,
//         senderRole: "staff",
//         type: "text",
//         text,
//         imageUrl: null,
//         product: null,
//         createdAt: serverTimestamp(),
//         seenBy: [CURRENT_ADMIN_ID],
//         metadata: {
//           orderId,
//         },
//       });

//       await updateDoc(doc(db, "conversations", conversationId), {
//         lastMessage: `Mã đơn: ${orderId}`,
//         lastMessageType: "text",
//         lastSenderId: CURRENT_ADMIN_ID,
//         unreadCustomer: increment(1),
//         updatedAt: serverTimestamp(),
//       });
//     },
//     [ensureConversationForCustomer],
//   );

//   /**
//    * -------------------------
//    * Detail / cancel
//    * -------------------------
//    */
//   const openDetail = useCallback((order: OrderDoc) => {
//     setSelectedOrder(order);
//     setDetailOpen(true);
//   }, []);

//   const openCancel = useCallback((order: OrderDoc) => {
//     setSelectedOrder(order);
//     cancelForm.resetFields();
//     setCancelOpen(true);
//   }, [cancelForm]);

//   const handleCancelOrder = useCallback(async () => {
//     try {
//       const values = await cancelForm.validateFields();
//       if (!selectedOrder?.id) return;

//       await updateDoc(doc(db, "Orders", selectedOrder.id), {
//         status: "CANCELLED",
//         cancelReason: values.cancelReason,
//       });

//       toast.success("Đã huỷ đơn hàng");
//       setCancelOpen(false);
//       setSelectedOrder(null);
//     } catch (error) {
//       console.error(error);
//       toast.error("Huỷ đơn hàng thất bại");
//     }
//   }, [cancelForm, selectedOrder]);

//   /**
//    * -------------------------
//    * Search/reset
//    * -------------------------
//    */
//   const handleSearch = useCallback(() => {
//     setActiveTab(activeTab);
//   }, [activeTab]);

//   const handleReset = useCallback(() => {
//     form.resetFields(["keyword"]);
//   }, [form]);

//   /**
//    * -------------------------
//    * Table columns
//    * -------------------------
//    */
//   const columns = [
//     {
//       title: "Mã đơn",
//       dataIndex: "id",
//       width: 180,
//     },
//     {
//       title: "Khách hàng",
//       render: (_: any, record: OrderDoc) => (
//         <div>
//           <div>{record.customerName}</div>
//           <div className="text-12 text-color-700">{record.customerPhone}</div>
//         </div>
//       ),
//       width: 220,
//     },
//     {
//       title: "Loại khách",
//       dataIndex: "typeUser",
//       render: (value: UserLevel) => {
//         if (value === "BTB") return <Tag color="blue">Buôn / sỉ</Tag>;
//         if (value === "CTV") return <Tag color="purple">CTV</Tag>;
//         return <Tag color="green">Khách lẻ</Tag>;
//       },
//       width: 120,
//     },
//     {
//       title: "DVVC",
//       dataIndex: "idDVVC",
//       render: (value: ShippingProviderId) =>
//         SHIPPING_PROVIDERS.find((item) => item.id === value)?.label || value,
//       width: 140,
//     },
//     {
//       title: "Thanh toán",
//       render: (_: any, record: OrderDoc) => (
//         <div>
//           <div>{record.typePayment === "COD" ? "COD" : "Chuyển khoản"}</div>
//           <div className="text-12 text-color-700">
//             {record.statusPayment === "PAID" ? "Đã thanh toán" : "Thanh toán khi nhận hàng"}
//           </div>
//         </div>
//       ),
//       width: 180,
//     },
//     {
//       title: "Tổng tiền",
//       dataIndex: "totalAmount",
//       render: (value: number) => formatCurrency(value),
//       width: 150,
//     },
//     {
//       title: "Ngày tạo",
//       dataIndex: "createdAt",
//       render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
//       width: 160,
//     },
//     {
//       title: "Trạng thái",
//       dataIndex: "status",
//       render: (value: OrderStatus) => {
//         if (value === "PENDING_SHIPPING") return <Tag color="gold">Đang chờ vận chuyển</Tag>;
//         if (value === "SUCCESS") return <Tag color="green">Thành công</Tag>;
//         return <Tag color="red">Đã huỷ</Tag>;
//       },
//       width: 170,
//     },
//     {
//       title: "Thao tác",
//       fixed: "right" as const,
//       width: 180,
//       render: (_: any, record: OrderDoc) => (
//         <Space>
//           <Button size="small" onClick={() => openDetail(record)}>
//             Chi tiết
//           </Button>
//           {record.status === "PENDING_SHIPPING" ? (
//             <Button size="small" danger onClick={() => openCancel(record)}>
//               Huỷ
//             </Button>
//           ) : null}
//         </Space>
//       ),
//     },
//   ];

//   /**
//    * -------------------------
//    * Product picker columns
//    * -------------------------
//    */
//   const productColumns = [
//     {
//       title: "Ảnh",
//       render: (_: any, record: ProductDoc) => (
//         <img
//           src={record.images?.[0]}
//           style={{ width: 60, height: 60, objectFit: "cover" }}
//         />
//       ),
//       width: 80,
//     },
//     {
//       title: "ID",
//       dataIndex: "id",
//       width: 150,
//     },
//     {
//       title: "Tên sản phẩm",
//       dataIndex: "name",
//       width: 260,
//     },
//     {
//       title: "Danh mục",
//       dataIndex: "category",
//       width: 160,
//     },
//     {
//       title: "Giá hiện tại",
//       render: (_: any, record: ProductDoc) => {
//         const typeUser = (form.getFieldValue("typeUser") || "BTC") as UserLevel;
//         return formatCurrency(getDiscountedUnitPrice(record, typeUser));
//       },
//       width: 150,
//     },
//     {
//       title: "Thao tác",
//       render: (_: any, record: ProductDoc) => (
//         <Button type="primary" size="small" onClick={() => addProductToOrder(record)}>
//           Chọn
//         </Button>
//       ),
//       width: 120,
//     },
//   ];

//   return (
//     <div className="block-content">
//       <Card title="Danh sách vận đơn">
//         <Form form={form} layout="vertical" autoComplete="off">
//           <Row gutter={16} align="bottom">
//             <Col span={8}>
//               <Form.Item name="keyword" label="Tìm kiếm ID đơn hàng">
//                 <Input
//                   className="h-40"
//                   placeholder="Nhập mã đơn hàng"
//                   prefix={<SearchOutlined />}
//                 />
//               </Form.Item>
//             </Col>
//             <Col>
//               <Form.Item>
//                 <Button className="h-40" type="primary" onClick={handleSearch}>
//                   Tìm kiếm
//                 </Button>
//               </Form.Item>
//             </Col>
//             <Col>
//               <Form.Item>
//                 <Button
//                   className="h-40"
//                   icon={<ReloadOutlined />}
//                   onClick={handleReset}
//                 >
//                   Reset
//                 </Button>
//               </Form.Item>
//             </Col>
//             <Col>
//               <Form.Item>
//                 <Button
//                   className="h-40"
//                   type="primary"
//                   icon={<PlusCircleOutlined />}
//                   onClick={() => {
//                     form.resetFields();
//                     setSelectedProducts([]);
//                     setFoundCustomer(null);
//                     setCreateOpen(true);
//                   }}
//                 >
//                   Thêm mới đơn hàng
//                 </Button>
//               </Form.Item>
//             </Col>
//           </Row>
//         </Form>

//         <Tabs
//           activeKey={activeTab}
//           onChange={(key) => setActiveTab(key as OrderStatus)}
//           items={ORDER_STATUS_TABS.map((item) => ({
//             key: item.key,
//             label: item.label,
//           }))}
//         />

//         <Table
//           rowKey="id"
//           bordered
//           loading={loading}
//           dataSource={filteredOrders}
//           columns={columns}
//           scroll={{ x: 1400 }}
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             pageSizeOptions: ["10", "20", "50"],
//             showTotal: (total) => `Tổng ${total} đơn hàng`,
//           }}
//         />
//       </Card>

//       <Drawer
//         title="Tạo đơn hàng mới"
//         width={1200}
//         open={createOpen}
//         onClose={() => setCreateOpen(false)}
//         extra={
//           <Space>
//             <Button onClick={() => setCreateOpen(false)}>Huỷ</Button>
//             <Button type="primary" onClick={handleCreateOrder}>
//               Tạo đơn hàng
//             </Button>
//           </Space>
//         }
//       >
//         <Form form={form} layout="vertical" autoComplete="off">
//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item
//                 name="customerPhone"
//                 label="Số điện thoại khách hàng"
//                 rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
//               >
//                 <Input
//                   className="h-40"
//                   placeholder="Nhập số điện thoại để tìm khách hàng"
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={4}>
//               <Form.Item label=" ">
//                 <Button className="h-40 w-full" onClick={handleSearchCustomerByPhone}>
//                   Tìm khách hàng
//                 </Button>
//               </Form.Item>
//             </Col>
//             <Col span={6}>
//               <Form.Item
//                 name="idUser"
//                 label="ID người mua"
//                 rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
//               >
//                 <Input className="h-40" disabled />
//               </Form.Item>
//             </Col>
//             <Col span={6}>
//               <Form.Item
//                 name="typeUser"
//                 label="Loại khách hàng"
//                 rules={[{ required: true, message: "Thiếu loại khách hàng" }]}
//               >
//                 <Select
//                   size="large"
//                   options={[
//                     { value: "BTC", label: "Khách lẻ" },
//                     { value: "BTB", label: "Khách buôn / sỉ" },
//                     { value: "CTV", label: "CTV" },
//                   ]}
//                 />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item name="customerName" label="Tên khách hàng">
//                 <Input className="h-40" disabled />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item
//                 name="branchCode"
//                 label="Showroom gửi hàng"
//                 rules={[{ required: true, message: "Vui lòng chọn showroom" }]}
//               >
//                 <Select
//                   size="large"
//                   options={SHOWROOM_OPTIONS}
//                   onChange={(value) => {
//                     const showroom = SHOWROOM_OPTIONS.find((item) => item.value === value);
//                     form.setFieldValue("addressShowroom", showroom?.address || "");
//                   }}
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item
//                 name="addressShowroom"
//                 label="Địa chỉ showroom gửi hàng"
//                 rules={[{ required: true, message: "Vui lòng nhập địa chỉ showroom" }]}
//               >
//                 <Input className="h-40" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col span={24}>
//               <Form.Item
//                 name="addressReceive"
//                 label="Địa chỉ nhận hàng"
//                 rules={[{ required: true, message: "Vui lòng nhập địa chỉ nhận hàng" }]}
//               >
//                 <Input className="h-40" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Divider orientation="left">Sản phẩm</Divider>

//           <div className="mb-16 flex items-center justify-between">
//             <Title level={5} className="!mb-0">
//               Danh sách sản phẩm trong đơn
//             </Title>
//             <Button type="primary" onClick={() => setProductPickerOpen(true)}>
//               Chọn sản phẩm
//             </Button>
//           </div>

//           <Table
//             rowKey="id"
//             bordered
//             dataSource={selectedProducts}
//             pagination={false}
//             locale={{ emptyText: "Chưa chọn sản phẩm" }}
//             columns={[
//               {
//                 title: "Sản phẩm",
//                 render: (_: any, record: SelectedOrderProduct) => (
//                   <div className="flex items-center">
//                     <img
//                       src={record.image}
//                       style={{ width: 48, height: 48, objectFit: "cover" }}
//                     />
//                     <div className="ml-12">
//                       <div>{record.name}</div>
//                       <div className="text-12 text-color-700">{record.id}</div>
//                     </div>
//                   </div>
//                 ),
//               },
//               {
//                 title: "Giá",
//                 dataIndex: "unitPrice",
//                 render: (value: number) => formatCurrency(value),
//                 width: 150,
//               },
//               {
//                 title: "Số lượng",
//                 render: (_: any, record: SelectedOrderProduct) => (
//                   <InputNumber
//                     min={1}
//                     value={record.quantity}
//                     onChange={(value) => updateProductQuantity(record.id, Number(value || 1))}
//                   />
//                 ),
//                 width: 120,
//               },
//               {
//                 title: "Khuyến mãi",
//                 render: (_: any, record: SelectedOrderProduct) =>
//                   record.promotion ? (
//                     <div>
//                       <div>{record.promotion.campaignName}</div>
//                       <div className="text-12 text-color-700">
//                         {record.promotion.discountType === "percent"
//                           ? `${record.promotion.discountValue}%`
//                           : formatCurrency(record.promotion.discountValue)}
//                       </div>
//                     </div>
//                   ) : (
//                     <Text type="secondary">Không áp dụng</Text>
//                   ),
//                 width: 220,
//               },
//               {
//                 title: "Thành tiền",
//                 dataIndex: "lineTotal",
//                 render: (value: number) => formatCurrency(value),
//                 width: 150,
//               },
//               {
//                 title: "Thao tác",
//                 render: (_: any, record: SelectedOrderProduct) => (
//                   <Popconfirm
//                     title="Xoá sản phẩm khỏi đơn hàng?"
//                     onConfirm={() => removeProductFromOrder(record.id)}
//                   >
//                     <Button danger size="small">
//                       Xoá
//                     </Button>
//                   </Popconfirm>
//                 ),
//                 width: 100,
//               },
//             ]}
//           />

//           <Divider orientation="left">Vận chuyển & thanh toán</Divider>

//           <Row gutter={16}>
//             <Col span={6}>
//               <Form.Item
//                 name="idDVVC"
//                 label="Đơn vị vận chuyển"
//                 rules={[{ required: true, message: "Vui lòng chọn đơn vị vận chuyển" }]}
//               >
//                 <Select
//                   size="large"
//                   options={SHIPPING_PROVIDERS.map((item) => ({
//                     value: item.id,
//                     label: `${item.label} (${formatCurrency(item.feePerKg)}/kg)`,
//                   }))}
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={4}>
//               <Form.Item
//                 name="weight"
//                 label="Khối lượng (kg)"
//                 rules={[{ required: true, message: "Vui lòng nhập khối lượng" }]}
//               >
//                 <InputNumber className="h-40 w-full" min={1} />
//               </Form.Item>
//             </Col>
//             <Col span={4}>
//               <Form.Item
//                 name="length"
//                 label="Dài (cm)"
//                 rules={[{ required: true, message: "Vui lòng nhập chiều dài" }]}
//               >
//                 <InputNumber className="h-40 w-full" min={1} />
//               </Form.Item>
//             </Col>
//             <Col span={4}>
//               <Form.Item
//                 name="width"
//                 label="Rộng (cm)"
//                 rules={[{ required: true, message: "Vui lòng nhập chiều rộng" }]}
//               >
//                 <InputNumber className="h-40 w-full" min={1} />
//               </Form.Item>
//             </Col>
//             <Col span={4}>
//               <Form.Item
//                 name="height"
//                 label="Cao (cm)"
//                 rules={[{ required: true, message: "Vui lòng nhập chiều cao" }]}
//               >
//                 <InputNumber className="h-40 w-full" min={1} />
//               </Form.Item>
//             </Col>
//             <Col span={24}>
//               <Form.Item
//                 name="typePayment"
//                 label="Hình thức thanh toán"
//                 rules={[{ required: true, message: "Vui lòng chọn hình thức thanh toán" }]}
//               >
//                 <Radio.Group>
//                   <Radio value="COD">COD</Radio>
//                   <Radio value="BANK_TRANSFER">Chuyển khoản</Radio>
//                 </Radio.Group>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Card size="small" className="mt-16">
//             <Row gutter={16}>
//               <Col span={8}>
//                 <div className="text-14 text-color-700">Tiền hàng</div>
//                 <div className="text-18 font-semibold">{formatCurrency(totalProductAmount)}</div>
//               </Col>
//               <Col span={8}>
//                 <div className="text-14 text-color-700">Phí ship</div>
//                 <div className="text-18 font-semibold">{formatCurrency(shipFeePreview)}</div>
//               </Col>
//               <Col span={8}>
//                 <div className="text-14 text-color-700">Tổng thanh toán</div>
//                 <div className="text-20 font-semibold text-primary-500">
//                   {formatCurrency(grandTotalPreview)}
//                 </div>
//               </Col>
//             </Row>
//           </Card>
//         </Form>
//       </Drawer>

//       <Modal
//         title="Chọn sản phẩm"
//         open={productPickerOpen}
//         width={1100}
//         footer={null}
//         onCancel={() => setProductPickerOpen(false)}
//       >
//         <div className="mb-16 flex items-center gap-12">
//           <Input
//             placeholder="Tìm theo ID hoặc tên sản phẩm"
//             value={productKeyword}
//             onChange={(e) => setProductKeyword(e.target.value)}
//           />
//         </div>
//         <Table
//           rowKey="id"
//           bordered
//           dataSource={filteredProducts}
//           columns={productColumns}
//           scroll={{ x: 900, y: 500 }}
//           pagination={{ pageSize: 8 }}
//         />
//       </Modal>

//       <Modal
//         title="Chi tiết đơn hàng"
//         open={detailOpen}
//         width={1000}
//         footer={null}
//         onCancel={() => setDetailOpen(false)}
//       >
//         {selectedOrder ? (
//           <div>
//             <Row gutter={16}>
//               <Col span={12}>
//                 <div className="mb-8 font-medium">Mã đơn: {selectedOrder.id}</div>
//                 <div>Khách hàng: {selectedOrder.customerName}</div>
//                 <div>SĐT: {selectedOrder.customerPhone}</div>
//                 <div>Loại khách: {selectedOrder.typeUser}</div>
//                 <div>Địa chỉ nhận: {selectedOrder.addressReceive}</div>
//               </Col>
//               <Col span={12}>
//                 <div>Showroom gửi: {selectedOrder.addressShowroom}</div>
//                 <div>
//                   DVVC: {SHIPPING_PROVIDERS.find((item) => item.id === selectedOrder.idDVVC)?.label}
//                 </div>
//                 <div>
//                   Thanh toán: {selectedOrder.typePayment === "COD" ? "COD" : "Chuyển khoản"}
//                 </div>
//                 <div>
//                   Trạng thái thanh toán: {selectedOrder.statusPayment === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
//                 </div>
//                 <div>Ngày tạo: {dayjs(selectedOrder.createdAt).format("DD/MM/YYYY HH:mm")}</div>
//               </Col>
//             </Row>

//             <Divider />

//             <Table
//               rowKey="id"
//               bordered
//               pagination={false}
//               dataSource={selectedOrder.products}
//               columns={[
//                 { title: "Sản phẩm", dataIndex: "name" },
//                 {
//                   title: "Giá",
//                   dataIndex: "unitPrice",
//                   render: (value: number) => formatCurrency(value),
//                 },
//                 { title: "SL", dataIndex: "quantity" },
//                 {
//                   title: "Thành tiền",
//                   dataIndex: "lineTotal",
//                   render: (value: number) => formatCurrency(value),
//                 },
//               ]}
//             />

//             <Divider />

//             <div className="flex justify-end">
//               <div className="w-[320px] rounded-radius-m bg-color-100 p-16">
//                 <div className="mb-8 flex justify-between">
//                   <span>Tiền hàng</span>
//                   <span>{formatCurrency(selectedOrder.totalProductAmount)}</span>
//                 </div>
//                 <div className="mb-8 flex justify-between">
//                   <span>Phí ship</span>
//                   <span>{formatCurrency(selectedOrder.shipFee)}</span>
//                 </div>
//                 <div className="flex justify-between text-16 font-semibold text-primary-500">
//                   <span>Tổng cộng</span>
//                   <span>{formatCurrency(selectedOrder.totalAmount)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : null}
//       </Modal>

//       <Modal
//         title="Huỷ đơn hàng"
//         open={cancelOpen}
//         width={900}
//         footer={null}
//         onCancel={() => setCancelOpen(false)}
//       >
//         {selectedOrder ? (
//           <>
//             <div className="mb-16 rounded-radius-m bg-color-100 p-16">
//               <div className="font-medium">Đơn hàng: {selectedOrder.id}</div>
//               <div>Khách hàng: {selectedOrder.customerName}</div>
//               <div>Tổng tiền: {formatCurrency(selectedOrder.totalAmount)}</div>
//             </div>

//             <Form form={cancelForm} layout="vertical">
//               <Form.Item
//                 name="cancelReason"
//                 label="Lý do huỷ đơn"
//                 rules={[{ required: true, message: "Vui lòng nhập lý do huỷ đơn" }]}
//               >
//                 <Input.TextArea rows={4} placeholder="Nhập lý do huỷ đơn" />
//               </Form.Item>

//               <div className="flex justify-end gap-12">
//                 <Button onClick={() => setCancelOpen(false)}>Đóng</Button>
//                 <Button danger type="primary" onClick={handleCancelOrder}>
//                   Xác nhận huỷ đơn
//                 </Button>
//               </div>
//             </Form>
//           </>
//         ) : null}
//       </Modal>
//     </div>
//   );
// };

// const ManageCart = memo(Component);

// export { ManageCart };
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  PlusCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import type {
  AppUser,
  OrderDoc,
  OrderStatus,
  PaymentStatus,
  ProductDoc,
  PromotionDoc,
  SelectedOrderProduct,
  ShippingProviderId,
  UserLevel,
} from "./order.types";
import {
  ORDER_STATUS_TABS,
  SHIPPING_PROVIDERS,
  SHOWROOM_OPTIONS,
  buildSelectedOrderProduct,
  calcShipFee,
  cancelOrder,
  createOrder,
  findCustomerByPhone,
  formatCurrency,
  getDiscountedUnitPrice,
  getInitialOrderReferences,
  normalizeUserLevel,
  sendOrderMessageToCustomer,
  subscribeOrders,
  updatePromotionStatsForOrder,
  updateUserPurchaseStats,
} from "./order.service";

const { Text, Title } = Typography;

const Component = () => {
  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderStatus>("PENDING_SHIPPING");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDoc | null>(null);

  const [usersByPhone, setUsersByPhone] = useState<AppUser[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [promotions, setPromotions] = useState<PromotionDoc[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedOrderProduct[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productKeyword, setProductKeyword] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeOrders(setOrders);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const { users, products, promotions } = await getInitialOrderReferences();
        setUsersByPhone(users);
        setProducts(products);
        setPromotions(promotions);
      } catch (error) {
        console.error(error);
        toast.error("Không tải được dữ liệu hệ thống");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const keyword = Form.useWatch("keyword", searchForm);
  const watchedWeight = Form.useWatch("weight", createForm);
  const watchedProvider = Form.useWatch("idDVVC", createForm);
  const watchedTypeUser = Form.useWatch("typeUser", createForm);

  const filteredOrders = useMemo(() => {
    const normalizedKeyword = String(keyword || "").trim().toLowerCase();

    return orders.filter((item) => {
      const tabMatched = item.status === activeTab;
      const keywordMatched = normalizedKeyword
        ? item.id.toLowerCase().includes(normalizedKeyword)
        : true;

      return tabMatched && keywordMatched;
    });
  }, [orders, activeTab, keyword]);

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = productKeyword.trim().toLowerCase();
    if (!normalizedKeyword) return products;

    return products.filter(
      (item) =>
        item.name?.toLowerCase().includes(normalizedKeyword) ||
        item.id?.toLowerCase().includes(normalizedKeyword),
    );
  }, [productKeyword, products]);

  const shipFeePreview = useMemo(() => {
    return calcShipFee(watchedProvider, watchedWeight);
  }, [watchedProvider, watchedWeight]);

  const totalProductAmount = useMemo(
    () => selectedProducts.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
    [selectedProducts],
  );

  const grandTotalPreview = totalProductAmount + shipFeePreview;

  const handleSearchCustomerByPhone = useCallback(() => {
    const phoneNumber = String(createForm.getFieldValue("customerPhone") || "").trim();

    if (!phoneNumber) {
      toast.warning("Vui lòng nhập số điện thoại khách hàng");
      return;
    }

    const user = findCustomerByPhone(usersByPhone, phoneNumber);

    if (!user) {
      createForm.setFieldsValue({
        idUser: undefined,
        customerName: undefined,
        typeUser: undefined,
        addressReceive: undefined,
      });
      toast.warning("Không tìm thấy khách hàng trong Users");
      return;
    }

    const typeUser = normalizeUserLevel(user.level);

    createForm.setFieldsValue({
      idUser: user.id,
      customerName: user.name,
      typeUser,
      addressReceive: user.address,
    });

    setSelectedProducts((prev) =>
      prev.map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return item;

        const unitPrice = getDiscountedUnitPrice(product, typeUser, promotions);

        return {
          ...item,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
        };
      }),
    );

    toast.success("Đã lấy thông tin khách hàng");
  }, [createForm, products, promotions, usersByPhone]);

  const addProductToOrder = useCallback(
    (product: ProductDoc) => {
      const typeUser = (createForm.getFieldValue("typeUser") || "BTC") as UserLevel;
      const builtItem = buildSelectedOrderProduct(product, typeUser, promotions);

      setSelectedProducts((prev) => {
        const existing = prev.find((item) => item.id === product.id);

        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  lineTotal: item.unitPrice * (item.quantity + 1),
                }
              : item,
          );
        }

        return [...prev, builtItem];
      });

      setProductPickerOpen(false);
    },
    [createForm, promotions],
  );

  const updateProductQuantity = useCallback((productId: string, quantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;

        const safeQty = Math.max(1, Number(quantity || 1));

        return {
          ...item,
          quantity: safeQty,
          lineTotal: item.unitPrice * safeQty,
        };
      }),
    );
  }, []);

  const removeProductFromOrder = useCallback((productId: string) => {
    setSelectedProducts((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const handleCreateOrder = useCallback(async () => {
    try {
      const values = await createForm.validateFields();

      if (!selectedProducts.length) {
        toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
        return;
      }

      const shipFee = calcShipFee(values.idDVVC, values.weight);
      const totalProduct = selectedProducts.reduce(
        (sum, item) => sum + Number(item.lineTotal || 0),
        0,
      );
      const totalAmount = totalProduct + shipFee;

      const paymentStatus: PaymentStatus =
        values.typePayment === "BANK_TRANSFER" ? "PAID" : "UNPAID";

      const orderPayload = {
        idUser: values.idUser,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        typeUser: values.typeUser,
        addressShowroom: values.addressShowroom,
        addressReceive: values.addressReceive,
        products: selectedProducts,
        totalProductAmount: totalProduct,
        shipFee,
        totalAmount,
        idDVVC: values.idDVVC,
        status: "PENDING_SHIPPING" as OrderStatus,
        statusPayment: paymentStatus,
        typePayment: values.typePayment,
        weight: Number(values.weight),
        length: Number(values.length),
        width: Number(values.width),
        height: Number(values.height),
        createdAt: dayjs().toISOString(),
        createdBy: "staff_001",
      };

      const orderRef = await createOrder(orderPayload);

      await Promise.all([
        updateUserPurchaseStats({
          userId: values.idUser,
          orderId: orderRef.id,
          totalAmount,
          usersByPhone,
        }),
        updatePromotionStatsForOrder({
          products: selectedProducts,
          promotions,
        }),
        sendOrderMessageToCustomer({
          userId: values.idUser,
          customerName: values.customerName,
          products: selectedProducts,
          orderId: orderRef.id,
        }),
      ]);

      toast.success("Tạo đơn hàng thành công");
      setCreateOpen(false);
      setSelectedProducts([]);
      createForm.resetFields();
    } catch (error) {
      console.error(error);
      toast.error("Tạo đơn hàng thất bại");
    }
  }, [createForm, promotions, selectedProducts, usersByPhone]);

  const openDetail = useCallback((order: OrderDoc) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  }, []);

  const openCancel = useCallback(
    (order: OrderDoc) => {
      setSelectedOrder(order);
      cancelForm.resetFields();
      setCancelOpen(true);
    },
    [cancelForm],
  );

  const handleCancelOrder = useCallback(async () => {
    try {
      const values = await cancelForm.validateFields();

      if (!selectedOrder?.id) return;

      await cancelOrder(selectedOrder.id, values.cancelReason);

      toast.success("Đã huỷ đơn hàng");
      setCancelOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
      toast.error("Huỷ đơn hàng thất bại");
    }
  }, [cancelForm, selectedOrder]);

  const handleSearch = useCallback(() => {
    searchForm.submit();
  }, [searchForm]);

  const handleReset = useCallback(() => {
    searchForm.resetFields(["keyword"]);
  }, [searchForm]);

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: 180,
    },
    {
      title: "Khách hàng",
      render: (_: unknown, record: OrderDoc) => (
        <div>
          <div>{record.customerName}</div>
          <div className="text-12 text-color-700">{record.customerPhone}</div>
        </div>
      ),
      width: 220,
    },
    {
      title: "Loại khách",
      dataIndex: "typeUser",
      render: (value: UserLevel) => {
        if (value === "BTB") return <Tag color="blue">Buôn / sỉ</Tag>;
        if (value === "CTV") return <Tag color="purple">CTV</Tag>;
        return <Tag color="green">Khách lẻ</Tag>;
      },
      width: 120,
    },
    {
      title: "DVVC",
      dataIndex: "idDVVC",
      render: (value: ShippingProviderId) =>
        SHIPPING_PROVIDERS.find((item) => item.id === value)?.label || value,
      width: 140,
    },
    {
      title: "Thanh toán",
      render: (_: unknown, record: OrderDoc) => (
        <div>
          <div>{record.typePayment === "COD" ? "COD" : "Chuyển khoản"}</div>
          <div className="text-12 text-color-700">
            {record.statusPayment === "PAID" ? "Đã thanh toán" : "Thanh toán khi nhận hàng"}
          </div>
        </div>
      ),
      width: 180,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      render: (value: number) => formatCurrency(value),
      width: 150,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
      width: 160,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (value: OrderStatus) => {
        if (value === "PENDING_SHIPPING") return <Tag color="gold">Đang chờ vận chuyển</Tag>;
        if (value === "SUCCESS") return <Tag color="green">Thành công</Tag>;
        return <Tag color="red">Đã huỷ</Tag>;
      },
      width: 170,
    },
    {
      title: "Thao tác",
      fixed: "right" as const,
      width: 180,
      render: (_: unknown, record: OrderDoc) => (
        <Space>
          <Button size="small" onClick={() => openDetail(record)}>
            Chi tiết
          </Button>
          {record.status === "PENDING_SHIPPING" ? (
            <Button size="small" danger onClick={() => openCancel(record)}>
              Huỷ
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const productColumns = [
    {
      title: "Ảnh",
      render: (_: unknown, record: ProductDoc) => (
        <img
          src={record.images?.[0]}
          style={{ width: 60, height: 60, objectFit: "cover" }}
        />
      ),
      width: 80,
    },
    {
      title: "ID",
      dataIndex: "id",
      width: 150,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      width: 260,
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      width: 160,
    },
    {
      title: "Giá hiện tại",
      render: (_: unknown, record: ProductDoc) => {
        const typeUser = (watchedTypeUser || "BTC") as UserLevel;
        return formatCurrency(getDiscountedUnitPrice(record, typeUser, promotions));
      },
      width: 150,
    },
    {
      title: "Thao tác",
      render: (_: unknown, record: ProductDoc) => (
        <Button type="primary" size="small" onClick={() => addProductToOrder(record)}>
          Chọn
        </Button>
      ),
      width: 120,
    },
  ];

  return (
    <div className="block-content">
      <Card title="Danh sách vận đơn">
        <Form form={searchForm} layout="vertical" autoComplete="off">
          <Row gutter={16} align="bottom">
            <Col span={8}>
              <Form.Item name="keyword" label="Tìm kiếm ID đơn hàng">
                <Input
                  className="h-40"
                  placeholder="Nhập mã đơn hàng"
                  prefix={<SearchOutlined />}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item>
                <Button className="h-40" type="primary" onClick={handleSearch}>
                  Tìm kiếm
                </Button>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item>
                <Button className="h-40" icon={<ReloadOutlined />} onClick={handleReset}>
                  Reset
                </Button>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item>
                <Button
                  className="h-40"
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  onClick={() => {
                    createForm.resetFields();
                    setSelectedProducts([]);
                    setCreateOpen(true);
                  }}
                >
                  Thêm mới đơn hàng
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as OrderStatus)}
          items={ORDER_STATUS_TABS.map((item) => ({
            key: item.key,
            label: item.label,
          }))}
        />

        <Table
          rowKey="id"
          bordered
          loading={loading}
          dataSource={filteredOrders}
          columns={columns}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Tổng ${total} đơn hàng`,
          }}
        />
      </Card>

      <Drawer
        title="Tạo đơn hàng mới"
        width={1200}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateOpen(false)}>Huỷ</Button>
            <Button type="primary" onClick={handleCreateOrder}>
              Tạo đơn hàng
            </Button>
          </Space>
        }
      >
        <Form form={createForm} layout="vertical" autoComplete="off">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="customerPhone"
                label="Số điện thoại khách hàng"
                rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
              >
                <Input
                  className="h-40"
                  placeholder="Nhập số điện thoại để tìm khách hàng"
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label=" ">
                <Button className="h-40 w-full" onClick={handleSearchCustomerByPhone}>
                  Tìm khách hàng
                </Button>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="idUser"
                label="ID người mua"
                rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
              >
                <Input className="h-40" disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="typeUser"
                label="Loại khách hàng"
                rules={[{ required: true, message: "Thiếu loại khách hàng" }]}
              >
                <Select
                  size="large"
                  options={[
                    { value: "BTC", label: "Khách lẻ" },
                    { value: "BTB", label: "Khách buôn / sỉ" },
                    { value: "CTV", label: "CTV" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customerName" label="Tên khách hàng">
                <Input className="h-40" disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="branchCode"
                label="Showroom gửi hàng"
                rules={[{ required: true, message: "Vui lòng chọn showroom" }]}
              >
                <Select
                  size="large"
                  options={SHOWROOM_OPTIONS}
                  onChange={(value) => {
                    const showroom = SHOWROOM_OPTIONS.find((item) => item.value === value);
                    createForm.setFieldValue("addressShowroom", showroom?.address || "");
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="addressShowroom"
                label="Địa chỉ showroom gửi hàng"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ showroom" }]}
              >
                <Input className="h-40" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="addressReceive"
                label="Địa chỉ nhận hàng"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ nhận hàng" }]}
              >
                <Input className="h-40" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Sản phẩm</Divider>

          <div className="mb-16 flex items-center justify-between">
            <Title level={5} className="!mb-0">
              Danh sách sản phẩm trong đơn
            </Title>
            <Button type="primary" onClick={() => setProductPickerOpen(true)}>
              Chọn sản phẩm
            </Button>
          </div>

          <Table
            rowKey="id"
            bordered
            dataSource={selectedProducts}
            pagination={false}
            locale={{ emptyText: "Chưa chọn sản phẩm" }}
            columns={[
              {
                title: "Sản phẩm",
                render: (_: unknown, record: SelectedOrderProduct) => (
                  <div className="flex items-center">
                    <img
                      src={record.image}
                      style={{ width: 48, height: 48, objectFit: "cover" }}
                    />
                    <div className="ml-12">
                      <div>{record.name}</div>
                      <div className="text-12 text-color-700">{record.id}</div>
                    </div>
                  </div>
                ),
              },
              {
                title: "Giá",
                dataIndex: "unitPrice",
                render: (value: number) => formatCurrency(value),
                width: 150,
              },
              {
                title: "Số lượng",
                render: (_: unknown, record: SelectedOrderProduct) => (
                  <InputNumber
                    min={1}
                    value={record.quantity}
                    onChange={(value) => updateProductQuantity(record.id, Number(value || 1))}
                  />
                ),
                width: 120,
              },
              {
                title: "Khuyến mãi",
                render: (_: unknown, record: SelectedOrderProduct) =>
                  record.promotion ? (
                    <div>
                      <div>{record.promotion.campaignName}</div>
                      <div className="text-12 text-color-700">
                        {record.promotion.discountType === "percent"
                          ? `${record.promotion.discountValue}%`
                          : formatCurrency(record.promotion.discountValue)}
                      </div>
                    </div>
                  ) : (
                    <Text type="secondary">Không áp dụng</Text>
                  ),
                width: 220,
              },
              {
                title: "Thành tiền",
                dataIndex: "lineTotal",
                render: (value: number) => formatCurrency(value),
                width: 150,
              },
              {
                title: "Thao tác",
                render: (_: unknown, record: SelectedOrderProduct) => (
                  <Popconfirm
                    title="Xoá sản phẩm khỏi đơn hàng?"
                    onConfirm={() => removeProductFromOrder(record.id)}
                  >
                    <Button danger size="small">
                      Xoá
                    </Button>
                  </Popconfirm>
                ),
                width: 100,
              },
            ]}
          />

          <Divider orientation="left">Vận chuyển & thanh toán</Divider>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="idDVVC"
                label="Đơn vị vận chuyển"
                rules={[{ required: true, message: "Vui lòng chọn đơn vị vận chuyển" }]}
              >
                <Select
                  size="large"
                  options={SHIPPING_PROVIDERS.map((item) => ({
                    value: item.id,
                    label: `${item.label} (${formatCurrency(item.feePerKg)}/kg)`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="weight"
                label="Khối lượng (kg)"
                rules={[{ required: true, message: "Vui lòng nhập khối lượng" }]}
              >
                <InputNumber className="h-40 w-full" min={1} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="length"
                label="Dài (cm)"
                rules={[{ required: true, message: "Vui lòng nhập chiều dài" }]}
              >
                <InputNumber className="h-40 w-full" min={1} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="width"
                label="Rộng (cm)"
                rules={[{ required: true, message: "Vui lòng nhập chiều rộng" }]}
              >
                <InputNumber className="h-40 w-full" min={1} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="height"
                label="Cao (cm)"
                rules={[{ required: true, message: "Vui lòng nhập chiều cao" }]}
              >
                <InputNumber className="h-40 w-full" min={1} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="typePayment"
                label="Hình thức thanh toán"
                rules={[{ required: true, message: "Vui lòng chọn hình thức thanh toán" }]}
              >
                <Radio.Group>
                  <Radio value="COD">COD</Radio>
                  <Radio value="BANK_TRANSFER">Chuyển khoản</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" className="mt-16">
            <Row gutter={16}>
              <Col span={8}>
                <div className="text-14 text-color-700">Tiền hàng</div>
                <div className="text-18 font-semibold">{formatCurrency(totalProductAmount)}</div>
              </Col>
              <Col span={8}>
                <div className="text-14 text-color-700">Phí ship</div>
                <div className="text-18 font-semibold">{formatCurrency(shipFeePreview)}</div>
              </Col>
              <Col span={8}>
                <div className="text-14 text-color-700">Tổng thanh toán</div>
                <div className="text-20 font-semibold text-primary-500">
                  {formatCurrency(grandTotalPreview)}
                </div>
              </Col>
            </Row>
          </Card>
        </Form>
      </Drawer>

      <Modal
        title="Chọn sản phẩm"
        open={productPickerOpen}
        width={1100}
        footer={null}
        onCancel={() => setProductPickerOpen(false)}
      >
        <div className="mb-16 flex items-center gap-12">
          <Input
            placeholder="Tìm theo ID hoặc tên sản phẩm"
            value={productKeyword}
            onChange={(e) => setProductKeyword(e.target.value)}
          />
        </div>

        <Table
          rowKey="id"
          bordered
          dataSource={filteredProducts}
          columns={productColumns}
          scroll={{ x: 900, y: 500 }}
          pagination={{ pageSize: 8 }}
        />
      </Modal>

      <Modal
        title="Chi tiết đơn hàng"
        open={detailOpen}
        width={1000}
        footer={null}
        onCancel={() => setDetailOpen(false)}
      >
        {selectedOrder ? (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div className="mb-8 font-medium">Mã đơn: {selectedOrder.id}</div>
                <div>Khách hàng: {selectedOrder.customerName}</div>
                <div>SĐT: {selectedOrder.customerPhone}</div>
                <div>Loại khách: {selectedOrder.typeUser}</div>
                <div>Địa chỉ nhận: {selectedOrder.addressReceive}</div>
              </Col>
              <Col span={12}>
                <div>Showroom gửi: {selectedOrder.addressShowroom}</div>
                <div>
                  DVVC:{" "}
                  {SHIPPING_PROVIDERS.find((item) => item.id === selectedOrder.idDVVC)?.label}
                </div>
                <div>
                  Thanh toán: {selectedOrder.typePayment === "COD" ? "COD" : "Chuyển khoản"}
                </div>
                <div>
                  Trạng thái thanh toán:{" "}
                  {selectedOrder.statusPayment === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                </div>
                <div>Ngày tạo: {dayjs(selectedOrder.createdAt).format("DD/MM/YYYY HH:mm")}</div>
              </Col>
            </Row>

            <Divider />

            <Table
              rowKey="id"
              bordered
              pagination={false}
              dataSource={selectedOrder.products}
              columns={[
                { title: "Sản phẩm", dataIndex: "name" },
                {
                  title: "Giá",
                  dataIndex: "unitPrice",
                  render: (value: number) => formatCurrency(value),
                },
                { title: "SL", dataIndex: "quantity" },
                {
                  title: "Thành tiền",
                  dataIndex: "lineTotal",
                  render: (value: number) => formatCurrency(value),
                },
              ]}
            />

            <Divider />

            <div className="flex justify-end">
              <div className="w-[320px] rounded-radius-m bg-color-100 p-16">
                <div className="mb-8 flex justify-between">
                  <span>Tiền hàng</span>
                  <span>{formatCurrency(selectedOrder.totalProductAmount)}</span>
                </div>
                <div className="mb-8 flex justify-between">
                  <span>Phí ship</span>
                  <span>{formatCurrency(selectedOrder.shipFee)}</span>
                </div>
                <div className="flex justify-between text-16 font-semibold text-primary-500">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Huỷ đơn hàng"
        open={cancelOpen}
        width={900}
        footer={null}
        onCancel={() => setCancelOpen(false)}
      >
        {selectedOrder ? (
          <>
            <div className="mb-16 rounded-radius-m bg-color-100 p-16">
              <div className="font-medium">Đơn hàng: {selectedOrder.id}</div>
              <div>Khách hàng: {selectedOrder.customerName}</div>
              <div>Tổng tiền: {formatCurrency(selectedOrder.totalAmount)}</div>
            </div>

            <Form form={cancelForm} layout="vertical">
              <Form.Item
                name="cancelReason"
                label="Lý do huỷ đơn"
                rules={[{ required: true, message: "Vui lòng nhập lý do huỷ đơn" }]}
              >
                <Input.TextArea rows={4} placeholder="Nhập lý do huỷ đơn" />
              </Form.Item>

              <div className="flex justify-end gap-12">
                <Button onClick={() => setCancelOpen(false)}>Đóng</Button>
                <Button danger type="primary" onClick={handleCancelOrder}>
                  Xác nhận huỷ đơn
                </Button>
              </div>
            </Form>
          </>
        ) : null}
      </Modal>
    </div>
  );
};

const ManageCart = memo(Component);

export { ManageCart };