import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import type {
  PaymentDoc,
  PaymentStatus,
} from "@/page/screen-manage-cart/order.types";
import { formatCurrency } from "@/page/screen-manage-cart/order.service";
import { subscribePayments, updatePaymentStatus } from "./payment.service";

type PaymentViewStatus = PaymentStatus | "FAILED";

const PAYMENT_EXPIRE_MINUTES = 30;

const getPaymentViewStatus = (record: any): PaymentViewStatus => {
  if (record?.status === "PAID") {
    return "PAID";
  }

  if (record?.typePayment !== "BANK_TRANSFER") {
    return "UNPAID";
  }

  const hasFailedSignal =
    !!record?.failedAt ||
    (record?.gatewayResponseCode &&
      String(record.gatewayResponseCode) !== "00") ||
    (record?.gatewayTransactionStatus &&
      String(record.gatewayTransactionStatus) !== "00");

  if (hasFailedSignal) {
    return "FAILED";
  }

  const createdMs = record?.createdAt ? dayjs(record.createdAt).valueOf() : 0;
  const expired =
    !!createdMs &&
    dayjs().valueOf() >= createdMs + PAYMENT_EXPIRE_MINUTES * 60 * 1000;

  if (expired) {
    return "FAILED";
  }

  return "UNPAID";
};

const getPaymentStatusTag = (record: any) => {
  const status = getPaymentViewStatus(record);

  if (status === "PAID") {
    return <Tag color="green">Đã thanh toán</Tag>;
  }

  if (status === "FAILED") {
    return <Tag color="red">Thanh toán thất bại</Tag>;
  }

  if (record?.typePayment === "COD") {
    return <Tag color="blue">Thanh toán khi nhận hàng</Tag>;
  }

  return <Tag color="gold">Chờ thanh toán</Tag>;
};

