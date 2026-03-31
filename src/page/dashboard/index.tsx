import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Badge,
} from "antd";
import {
  BarChartOutlined,
  DownloadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/App";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import saveAs from "file-saver";

const { Title, Text } = Typography;

type OrderDoc = {
  id: string;
  idUser: string;
  customerName: string;
  totalAmount: number;
  status: string;
  statusPayment: string;
  createdAt: string;
  monthKey?: string;
  dateKey?: string;
};

type ProductSaleLogDoc = {
  id: string;
  orderId: string;
  idProduct: string;
  productName: string;
  idUser: string;
  customerName: string;
  quantity: number;
  lineTotal: number;
  monthKey?: string;
  dateKey?: string;
  createdAt: string;
};

type TopProductRow = {
  key: string;
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  totalOrders: number;
};

type TopCustomerRow = {
  key: string;
  userId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
};

type DailyCustomerChartRow = {
  date: string;
  customers: number;
};

type MonthlyProductChartRow = {
  name: string;
  quantity: number;
  fill: string;
};

type StatusChartRow = {
  name: string;
  value: number;
  color: string;
};

const BAR_COLORS = ["#1677ff", "#52c41a", "#faad14", "#eb2f96", "#13c2c2"];

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";

const getMonthOptions = () => {
  return Array.from({ length: 12 }).map((_, index) => {
    const month = dayjs().month(index);
    return {
      value: month.format("YYYY-MM"),
      label: `Tháng ${month.format("MM/YYYY")}`,
    };
  });
};

const DashboardCard = ({
  title,
  value,
  prefix,
  subtitle,
  className,
}: {
  title: string;
  value: React.ReactNode;
  prefix: React.ReactNode;
  subtitle?: string;
  className?: string;
}) => {
  return (
    <Card
      className={`rounded-radius-xl border-weight-none ${className || ""}`}
      bodyStyle={{ padding: 20 }}
    >
      <div className="flex items-start justify-between gap-16">
        <div className="min-w-0 flex-1">
          <div className="mb-8 text-14 leading-20 text-color-700">{title}</div>
          <div className="mb-8 break-words text-24 font-semibold leading-32 text-color-900 tablet:text-20">
            {value}
          </div>
          {subtitle ? (
            <div className="text-13 leading-20 text-color-700">{subtitle}</div>
          ) : null}
        </div>

        <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-radius-xl bg-common-0/20 text-20 text-common-0">
          {prefix}
        </div>
      </div>
    </Card>
  );
};

const Component = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs().format("YYYY-MM"),
  );

  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [saleLogs, setSaleLogs] = useState<ProductSaleLogDoc[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [orderSnap, saleSnap] = await Promise.all([
        getDocs(collection(db, "Orders")),
        getDocs(collection(db, "ProductSalesLedger")),
      ]);

      const orderDocs = orderSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as OrderDoc[];

      const saleDocs = saleSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as ProductSaleLogDoc[];

      setOrders(orderDocs);
      setSaleLogs(saleDocs);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      const monthKey = item.monthKey || dayjs(item.createdAt).format("YYYY-MM");
      return monthKey === selectedMonth;
    });
  }, [orders, selectedMonth]);

  const filteredSaleLogs = useMemo(() => {
    return saleLogs.filter((item) => {
      const monthKey = item.monthKey || dayjs(item.createdAt).format("YYYY-MM");
      return monthKey === selectedMonth;
    });
  }, [saleLogs, selectedMonth]);

  const validOrders = useMemo(() => {
    return filteredOrders.filter((item) => item.status !== "CANCELLED");
  }, [filteredOrders]);

  const totalOrdersSold = useMemo(() => validOrders.length, [validOrders]);

  const uniqueCustomers = useMemo(() => {
    return new Set(validOrders.map((item) => item.idUser)).size;
  }, [validOrders]);

  const totalRevenue = useMemo(() => {
    return validOrders.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0,
    );
  }, [validOrders]);

  const avgCustomersPerDay = useMemo(() => {
    const dailyMap = new Map<string, Set<string>>();

    validOrders.forEach((item) => {
      const dateKey =
        item.dateKey || dayjs(item.createdAt).format("YYYY-MM-DD");

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, new Set<string>());
      }

      dailyMap.get(dateKey)?.add(item.idUser);
    });

    const values = Array.from(dailyMap.values()).map((set) => set.size);
    if (!values.length) return 0;

    const total = values.reduce((sum, value) => sum + value, 0);
    return Number((total / values.length).toFixed(1));
  }, [validOrders]);

  const topProducts = useMemo<TopProductRow[]>(() => {
    const grouped = new Map<
      string,
      {
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
        orderIds: Set<string>;
      }
    >();

    filteredSaleLogs.forEach((item) => {
      const key = item.idProduct;
      const current = grouped.get(key);

      if (current) {
        current.quantity += Number(item.quantity || 0);
        current.revenue += Number(item.lineTotal || 0);
        current.orderIds.add(item.orderId);
        return;
      }

      grouped.set(key, {
        productId: item.idProduct,
        productName: item.productName,
        quantity: Number(item.quantity || 0),
        revenue: Number(item.lineTotal || 0),
        orderIds: new Set([item.orderId]),
      });
    });

    return Array.from(grouped.values())
      .map((item) => ({
        key: item.productId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        revenue: item.revenue,
        totalOrders: item.orderIds.size,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredSaleLogs]);

  const topCustomers = useMemo<TopCustomerRow[]>(() => {
    const grouped = new Map<
      string,
      {
        userId: string;
        customerName: string;
        totalOrders: number;
        totalSpent: number;
      }
    >();

    validOrders.forEach((item) => {
      const current = grouped.get(item.idUser);

      if (current) {
        current.totalOrders += 1;
        current.totalSpent += Number(item.totalAmount || 0);
        return;
      }

      grouped.set(item.idUser, {
        userId: item.idUser,
        customerName: item.customerName,
        totalOrders: 1,
        totalSpent: Number(item.totalAmount || 0),
      });
    });

    return Array.from(grouped.values())
      .map((item) => ({
        key: item.userId,
        ...item,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }, [validOrders]);

  const dailyCustomerChart = useMemo<DailyCustomerChartRow[]>(() => {
    const grouped = new Map<string, Set<string>>();

    validOrders.forEach((item) => {
      const rawDate =
        item.dateKey || dayjs(item.createdAt).format("YYYY-MM-DD");

      if (!grouped.has(rawDate)) {
        grouped.set(rawDate, new Set<string>());
      }

      grouped.get(rawDate)?.add(item.idUser);
    });

    return Array.from(grouped.entries())
      .map(([date, customers]) => ({
        date: dayjs(date).format("DD/MM"),
        customers: customers.size,
      }))
      .sort(
        (a, b) =>
          dayjs(a.date, "DD/MM").valueOf() - dayjs(b.date, "DD/MM").valueOf(),
      );
  }, [validOrders]);

  const monthlyTopProductChart = useMemo<MonthlyProductChartRow[]>(() => {
    return topProducts.slice(0, 5).map((item, index) => ({
      name:
        item.productName.length > 16
          ? `${item.productName.slice(0, 16)}...`
          : item.productName,
      quantity: item.quantity,
      fill: BAR_COLORS[index % BAR_COLORS.length],
    }));
  }, [topProducts]);

  const orderStatusChart = useMemo<StatusChartRow[]>(() => {
    const pendingApproval = filteredOrders.filter(
      (item) => item.status === "PENDING_APPROVAL",
    ).length;
    const pendingShipping = filteredOrders.filter(
      (item) => item.status === "PENDING_SHIPPING",
    ).length;
    const success = filteredOrders.filter(
      (item) => item.status === "SUCCESS",
    ).length;
    const cancelled = filteredOrders.filter(
      (item) => item.status === "CANCELLED",
    ).length;

    return [
      { name: "Chờ duyệt", value: pendingApproval, color: "#1677ff" },
      { name: "Chờ vận chuyển", value: pendingShipping, color: "#faad14" },
      { name: "Thành công", value: success, color: "#52c41a" },
      { name: "Đã huỷ", value: cancelled, color: "#ff4d4f" },
    ].filter((item) => item.value > 0);
  }, [filteredOrders]);

  const handleExportReport = useCallback(() => {
    try {
      const summarySheet = [
        {
          "Tháng báo cáo": selectedMonth,
          "Số đơn hàng bán ra": totalOrdersSold,
          "Số khách hàng mua": uniqueCustomers,
          "Số khách TB mỗi ngày": avgCustomersPerDay,
          "Doanh thu tháng": totalRevenue,
        },
      ];

      const topProductsSheet = topProducts.map((item, index) => ({
        STT: index + 1,
        "Mã sản phẩm": item.productId,
        "Tên sản phẩm": item.productName,
        "Số lượng bán": item.quantity,
        "Số đơn": item.totalOrders,
        "Doanh thu": item.revenue,
      }));

      const topCustomersSheet = topCustomers.map((item, index) => ({
        STT: index + 1,
        "Mã khách hàng": item.userId,
        "Tên khách hàng": item.customerName,
        "Số đơn hàng": item.totalOrders,
        "Tổng chi tiêu": item.totalSpent,
      }));

      const dailyCustomersSheet = dailyCustomerChart.map((item) => ({
        Ngày: item.date,
        "Số khách hàng": item.customers,
      }));

      const orderStatusSheet = orderStatusChart.map((item) => ({
        "Trạng thái": item.name,
        "Số lượng": item.value,
      }));

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(summarySheet),
        "Tong quan",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(topProductsSheet),
        "Top san pham",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(topCustomersSheet),
        "Top khach hang",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(dailyCustomersSheet),
        "Khach theo ngay",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(orderStatusSheet),
        "Trang thai don",
      );

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(fileData, `bao-cao-dashboard-${selectedMonth}.xlsx`);
      toast.success("Xuất báo cáo thành công");
    } catch (error) {
      console.error(error);
      toast.error("Xuất báo cáo thất bại");
    }
  }, [
    avgCustomersPerDay,
    dailyCustomerChart,
    orderStatusChart,
    selectedMonth,
    topCustomers,
    topProducts,
    totalOrdersSold,
    totalRevenue,
    uniqueCustomers,
  ]);

  const productColumns = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      render: (value: string, record: TopProductRow, index: number) => (
        <div className="flex items-center gap-12">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-radius-full text-13 font-semibold text-common-1000 ${
              index === 0
                ? "bg-error-500"
                : index === 1
                  ? "bg-link-500"
                  : index === 2
                    ? "bg-success-500"
                    : "bg-color-500"
            }`}
          >
            {index + 1}
          </div>
          <div>
            <div className="text-14 font-medium text-color-900">{value}</div>
            <div className="text-12 text-color-700">{record.productId}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Đã bán",
      dataIndex: "quantity",
      width: 120,
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Số đơn",
      dataIndex: "totalOrders",
      width: 120,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      width: 180,
      render: (value: number) => formatCurrency(value),
    },
  ];

  const customerColumns = [
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      render: (value: string, record: TopCustomerRow, index: number) => (
        <div className="flex items-center gap-12">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-radius-full text-13 font-semibold text-common-1000 ${
              index === 0
                ? "bg-primary-500"
                : index === 1
                  ? "bg-link-500"
                  : index === 2
                    ? "bg-success-500"
                    : "bg-color-500"
            }`}
          >
            {index + 1}
          </div>
          <div>
            <div className="text-14 font-medium text-color-900">{value}</div>
            <div className="text-12 text-color-700">{record.userId}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Số đơn",
      dataIndex: "totalOrders",
      width: 120,
    },
    {
      title: "Tổng chi",
      dataIndex: "totalSpent",
      width: 180,
      render: (value: number) => formatCurrency(value),
    },
  ];

  return (
    <div className="block-content">
      <div className="mb-16 rounded-radius-xxl bg-gradient-to-r from-primary-500 to-link-600 p-24 text-common-1000">
        <div className="flex flex-col gap-16 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <Title level={3} className="!mb-8 !text-common-1000">
              Dashboard thống kê bán hàng
            </Title>
            <Text className="text-14 text-common-1000">
              Theo dõi hiệu suất kinh doanh, sản phẩm nổi bật và hành vi mua sắm
              theo tháng
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-12">
            <div className="rounded-radius-l bg-common-0/20 px-12 py-8 text-13 text-common-1000">
              Dữ liệu cập nhật realtime
            </div>

            <Select
              size="large"
              className="min-w-[180px]"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={getMonthOptions()}
            />

            <Button
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleExportReport}
            >
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} className="mb-16">
            <Col xs={24} sm={12} xl={6}>
              <DashboardCard
                title="Số đơn hàng bán ra"
                value={totalOrdersSold}
                subtitle="Đơn hàng hợp lệ trong tháng"
                prefix={<ShoppingCartOutlined />}
                className="bg-gradient-to-br from-link-500 to-link-700 text-common-1000"
              />
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <DashboardCard
                title="Khách hàng mua"
                value={uniqueCustomers}
                subtitle="Số khách phát sinh giao dịch"
                prefix={<TeamOutlined />}
                className="bg-gradient-to-br from-success-500 to-success-700 text-common-1000"
              />
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <DashboardCard
                title="Khách TB mỗi ngày"
                value={avgCustomersPerDay}
                subtitle="Mức trung bình theo ngày"
                prefix={<BarChartOutlined />}
                className="bg-gradient-to-br from-pending-500 to-pending-700 text-common-1000"
              />
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <DashboardCard
                title="Doanh thu tháng"
                value={formatCurrency(totalRevenue)}
                subtitle="Tổng giá trị đơn thành công/chờ xử lý"
                prefix={<TrophyOutlined />}
                className="bg-gradient-to-br from-error-500 to-error-700 text-color-100"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mb-16">
            <Col xs={24} xl={16}>
              <Card
                title="Sản phẩm bán chạy theo tháng"
                className="rounded-radius-xl border-weight-none"
              >
                {monthlyTopProductChart.length ? (
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTopProductChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="quantity" radius={[10, 10, 0, 0]}>
                          {monthlyTopProductChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Empty description="Chưa có dữ liệu sản phẩm" />
                )}
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card
                title="Cơ cấu trạng thái đơn"
                className="rounded-radius-xl border-weight-none"
                bodyStyle={{ padding: 20 }}
              >
                {orderStatusChart.length ? (
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={11} xl={24} xxl={11}>
                      <div className="h-[260px] mobile:h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip
                              formatter={(value: number, name: string) => [
                                value,
                                name,
                              ]}
                            />
                            <Pie
                              data={orderStatusChart}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={4}
                              stroke="transparent"
                            >
                              {orderStatusChart.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>

                            <text
                              x="50%"
                              y="46%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-current text-24 font-semibold text-color-900"
                            >
                              {filteredOrders.length}
                            </text>
                            <text
                              x="50%"
                              y="58%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-current text-12 text-color-700"
                            >
                              Tổng đơn
                            </text>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Col>

                    <Col xs={24} md={13} xl={24} xxl={13}>
                      <div className="grid grid-cols-1 gap-12 mobile:grid-cols-1 tablet:grid-cols-2 xl:grid-cols-1">
                        {orderStatusChart.map((item) => {
                          const percent = filteredOrders.length
                            ? Math.round(
                                (item.value / filteredOrders.length) * 100,
                              )
                            : 0;

                          return (
                            <div
                              key={item.name}
                              className="rounded-radius-l bg-color-100 p-12"
                            >
                              <div className="mb-8 flex items-center justify-between gap-12">
                                <div className="flex min-w-0 items-center gap-8">
                                  <span
                                    className="inline-block h-12 w-12 shrink-0 rounded-radius-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="truncate text-14 font-medium text-color-900">
                                    {item.name}
                                  </span>
                                </div>

                                <Badge
                                  count={item.value}
                                  overflowCount={999}
                                  style={{
                                    backgroundColor: item.color,
                                  }}
                                />
                              </div>

                              <div className="mb-6 flex items-center justify-between text-12 text-color-700">
                                <span>Tỷ trọng</span>
                                <span>{percent}%</span>
                              </div>

                              <Progress
                                percent={percent}
                                showInfo={false}
                                strokeColor={item.color}
                                trailColor="rgba(0,0,0,0.06)"
                                size="small"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </Col>
                  </Row>
                ) : (
                  <Empty description="Chưa có dữ liệu trạng thái đơn" />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="mb-16">
            <Col xs={24}>
              <Card
                title="Số khách TB mỗi ngày"
                className="rounded-radius-xl border-weight-none"
              >
                {dailyCustomerChart.length ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyCustomerChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="customers"
                          stroke="#1677ff"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Empty description="Chưa có dữ liệu khách hàng theo ngày" />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <Card
                title="Top sản phẩm bán chạy"
                className="rounded-radius-xl border-weight-none"
              >
                <Table
                  rowKey="key"
                  bordered={false}
                  dataSource={topProducts}
                  columns={productColumns as any}
                  pagination={false}
                  scroll={{ x: 760 }}
                  locale={{ emptyText: "Chưa có dữ liệu" }}
                />
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                title="Khách hàng mua nhiều"
                className="rounded-radius-xl border-weight-none"
              >
                <Table
                  rowKey="key"
                  bordered={false}
                  dataSource={topCustomers}
                  columns={customerColumns as any}
                  pagination={false}
                  scroll={{ x: 680 }}
                  locale={{ emptyText: "Chưa có dữ liệu" }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

const DashboardPage = memo(Component);

export default DashboardPage;