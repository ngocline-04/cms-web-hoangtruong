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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/App";
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
  const [approveForm] = Form.useForm();

  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderStatus>("PENDING_APPROVAL");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDoc | null>(null);

  const [usersByPhone, setUsersByPhone] = useState<AppUser[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [promotions, setPromotions] = useState<PromotionDoc[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    SelectedOrderProduct[]
  >([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productKeyword, setProductKeyword] = useState("");
  const [selectedPromotionId, setSelectedPromotionId] = useState<
    string | undefined
  >();

  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] =
    useState<ProductDoc | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);

  const getVariantLabel = (variant: any) => {
    const attributes = variant?.attributes || {};
    const values = Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" - ");

    return values || "Biến thể mặc định";
  };

  const promotionOptions = useMemo(() => {
    return promotions
      .filter((item) => item?.status === "ONGOING")
      .map((item) => ({
        value: item.id,
        label: item.name,
      }));
  }, [promotions]);

  const selectedPromotion = useMemo(() => {
    if (!selectedPromotionId) return null;
    return promotions.find((item) => item.id === selectedPromotionId) || null;
  }, [promotions, selectedPromotionId]);

  useEffect(() => {
    const unsubscribe = subscribeOrders(setOrders);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const { users, products, promotions } =
          await getInitialOrderReferences();
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
    const normalizedKeyword = String(keyword || "")
      .trim()
      .toLowerCase();

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
    () =>
      selectedProducts.reduce(
        (sum, item) => sum + Number(item.lineTotal || 0),
        0,
      ),
    [selectedProducts],
  );

  const grandTotalPreview = totalProductAmount + shipFeePreview;

  const handleSearchCustomerByPhone = useCallback(() => {
    const phoneNumber = String(
      createForm.getFieldValue("customerPhone") || "",
    ).trim();

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

        const rebuilt = buildSelectedOrderProduct(
          product,
          typeUser,
          promotions,
          selectedPromotion,
          item.quantity,
        );

        return {
          ...item,
          unitPrice: rebuilt.unitPrice,
          lineTotal: rebuilt.unitPrice * item.quantity,
          promotion: rebuilt.promotion,
        };
      }),
    );

    toast.success("Đã lấy thông tin khách hàng");
  }, [createForm, products, promotions, usersByPhone, selectedPromotion]);

  const addProductToOrder = useCallback(
    (product: ProductDoc, variantIndex = 0) => {
      const typeUser = (createForm.getFieldValue("typeUser") ||
        "BTC") as UserLevel;

      setSelectedProducts((prev) => {
        const builtItem = buildSelectedOrderProduct(
          product,
          typeUser,
          promotions,
          selectedPromotion,
          1,
          variantIndex,
        );

        const existing = prev.find(
          (item) =>
            item.id === product.id && item.variantId === builtItem.variantId,
        );

        if (existing) {
          return prev.map((item) => {
            if (
              item.id !== product.id ||
              item.variantId !== builtItem.variantId
            )
              return item;

            const nextQty = item.quantity + 1;
            const rebuilt = buildSelectedOrderProduct(
              product,
              typeUser,
              promotions,
              selectedPromotion,
              nextQty,
              variantIndex,
            );

            return {
              ...item,
              quantity: nextQty,
              unitPrice: rebuilt.unitPrice,
              lineTotal: rebuilt.unitPrice * nextQty,
              promotion: rebuilt.promotion,
            };
          });
        }

        return [...prev, builtItem];
      });

      setProductPickerOpen(false);
      setVariantPickerOpen(false);
      setSelectedProductForVariant(null);
      setSelectedVariantIndex(0);
    },
    [createForm, promotions, selectedPromotion],
  );

  const openVariantPickerForAdmin = useCallback(
    (product: ProductDoc) => {
      const variants = Array.isArray(product?.variants) ? product.variants : [];

      if (variants.length <= 1) {
        addProductToOrder(product, 0);
        return;
      }

      setSelectedProductForVariant(product);
      setSelectedVariantIndex(0);
      setVariantPickerOpen(true);
    },
    [addProductToOrder],
  );

  const handleChangePromotion = useCallback(
    (promotionId?: string) => {
      setSelectedPromotionId(promotionId);

      const nextPromotion =
        promotions.find((item) => item.id === promotionId) || null;

      const typeUser = (createForm.getFieldValue("typeUser") ||
        "BTC") as UserLevel;

      setSelectedProducts((prev) =>
        prev.map((item) => {
          const product = products.find((p) => p.id === item.id);
          if (!product) return item;

          const rebuilt = buildSelectedOrderProduct(
            product,
            typeUser,
            promotions,
            nextPromotion,
            item.quantity,
          );

          return {
            ...item,
            unitPrice: rebuilt.unitPrice,
            lineTotal: rebuilt.unitPrice * item.quantity,
            promotion: rebuilt.promotion,
          };
        }),
      );
    },
    [createForm, products, promotions],
  );

  const updateProductQuantity = useCallback(
    (
      productId: string,
      quantity: number,
      variantIndex = 0,
      variantId?: string,
    ) => {
      setSelectedProducts((prev) =>
        prev.map((item) => {
          if (item.id !== productId) return item;
          if (variantId && item.variantId !== variantId) return item;

          const safeQty = Math.max(1, Number(quantity || 1));
          const product = products.find((p) => p.id === item.id);
          const typeUser = (createForm.getFieldValue("typeUser") ||
            "BTC") as UserLevel;

          if (!product) {
            return {
              ...item,
              quantity: safeQty,
              lineTotal: item.unitPrice * safeQty,
            };
          }

          const rebuilt = buildSelectedOrderProduct(
            product,
            typeUser,
            promotions,
            selectedPromotion,
            safeQty,
            typeof item.variantIndex === "number"
              ? item.variantIndex
              : variantIndex,
          );

          return {
            ...item,
            quantity: safeQty,
            unitPrice: rebuilt.unitPrice,
            lineTotal: rebuilt.unitPrice * safeQty,
            promotion: rebuilt.promotion,
          };
        }),
      );
    },
    [createForm, products, promotions, selectedPromotion],
  );

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

      const paymentStatus: PaymentStatus = "PENDING";

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

      const createdOrder = await createOrder(orderPayload);

      await Promise.all([
        updateUserPurchaseStats({
          userId: values.idUser,
          orderId: createdOrder.id,
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
          orderId: createdOrder.id,
        }),
      ]);

      toast.success("Tạo đơn hàng thành công");
      setCreateOpen(false);
      setSelectedProducts([]);
      setSelectedPromotionId(undefined);
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

  const openApprove = useCallback(
    (order: OrderDoc) => {
      setSelectedOrder(order);
      approveForm.setFieldsValue({
        branchCode: undefined,
        addressShowroom: "",
        approveNote: "",
      });
      setApproveOpen(true);
    },
    [approveForm],
  );

  const handleApproveOrder = useCallback(async () => {
    try {
      const values = await approveForm.validateFields();

      if (!selectedOrder?.id) return;

      const showroom = SHOWROOM_OPTIONS.find(
        (item) => item.value === values.branchCode,
      );

      await updateDoc(doc(db, "Orders", selectedOrder.id), {
        status: "PENDING_SHIPPING",
        branchCode: values.branchCode,
        addressShowroom: values.addressShowroom || showroom?.address || "",
        approveNote: values.approveNote || "",
        approvedAt: dayjs().toISOString(),
        approvedBy: "staff_001",
        updatedAt: dayjs().toISOString(),
      });

      toast.success("Phê duyệt đơn hàng thành công");
      setApproveOpen(false);
      setSelectedOrder(null);
      approveForm.resetFields();
    } catch (error) {
      console.error(error);
      toast.error("Phê duyệt đơn hàng thất bại");
    }
  }, [approveForm, selectedOrder]);

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
        SHIPPING_PROVIDERS.find((item) => item.id === value)?.label || "-",
      width: 140,
    },
    {
      title: "Thanh toán",
      render: (_: unknown, record: OrderDoc) => (
        <div>
          <div>{record.typePayment === "COD" ? "COD" : "Chuyển khoản"}</div>
          <div className="text-12 text-color-700">
            {record.statusPayment === "PAID"
              ? "Đã thanh toán"
              : "Chờ thanh toán"}
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
        if (value === "PENDING_APPROVAL")
          return <Tag color="blue">Chờ phê duyệt</Tag>;
        if (value === "PENDING_SHIPPING")
          return <Tag color="gold">Đang chờ vận chuyển</Tag>;
        if (value === "SUCCESS") return <Tag color="green">Thành công</Tag>;
        return <Tag color="red">Đã huỷ</Tag>;
      },
      width: 170,
    },
    {
      title: "Thao tác",
      fixed: "right" as const,
      width: 260,
      render: (_: unknown, record: OrderDoc) => (
        <Space>
          <Button size="small" onClick={() => openDetail(record)}>
            Chi tiết
          </Button>

          {record.status === "PENDING_APPROVAL" ? (
            <Button
              size="small"
              type="primary"
              onClick={() => openApprove(record)}
            >
              Phê duyệt
            </Button>
          ) : null}

          {record.status === "PENDING_APPROVAL" ||
          record.status === "PENDING_SHIPPING" ? (
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
        return formatCurrency(
          getDiscountedUnitPrice(
            record,
            typeUser,
            promotions,
            selectedPromotion,
            1,
          ),
        );
      },
      width: 150,
    },
    {
      title: "Thao tác",
      render: (_: unknown, record: ProductDoc) => (
        <Button
          type="primary"
          size="small"
          onClick={() => openVariantPickerForAdmin(record)}
        >
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
                <Button
                  className="h-40"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
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
                    setSelectedPromotionId(undefined);
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
          scroll={{ x: 1600 }}
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
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              >
                <Input
                  className="h-40"
                  placeholder="Nhập số điện thoại để tìm khách hàng"
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label=" ">
                <Button
                  className="h-40 w-full"
                  onClick={handleSearchCustomerByPhone}
                >
                  Tìm khách hàng
                </Button>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="idUser"
                label="ID người mua"
                rules={[
                  { required: true, message: "Vui lòng chọn khách hàng" },
                ]}
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
                    const showroom = SHOWROOM_OPTIONS.find(
                      (item) => item.value === value,
                    );
                    createForm.setFieldValue(
                      "addressShowroom",
                      showroom?.address || "",
                    );
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="addressShowroom"
                label="Địa chỉ showroom gửi hàng"
                rules={[
                  { required: true, message: "Vui lòng nhập địa chỉ showroom" },
                ]}
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
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập địa chỉ nhận hàng",
                  },
                ]}
              >
                <Input className="h-40" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Chương trình khuyến mại">
                <Select
                  size="large"
                  allowClear
                  placeholder="Chọn chương trình khuyến mại"
                  options={promotionOptions}
                  value={selectedPromotionId}
                  onChange={handleChangePromotion}
                />
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
                      {record.variantLabel ? (
                        <div className="text-12 text-color-700">
                          {record.variantLabel}
                        </div>
                      ) : null}
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
                    onChange={(value) =>
                      updateProductQuantity(
                        record.id,
                        Number(value || 1),
                        Number(record.variantIndex || 0),
                        record.variantId,
                      )
                    }
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
                    onConfirm={() =>
                      setSelectedProducts((prev) =>
                        prev.filter(
                          (item) =>
                            !(
                              item.id === record.id &&
                              item.variantId === record.variantId
                            ),
                        ),
                      )
                    }
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
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn đơn vị vận chuyển",
                  },
                ]}
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
                rules={[
                  { required: true, message: "Vui lòng nhập khối lượng" },
                ]}
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
                rules={[
                  { required: true, message: "Vui lòng nhập chiều rộng" },
                ]}
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
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn hình thức thanh toán",
                  },
                ]}
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
                <div className="text-18 font-semibold">
                  {formatCurrency(totalProductAmount)}
                </div>
              </Col>
              <Col span={8}>
                <div className="text-14 text-color-700">Phí ship</div>
                <div className="text-18 font-semibold">
                  {formatCurrency(shipFeePreview)}
                </div>
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
                <div className="mb-8 font-medium">
                  Mã đơn: {selectedOrder.id}
                </div>
                <div>Khách hàng: {selectedOrder.customerName}</div>
                <div>SĐT: {selectedOrder.customerPhone}</div>
                <div>Loại khách: {selectedOrder.typeUser}</div>
                <div>Địa chỉ nhận: {selectedOrder.addressReceive}</div>
              </Col>
              <Col span={12}>
                <div>Showroom gửi: {selectedOrder.addressShowroom || "-"}</div>
                <div>
                  DVVC:{" "}
                  {SHIPPING_PROVIDERS.find(
                    (item) => item.id === selectedOrder.idDVVC,
                  )?.label || "-"}
                </div>
                <div>
                  Thanh toán:{" "}
                  {selectedOrder.typePayment === "COD" ? "COD" : "Chuyển khoản"}
                </div>
                <div>
                  Trạng thái thanh toán:{" "}
                  {selectedOrder.statusPayment === "PAID"
                    ? "Đã thanh toán"
                    : "Chờ thanh toán"}
                </div>
                {selectedOrder.approveNote ? (
                  <div>Ghi chú điều phối: {selectedOrder.approveNote}</div>
                ) : null}
                <div>
                  Ngày tạo:{" "}
                  {dayjs(selectedOrder.createdAt).format("DD/MM/YYYY HH:mm")}
                </div>
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
                  <span>
                    {formatCurrency(selectedOrder.totalProductAmount)}
                  </span>
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
        title="Phê duyệt đơn hàng"
        open={approveOpen}
        width={800}
        footer={null}
        onCancel={() => {
          setApproveOpen(false);
          setSelectedOrder(null);
          approveForm.resetFields();
        }}
      >
        {selectedOrder ? (
          <Form form={approveForm} layout="vertical">
            <div className="mb-16 rounded-radius-m bg-color-100 p-16">
              <div className="font-medium">Đơn hàng: {selectedOrder.id}</div>
              <div>Khách hàng: {selectedOrder.customerName}</div>
              <div>SĐT: {selectedOrder.customerPhone}</div>
              <div>Địa chỉ nhận: {selectedOrder.addressReceive}</div>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="branchCode"
                  label="Kho / showroom xuất hàng"
                  rules={[
                    { required: true, message: "Vui lòng chọn kho xuất hàng" },
                  ]}
                >
                  <Select
                    size="large"
                    options={SHOWROOM_OPTIONS}
                    onChange={(value) => {
                      const showroom = SHOWROOM_OPTIONS.find(
                        (item) => item.value === value,
                      );
                      approveForm.setFieldValue(
                        "addressShowroom",
                        showroom?.address || "",
                      );
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="addressShowroom"
                  label="Địa chỉ kho / showroom"
                  rules={[
                    { required: true, message: "Vui lòng nhập địa chỉ kho" },
                  ]}
                >
                  <Input className="h-40" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="approveNote" label="Ghi chú điều phối">
              <Input.TextArea
                rows={4}
                placeholder="Nhập ghi chú nội bộ / điều phối đơn hàng"
              />
            </Form.Item>

            <div className="flex justify-end gap-12">
              <Button
                onClick={() => {
                  setApproveOpen(false);
                  setSelectedOrder(null);
                  approveForm.resetFields();
                }}
              >
                Đóng
              </Button>
              <Button type="primary" onClick={handleApproveOrder}>
                Xác nhận phê duyệt
              </Button>
            </div>
          </Form>
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
                rules={[
                  { required: true, message: "Vui lòng nhập lý do huỷ đơn" },
                ]}
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
      <Modal
        title="Chọn biến thể sản phẩm"
        open={variantPickerOpen}
        width={800}
        footer={null}
        onCancel={() => {
          setVariantPickerOpen(false);
          setSelectedProductForVariant(null);
          setSelectedVariantIndex(0);
        }}
      >
        {selectedProductForVariant ? (
          <>
            <div className="mb-16 rounded-radius-m bg-color-100 p-16">
              <div className="font-medium">
                {selectedProductForVariant.name}
              </div>
              <div className="text-12 text-color-700">
                {selectedProductForVariant.id}
              </div>
            </div>

            <Table
              rowKey={(_, index) => `${selectedProductForVariant.id}_${index}`}
              bordered
              pagination={false}
              dataSource={selectedProductForVariant.variants || []}
              columns={[
                {
                  title: "Biến thể",
                  render: (_: any, record: any) => getVariantLabel(record),
                },
                {
                  title: "Tồn kho",
                  dataIndex: "stock",
                  width: 120,
                },
                {
                  title: "Giá BTC",
                  render: (_: any, record: any) =>
                    formatCurrency(Number(record?.prices?.btc || 0)),
                  width: 140,
                },
                {
                  title: "Giá BTB",
                  render: (_: any, record: any) =>
                    formatCurrency(Number(record?.prices?.btb || 0)),
                  width: 140,
                },
                {
                  title: "Giá CTV",
                  render: (_: any, record: any) =>
                    formatCurrency(Number(record?.prices?.ctv || 0)),
                  width: 140,
                },
                {
                  title: "Thao tác",
                  width: 120,
                  render: (_: any, record: any, index: number) => (
                    <Button
                      type="primary"
                      onClick={() =>
                        addProductToOrder(selectedProductForVariant, index)
                      }
                    >
                      Chọn
                    </Button>
                  ),
                },
              ]}
            />
          </>
        ) : null}
      </Modal>
    </div>
  );
};

const ManageCart = memo(Component);

export { ManageCart };