const getPaymentTypeLabel = (type?: string) => {
  if (type === "BANK_TRANSFER") return "Chuyển khoản";
  return "COD";
};

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    PaymentViewStatus | undefined
  >();
  const [typeFilter, setTypeFilter] = useState<
    "COD" | "BANK_TRANSFER" | undefined
  >();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDoc | null>(
    null,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribePayments((data) => {
      setPayments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPayments = useMemo(() => {
    const kw = keyword.trim().toLowerCase();

    return payments.filter((item) => {
      const matchedKeyword = kw
        ? [
            item.id,
            item.orderId,
            item.customerName,
            item.customerPhone,
            item.idUser,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(kw))
        : true;

      const matchedStatus = statusFilter
        ? getPaymentViewStatus(item) === statusFilter
        : true;

      const matchedType = typeFilter ? item.typePayment === typeFilter : true;

      return matchedKeyword && matchedStatus && matchedType;
    });
  }, [payments, keyword, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const totalAmount = filteredPayments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    const paidCount = filteredPayments.filter(
      (item) => getPaymentViewStatus(item) === "PAID",
    ).length;

    const unpaidCount = filteredPayments.filter(
      (item) => getPaymentViewStatus(item) === "UNPAID",
    ).length;

    const failedCount = filteredPayments.filter(
      (item) => getPaymentViewStatus(item) === "FAILED",
    ).length;

    return {
      totalCount: filteredPayments.length,
      totalAmount,
      paidCount,
      unpaidCount,
      failedCount,
    };
  }, [filteredPayments]);

  const handleOpenDetail = (payment: PaymentDoc) => {
    setSelectedPayment(payment);
    setDetailOpen(true);
  };

  const handleUpdateStatus = async (
    payment: PaymentDoc,
    nextStatus: PaymentStatus,
  ) => {
    try {
      setUpdatingId(payment.id);
      await updatePaymentStatus(payment.id, nextStatus);
      toast.success("Cập nhật trạng thái thanh toán thành công");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật trạng thái thanh toán thất bại");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: ColumnsType<PaymentDoc> = [
    {
      title: "Mã thanh toán",
      dataIndex: "id",
      width: 180,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      title: "Mã đơn",
      dataIndex: "orderId",
      width: 180,
    },
    {
      title: "Khách hàng",
      width: 220,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.customerName || "-"}</div>
          <div className="text-13 text-color-700">
            {record.customerPhone || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Phương thức",
      dataIndex: "typePayment",
      width: 140,
      render: (value: string) => getPaymentTypeLabel(value),
    },
    {
      title: "Trạng thái",
      width: 160,
      render: (_, record) => getPaymentStatusTag(record),
    },
    {
      title: "Tổng tiền",
      dataIndex: "amount",
      width: 150,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 170,
      render: (value?: string) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "paidAt",
      width: 170,
      render: (value?: string | null) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Thao tác",
      width: 220,
      render: (_, record) => {
        const status = getPaymentViewStatus(record);
        return (
          <Space>
            <Button size="small" onClick={() => handleOpenDetail(record)}>
              Chi tiết
            </Button>

            {record.status !== "PAID" && status != "FAILED" ? (
              <Button
                size="small"
                type="primary"
                loading={updatingId === record.id}
                onClick={() => handleUpdateStatus(record, "PAID")}
              >
                Đánh dấu đã thanh toán
              </Button>
            ) : null}
          </Space>
        );
      },
    },
  ];

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  return (
    <div className="block-content">
      <Row gutter={[16, 16]} className="mb-24">
        <Col span={6} mobile={24}>
          <Card bordered={false}>
            <Statistic title="Tổng giao dịch" value={stats.totalCount} />
          </Card>
        </Col>
        <Col span={6} mobile={24}>
          <Card bordered={false}>
            <Statistic title="Đã thanh toán" value={stats.paidCount} />
          </Card>
        </Col>
        <Col span={6} mobile={24}>
          <Card bordered={false}>
            <Statistic title="Chờ thanh toán" value={stats.unpaidCount} />
          </Card>
        </Col>
        <Col span={6} mobile={24}>
          <Card bordered={false}>
            <Statistic title="Thanh toán thất bại" value={stats.failedCount} />
          </Card>
        </Col>
        <Col span={6} mobile={24}>
          <Card bordered={false}>
            <Statistic
              title="Tổng tiền"
              value={stats.totalAmount}
              formatter={(value) => formatCurrency(Number(value || 0))}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Danh sách thanh toán"
        bordered={false}
        className="rounded-radius-xl shadow-down-s"
      >
        <Row gutter={[16, 16]} className="mb-16">
          <Col span={10} mobile={24}>
            <Input.Search
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã thanh toán, mã đơn, tên khách, SĐT"
            />
          </Col>

          <Col span={7} mobile={24}>
            <Select
              allowClear
              className="w-full"
              placeholder="Lọc trạng thái"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: "PAID", label: "Đã thanh toán" },
                { value: "UNPAID", label: "Chờ thanh toán" },
                { value: "FAILED", label: "Thanh toán thất bại" },
              ]}
            />
          </Col>

          <Col span={7} mobile={24}>
            <Select
              allowClear
              className="w-full"
              placeholder="Lọc phương thức"
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              options={[
                { value: "COD", label: "COD" },
                { value: "BANK_TRANSFER", label: "Chuyển khoản" },
              ]}
            />
          </Col>
        </Row>

        <Table
          rowKey="id"
          bordered
          loading={loading}
          dataSource={filteredPayments}
          columns={columns}
          scroll={{ x: 1400 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Tổng ${total} đơn hàng`,
            onChange: (page, pageSize) => {
              setPagination({
                current: page,
                pageSize: pageSize || 10,
              });
            },
          }}
          locale={{
            emptyText: <Empty description="Chưa có dữ liệu thanh toán" />,
          }}
        />
      </Card>

      <Modal
        title="Chi tiết thanh toán"
        open={detailOpen}
        footer={null}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedPayment(null);
        }}
        width={760}
      >
        {selectedPayment ? (
          <div className="grid gap-12 text-14 text-color-800">
            <div>
              <span className="font-medium">Mã thanh toán:</span>{" "}
              {selectedPayment.id}
            </div>
            <div>
              <span className="font-medium">Mã đơn:</span>{" "}
              {selectedPayment.orderId}
            </div>
            <div>
              <span className="font-medium">Mã người dùng:</span>{" "}
              {selectedPayment.idUser}
            </div>
            <div>
              <span className="font-medium">Khách hàng:</span>{" "}
              {selectedPayment.customerName}
            </div>
            <div>
              <span className="font-medium">Số điện thoại:</span>{" "}
              {selectedPayment.customerPhone}
            </div>
            <div>
              <span className="font-medium">Phương thức:</span>{" "}
              {getPaymentTypeLabel(selectedPayment.typePayment)}
            </div>
            <div>
              <span className="font-medium">Trạng thái:</span>{" "}
              {getPaymentStatusTag(selectedPayment)}
            </div>
            <div>
              <span className="font-medium">Tiền hàng:</span>{" "}
              {formatCurrency(selectedPayment.totalProductAmount)}
            </div>
            <div>
              <span className="font-medium">Phí ship:</span>{" "}
              {formatCurrency(selectedPayment.shipFee)}
            </div>
            <div>
              <span className="font-medium">Tổng thanh toán:</span>{" "}
              {formatCurrency(selectedPayment.amount)}
            </div>
            <div>
              <span className="font-medium">Nguồn:</span>{" "}
              {selectedPayment.source}
            </div>
            <div>
              <span className="font-medium">Ngày tạo:</span>{" "}
              {selectedPayment.createdAt
                ? dayjs(selectedPayment.createdAt).format("DD/MM/YYYY HH:mm")
                : "-"}
            </div>
            <div>
              <span className="font-medium">Ngày thanh toán:</span>{" "}
              {selectedPayment.paidAt
                ? dayjs(selectedPayment.paidAt).format("DD/MM/YYYY HH:mm")
                : "-"}
            </div>
            <div>
              <span className="font-medium">Ngày thất bại:</span>{" "}
              {selectedPayment.failedAt
                ? dayjs(selectedPayment.failedAt).format("DD/MM/YYYY HH:mm")
                : "-"}
            </div>
            <div>
              <span className="font-medium">gatewayResponseCode:</span>{" "}
              {selectedPayment.gatewayResponseCode || "-"}
            </div>
            <div>
              <span className="font-medium">gatewayTransactionStatus:</span>{" "}
              {selectedPayment.gatewayTransactionStatus || "-"}
            </div>
            <div>
              <span className="font-medium">dateKey:</span>{" "}
              {selectedPayment.dateKey}
            </div>
            <div>
              <span className="font-medium">monthKey:</span>{" "}
              {selectedPayment.monthKey}
            </div>
            <div>
              <span className="font-medium">timeBucket:</span>{" "}
              {selectedPayment.timeBucket}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
