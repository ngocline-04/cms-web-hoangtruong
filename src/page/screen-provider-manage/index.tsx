import MyDatePicker from "@/components/basic/date-picker";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Upload,
  UploadProps,
} from "antd";
import Dragger from "antd/es/upload/Dragger";
import { memo, useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import saveAs from "file-saver";
import {
  CheckOutlined,
  DownloadOutlined,
  EditFilled,
  ExportOutlined,
  EyeOutlined,
  InboxOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { hideLoading, showLoading } from "../loading";
import { toast } from "react-toastify";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/App";
import { find } from "lodash";
import { STATUS_COLOR, STATUS_CUSTOMER } from "@/constant";

const Component = () => {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File>();
  const [errorFile, setErrorFile] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [provider, setProvider] = useState<any[]>([]);

  const [searchData, setSearchData] = useState<any>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchProvider = async () => {
    try {
      showLoading();

      const q = collection(db, "Provider");

      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProvider(data);
    } catch (error) {
      console.error(error);
      toast.error("Lấy dữ liệu Nhà cung cấp thất bại");
    } finally {
      hideLoading();
    }
  };

  const onSearch = useCallback(() => {
    const values = form.getFieldsValue();

    setIsSearching(true);

    let filteredData = [...provider];

    if (values.keyword) {
      filteredData = filteredData.filter(
        (item) =>
          item.name?.toLowerCase().includes(values.keyword.toLowerCase()) ||
          item.id?.toLowerCase().includes(values.keyword.toLowerCase()),
      );
    }

    if (values.dateOfBirth) {
      filteredData = filteredData.filter(
        (item) => item.dateOfBirth === values.dateOfBirth,
      );
    }

    setSearchData(filteredData);
  }, [form, provider]);

  const exportToExcel = (
    data: any,
    fileName = "production.xlsx",
    isExport: boolean,
  ) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agents");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    if (isExport) {
      saveAs(dataBlob, fileName);
      toast.success("Xuất file thành công");
    } else {
      return new File([dataBlob], fileName + ".xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }
    hideLoading();
  };

  useEffect(() => {
    fetchProvider();
  }, []);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 160,
    },
    {
      title: "Người liên hệ",
      dataIndex: "contractName",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
    },

    {
      title: "Danh mục cung cấp",
      dataIndex: "provideType",
    },
    {
      title: "Khu vực",
      dataIndex: "branchCode",
    },
    {
      title: "Trạng thái hợp tác",
      dataIndex: "status",
      render: (value: any) => {
        const status = STATUS_CUSTOMER?.[value as keyof typeof STATUS_CUSTOMER];
        return (
          <Tag color={STATUS_COLOR[value as keyof typeof STATUS_COLOR]}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      render: (_: any, record: any) => {
        return (
          <div className="flex flex-row items-center">
            <Button
              type="text"
              icon={<EyeOutlined className="text-link-500" />}
              onClick={() => {
                // getDetailConfig(record?.id, "VIEW");
              }}
            />
            <Button
              type="text"
              className="ml-16"
              icon={<EditFilled className="text-link-500" />}
              onClick={() => {
                // getDetailConfig(record?.id, "VIEW");
              }}
            />
            {record?.status == "PENDING" && (
              <Button
                type="text"
                className="ml-16"
                icon={<CheckOutlined className="text-link-500" />}
                onClick={() => {
                  // getDetailConfig(record?.id, "VIEW");
                }}
              />
            )}
          </div>
        );
      },
    },
  ];

  const propsUpload: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx", // chỉ cho phép chọn file Excel trong dialog

    beforeUpload: (file) => {
      const isExcel =
        file.type === "application/vnd.ms-excel" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      if (!isExcel) {
        message.error("Chỉ chấp nhận file Excel");
        return Upload.LIST_IGNORE;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const REQUIRED_COLUMNS = [
          "id",
          "address",
          "branchCode",
          "provideType",
          "email",
          "contractName",
          "phoneNumber",
        ];
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // header:1 -> mảng 2D

        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        const headers: string[] = json[0] || [];
        const missing = REQUIRED_COLUMNS.filter(
          (col) =>
            !headers.some(
              (h: string) => h.trim().toLowerCase() === col.toLowerCase(),
            ),
        );
        if (missing.length > 0) {
          setErrorFile(true);
          message.error(`Dữ liệu không đúng định dạng`);
        } else {
          message.success("Tải lên File thành công");
          setExcelData(rows);
        }
      };
      reader.readAsArrayBuffer(file);
      setFile(file);
      setErrorFile(false);
      return false; // ❗ ngăn không upload file
    },
  };

  const onCheckFile = useCallback(async () => {
    try {
      showLoading();

      if (!file) {
        toast.error("Vui lòng chọn file");
        return;
      }

      const data = excelData.map((item: any) => ({
        ...item,
        id: String(item.id),
        phoneNumber: String(item.phoneNumber ?? ""),
        status: "PENDING",
        createdAt: serverTimestamp(),
      }));

      const providerRef = collection(db, "Provider");
      let successCount = 0;

      for (const provider of data) {
        if (!provider?.id) {
          console.error("Thiếu id:", provider);
          continue;
        }

        await setDoc(doc(providerRef, provider?.id), provider);
        successCount++;
      }

      toast.success(`Upload thành công ${successCount} khách hàng`);
      fetchProvider();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload thất bại");
    } finally {
      hideLoading();
      setOpenModal(false);
    }
  }, [excelData, file, fetchProvider]);

  return (
    <div className="block-content">
      <Card title="Danh sách Nhà cung cấp">
        <Form
          form={form}
          name="validateOnly"
          layout="vertical"
          autoComplete="off"
          onFinish={() => {}}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name={"keyword"} label="Tìm kiếm">
                <Input
                  className="h-40"
                  placeholder="Tìm kiếm theo ID, số điện thoại"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Danh mục" name={"category"}>
                <Select
                  size="large"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={[]}
                  notFoundContent={null}
                  placeholder="Chọn danh mục"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Khu vực" name={"branchCode"}>
                <Select
                  size="large"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={[]}
                  notFoundContent={null}
                  placeholder="Chọn khu vực"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Form.Item>
              <Button
                onClick={() => onSearch()}
                type="primary"
                className="h-40"
              >
                Tìm kiếm
              </Button>
            </Form.Item>
            <Form.Item className="ml-16">
              <Button
                onClick={() => {
                  form.resetFields();
                  setIsSearching(false);
                }}
                icon={<ReloadOutlined />}
                className="h-40"
                type="default"
              >
                Reset
              </Button>
            </Form.Item>
            <Form.Item className="ml-16">
              <Button
                onClick={() => setOpenModal(true)}
                icon={<ExportOutlined />}
                className="h-40"
                type="primary"
              >
                Tải danh sách Nhà cung cấp
              </Button>
            </Form.Item>
            <Form.Item className="ml-16">
              <Button
                onClick={() => {}}
                icon={<DownloadOutlined />}
                className="h-40"
                type="default"
              >
                Tải FILE mẫu
              </Button>
            </Form.Item>
          </Row>
        </Form>
        <Table
          rowKey={"id"}
          bordered
          dataSource={isSearching ? searchData : provider}
          columns={columns}
          scroll={{ y: 500, x: 150 * columns?.length }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Tổng ${total} Nhà cung cấp`,
          }}
        />
        <Modal
          open={openModal}
          title="Thêm mới danh sách Nhà cung cấp"
          onCancel={() => setOpenModal(false)}
          width={1000}
          footer={null}
        >
          <Dragger
            {...propsUpload}
            fileList={file ? [file] : []}
            onRemove={() => setFile(null)}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Nhấn hoặc thả file vào đây để tải lên
            </p>
            <p className="ant-upload-hint">
              Hỗ trợ tải lên từng file, dung lượng không vượt quá 2MB và 10,000
              số tài khoản.
            </p>
          </Dragger>
          {errorFile ? (
            <div className="text-error-500">Vui lòng chọn một tệp.</div>
          ) : null}

          <Row justify="end" className="mt-16">
            <Button
              type="primary"
              disabled={!file || errorFile}
              className="h-40"
              onClick={onCheckFile}
            >
              Tải lên
            </Button>
            <Button
              onClick={() => {
                setFile(null);
                setErrorFile("");
                setOpenModal(false);
              }}
              type="default"
              className="ml-16 h-40"
            >
              Huỷ
            </Button>
          </Row>
        </Modal>
      </Card>
    </div>
  );
};

const ManageProvider = memo(Component);

export { ManageProvider };
