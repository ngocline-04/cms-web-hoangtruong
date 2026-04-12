// import MyDatePicker from "@/components/basic/date-picker";
// import {
//   Button,
//   Card,
//   Col,
//   Form,
//   Input,
//   message,
//   Modal,
//   Row,
//   Select,
//   Table,
//   Tag,
//   Upload,
//   UploadProps,
// } from "antd";
// import Dragger from "antd/es/upload/Dragger";
// import { memo, useCallback, useEffect, useState } from "react";
// import * as XLSX from "xlsx";
// import saveAs from "file-saver";
// import {
//   DownloadOutlined,
//   EditFilled,
//   ExportOutlined,
//   EyeOutlined,
//   InboxOutlined,
//   ReloadOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import { hideLoading, showLoading } from "../loading";
// import { toast } from "react-toastify";
// import { transformProducts } from "@/utils/common";
// import { collection, doc, getDocs, setDoc } from "firebase/firestore";
// import { db } from "@/App";

// const Component = () => {
//   const [form] = Form.useForm();
//   const [file, setFile] = useState<File>();
//   const [errorFile, setErrorFile] = useState(false);

//   const [openModal, setOpenModal] = useState(false);
//   const [excelData, setExcelData] = useState<any[]>([]);
//   const [products, setProducts] = useState<any[]>([]);

//   const [searchData, setSearchData] = useState<any>([]);
//   const [isSearching, setIsSearching] = useState(false);

//   const fetchProducts = async () => {
//     try {
//       showLoading();

//       const querySnapshot = await getDocs(collection(db, "Products"));

//       const data = querySnapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));

//       setProducts(data);
//     } catch (error) {
//       console.error(error);
//       toast.error("Lấy dữ liệu sản phẩm thất bại");
//     } finally {
//       hideLoading();
//     }
//   };

//   const onSearch = useCallback(() => {
//     const values = form.getFieldsValue();

//     setIsSearching(true);

//     let filteredData = [...products];

//     if (values.keyword) {
//       filteredData = filteredData.filter(
//         (item) =>
//           item.name?.toLowerCase().includes(values.keyword.toLowerCase()) ||
//           item.id?.toLowerCase().includes(values.keyword.toLowerCase()),
//       );
//     }

//     if (values.status) {
//       filteredData = filteredData.filter(
//         (item) => item.status === values.status,
//       );
//     }

//     if (values.createdAt) {
//       filteredData = filteredData.filter((item) =>
//         dayjs(item.createAt).isSame(values.createdAt, "day"),
//       );
//     }

//     setSearchData(filteredData);
//   }, [form, products]);

//   const exportToExcel = (
//     data: any,
//     fileName = "production.xlsx",
//     isExport: boolean,
//   ) => {
//     const worksheet = XLSX.utils.json_to_sheet(data);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Agents");

//     const excelBuffer = XLSX.write(workbook, {
//       bookType: "xlsx",
//       type: "array",
//     });

//     const dataBlob = new Blob([excelBuffer], {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });

//     if (isExport) {
//       saveAs(dataBlob, fileName);
//       toast.success("Xuất file thành công");
//     } else {
//       return new File([dataBlob], fileName + ".xlsx", {
//         type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       });
//     }
//     hideLoading();
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const columns = [
//     {
//       title: "Ảnh",
//       render: (_: any, record: any) => (
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
//       width: 160,
//     },

//     {
//       title: "Tên sản phẩm",
//       dataIndex: "name",
//       width: 300,
//     },

//     {
//       title: "Danh mục",
//       dataIndex: "category",
//     },

//     {
//       title: "Giá CTV",
//       render: (_: any, record: any) => {
//         const price = record.variants?.[0]?.prices?.ctv || 0;
//         return price.toLocaleString("vi-VN") + " ₫";
//       },
//     },

//     {
//       title: "Giá BTC",
//       render: (_: any, record: any) => {
//         const price = record.variants?.[0]?.prices?.btc || 0;
//         return price.toLocaleString("vi-VN") + " ₫";
//       },
//     },

//     {
//       title: "Giá BTB",
//       render: (_: any, record: any) => {
//         const price = record.variants?.[0]?.prices?.btb || 0;
//         return price.toLocaleString("vi-VN") + " ₫";
//       },
//     },

//     {
//       title: "Tồn kho",
//       render: (_: any, record: any) => {
//         const total = record.variants?.reduce(
//           (sum: number, v: any) => sum + (v.stock || 0),
//           0,
//         );
//         return total;
//       },
//     },

//     {
//       title: "Variants",
//       render: (_: any, record: any) => record.variants?.length || 1,
//     },

//     {
//       title: "Trạng thái",
//       dataIndex: "status",
//       render: (value: string) => {
//         if (value === "AVAILABLE") return <Tag color="green">Còn hàng</Tag>;
//         if (value === "SOLDOUT") return <Tag color="red">Hết hàng</Tag>;
//         return <Tag color="orange">Không khả dụng</Tag>;
//       },
//     },
//     {
//       title: "Thao tác",
//       render: () => {
//         return (
//           <div className="flex flex-row items-center">
//             <Button
//               type="text"
//               icon={<EyeOutlined className="text-link-500" />}
//               onClick={() => {
//                 // getDetailConfig(record?.id, "VIEW");
//               }}
//             />
//              <Button
//               type="text"
//               className="ml-16"
//               icon={<EditFilled className="text-link-500" />}
//               onClick={() => {
//                 // getDetailConfig(record?.id, "VIEW");
//               }}
//             />
//           </div>
//         );
//       },
//     },
//   ];

//   const propsUpload: UploadProps = {
//     name: "file",
//     multiple: false,
//     accept: ".xlsx", // chỉ cho phép chọn file Excel trong dialog

//     beforeUpload: (file) => {
//       const isExcel =
//         file.type === "application/vnd.ms-excel" ||
//         file.type ===
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

//       if (!isExcel) {
//         message.error("Chỉ chấp nhận file Excel");
//         return Upload.LIST_IGNORE;
//       }

//       const reader = new FileReader();
//       reader.onload = async (e) => {
//         const REQUIRED_COLUMNS = [
//           "id",
//           "name",
//           // "attribute_size",
//           "category",
//           "description",
//           "quality",
//           // "attribute_material",
//           // "attribute_color",
//           "origin",
//           "guarantee",
//           "amount",
//           "status",
//           "createAt",
//           // "image1",
//           // "image2",
//           "price_ctv",
//           "price_btc",
//           "price_btb",
//         ];
//         const data = new Uint8Array(e.target?.result as ArrayBuffer);
//         const workbook = XLSX.read(data, { type: "array" });
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];
//         const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // header:1 -> mảng 2D

//         const rows: any[] = XLSX.utils.sheet_to_json(sheet);
//         const headers: string[] = json[0] || [];
//         const missing = REQUIRED_COLUMNS.filter(
//           (col) =>
//             !headers.some(
//               (h: string) => h.trim().toLowerCase() === col.toLowerCase(),
//             ),
//         );
//         if (missing.length > 0) {
//           setErrorFile(true);
//           message.error(`Dữ liệu không đúng định dạng`);
//         } else {
//           message.success("Tải lên File thành công");
//           setExcelData(rows);
//         }
//       };
//       reader.readAsArrayBuffer(file);
//       setFile(file);
//       setErrorFile(false);
//       return false; // ❗ ngăn không upload file
//     },
//   };

//   const onCheckFile = useCallback(async () => {
//     try {
//       showLoading();
//       if (file) {
//         const data = excelData.map((item: any, index: number) => ({
//           ...item,
//         }));
//         const transformedData = transformProducts(data);

//         const productRef = collection(db, "Products");

//         let successCount = 0;

//         for (const product of transformedData) {
//           await setDoc(doc(productRef, product?.id), product);
//           successCount++;
//         }

//         toast.success(`Upload thành công ${successCount} sản phẩm`);
//       }
//     } catch (error) {
//     } finally {
//       hideLoading();
//       setOpenModal(false);
//     }
//   }, [excelData, file]);

//   return (
//     <div className="block-content">
//       <Card title="Danh sách sản phẩm">
//         <Form
//           form={form}
//           name="validateOnly"
//           layout="vertical"
//           autoComplete="off"
//           onFinish={() => {}}
//         >
//           <Row gutter={24}>
//             <Col span={6}>
//               <Form.Item name={"keyword"} label="Tìm kiếm">
//                 <Input
//                   className="h-40"
//                   placeholder="Tìm kiếm theo ID, tên sản phẩm"
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={6}>
//               <Form.Item label="Danh mục" name={"category"}>
//                 <Select
//                   size="large"
//                   showSearch
//                   allowClear
//                   optionFilterProp="label"
//                   options={[]}
//                   notFoundContent={null}
//                   placeholder="Chọn danh mục"
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={6}>
//               <Form.Item label="Trạng thái" name={"status"}>
//                 <Select
//                   size="large"
//                   showSearch
//                   allowClear
//                   optionFilterProp="label"
//                   options={[
//                     { value: "AVAILABLE", label: "Còn hàng" },
//                     { value: "SOLDOUT", label: "Hết hàng" },
//                     {
//                       value: "INACTIVE",
//                       label: "Không khả dụng",
//                     },
//                   ]}
//                   notFoundContent={null}
//                   placeholder="Trạng thái"
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={6}>
//               <Form.Item
//                 name={"createdAt"}
//                 label={"Ngày tạo"}
//                 rules={[
//                   ({ getFieldValue }) => ({
//                     validator(_, value) {
//                       if (value && dayjs(value).isAfter(dayjs())) {
//                         return Promise.reject(
//                           new Error("Vui lòng chọn lại ngày tạo!"),
//                         );
//                       }
//                       return Promise.resolve();
//                     },
//                   }),
//                 ]}
//               >
//                 <MyDatePicker
//                   placeholder="Từ ngày"
//                   className="h-40 w-full"
//                   format={"DD/MM/YYYY"}
//                 />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row>
//             <Form.Item>
//               <Button
//                 onClick={() => onSearch()}
//                 type="primary"
//                 className="h-40"
//               >
//                 Tìm kiếm
//               </Button>
//             </Form.Item>
//             <Form.Item className="ml-16">
//               <Button
//                 onClick={() => {
//                   form.resetFields();
//                   setIsSearching(false);
//                 }}
//                 icon={<ReloadOutlined />}
//                 className="h-40"
//                 type="default"
//               >
//                 Reset
//               </Button>
//             </Form.Item>
//             <Form.Item className="ml-16">
//               <Button
//                 onClick={() => setOpenModal(true)}
//                 icon={<ExportOutlined />}
//                 className="h-40"
//                 type="primary"
//               >
//                 Tải danh sách sản phẩm
//               </Button>
//             </Form.Item>
//             <Form.Item className="ml-16">
//               <Button
//                 onClick={() => {}}
//                 icon={<DownloadOutlined />}
//                 className="h-40"
//                 type="default"
//               >
//                 Tải FILE mẫu
//               </Button>
//             </Form.Item>
//           </Row>
//         </Form>
//         <Table
//           rowKey={"id"}
//           bordered
//           dataSource={isSearching ? searchData : products}
//           columns={columns}
//           scroll={{ y: 500, x: 150 * columns?.length }}
//           pagination={{
//             pageSize: 10,
//             showSizeChanger: true,
//             pageSizeOptions: ["10", "20", "50"],
//             showTotal: (total) => `Tổng ${total} sản phẩm`,
//           }}
//         />
//         <Modal
//           open={openModal}
//           title="Thêm mới sản phẩm"
//           onCancel={() => setOpenModal(false)}
//           width={1000}
//           footer={null}
//         >
//           <Dragger
//             {...propsUpload}
//             fileList={file ? [file] : []}
//             onRemove={() => setFile(null)}
//           >
//             <p className="ant-upload-drag-icon">
//               <InboxOutlined />
//             </p>
//             <p className="ant-upload-text">
//               Nhấn hoặc thả file vào đây để tải lên
//             </p>
//             <p className="ant-upload-hint">
//               Hỗ trợ tải lên từng file, dung lượng không vượt quá 2MB và 10,000
//               số tài khoản.
//             </p>
//           </Dragger>
//           {errorFile ? (
//             <div className="text-error-500">Vui lòng chọn một tệp.</div>
//           ) : null}

//           <Row justify="end" className="mt-16">
//             <Button
//               type="primary"
//               disabled={!file || errorFile}
//               className="h-40"
//               onClick={onCheckFile}
//             >
//               Tải lên
//             </Button>
//             <Button
//               onClick={() => {
//                 setFile(null);
//                 setErrorFile("");
//                 setOpenModal(false);
//               }}
//               type="default"
//               className="ml-16 h-40"
//             >
//               Huỷ
//             </Button>
//           </Row>
//         </Modal>
//       </Card>
//     </div>
//   );
// };

// const ManageProduct = memo(Component);

// export { ManageProduct };

import MyDatePicker from "@/components/basic/date-picker";
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Upload,
  UploadFile,
  UploadProps,
} from "antd";
import Dragger from "antd/es/upload/Dragger";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import saveAs from "file-saver";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditFilled,
  ExportOutlined,
  EyeOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { hideLoading, showLoading } from "../loading";
import { toast } from "react-toastify";
import { transformProducts } from "@/utils/common";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, storage } from "@/App";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type ProductStatus = "AVAILABLE" | "SOLDOUT" | "INACTIVE";

type ProductVariant = {
  attributes?: Record<string, string>;
  prices?: {
    btc?: number;
    btb?: number;
    ctv?: number;
  };
  stock?: number;
};

type ProductRecord = {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  description?: string;
  images?: string[];
  attributes?: {
    feature?: string;
    material?: string;
    shape?: string;
    preservationType?: string;
    style?: string;
  };
  guarantee?: string;
  origin?: string;
  quality?: string;
  status?: ProductStatus;
  variants?: ProductVariant[];
  createAt?: string;
  updatedAt?: string;
};

type CategoryOption = {
  value: string;
  label: string;
};

type VariantGroupFormValue = {
  name?: string;
  options?: string[];
};

type VariantRow = {
  key: string;
  label: string;
  attributes: Record<string, string>;
  stock: number;
  priceBtc: number;
  priceBtb: number;
  priceCtv: number;
};

const MAX_IMAGES = 5;
const MAX_VARIANT_GROUPS = 3;

const PRODUCT_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Còn hàng" },
  { value: "SOLDOUT", label: "Hết hàng" },
  { value: "INACTIVE", label: "Không khả dụng" },
];

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = (error) => reject(error);
  });

const safeJsonParse = (value: any) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeCategoryOptions = (rawData: any[]): CategoryOption[] => {
  const options: CategoryOption[] = [];

  rawData.forEach((item) => {
    const parentId = safeJsonParse(item?.data);
    const children = safeJsonParse(item?.categories);

    if (typeof parentId === "string" && item?.name) {
      options.push({
        value: parentId,
        label: item.name,
      });
    }

    if (Array.isArray(children)) {
      children.forEach((child: any) => {
        if (typeof child === "string" && item?.name) {
          options.push({
            value: child,
            label: `${item.name} / ${child}`,
          });
        } else if (child?.id && child?.name) {
          options.push({
            value: child.id,
            label: `${item.name} / ${child.name}`,
          });
        }
      });
    } else {
      options.push({
        value: item?.id,
        label: item.name,
      });
    }
  });

  return options;
};

const getProductTotalStock = (record: ProductRecord) =>
  Array.isArray(record?.variants)
    ? record.variants.reduce((sum, item) => sum + Number(item?.stock || 0), 0)
    : 0;

const buildVariantGroupsFromProduct = (
  product?: ProductRecord | null,
): VariantGroupFormValue[] => {
  const variants = Array.isArray(product?.variants) ? product?.variants : [];
  if (!variants.length) return [];

  const orderedKeys: string[] = [];

  variants.forEach((variant) => {
    Object.keys(variant?.attributes || {}).forEach((key) => {
      if (key && !orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    });
  });

  return orderedKeys.slice(0, MAX_VARIANT_GROUPS).map((key) => {
    const values = Array.from(
      new Set(
        variants
          .map((variant) => variant?.attributes?.[key])
          .filter((item): item is string => Boolean(item)),
      ),
    );

    return {
      name: key,
      options: values,
    };
  });
};

const buildVariantValueMap = (variants?: ProductVariant[]) => {
  const map = new Map<string, ProductVariant>();

  (variants || []).forEach((variant) => {
    const attrs = variant?.attributes || {};
    const normalizedKey = Object.entries(attrs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");

    map.set(normalizedKey, variant);
  });

  return map;
};

const getCartesianProduct = (groups: VariantGroupFormValue[]) => {
  const normalizedGroups = groups
    .filter((group) => String(group?.name || "").trim())
    .map((group) => ({
      name: String(group?.name || "").trim(),
      options: (group?.options || [])
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    }))
    .filter((group) => group.options.length > 0);

  if (!normalizedGroups.length) return [];

  const result: Array<Record<string, string>> = [];

  const dfs = (index: number, current: Record<string, string>) => {
    if (index === normalizedGroups.length) {
      result.push({ ...current });
      return;
    }

    const group = normalizedGroups[index];

    group.options.forEach((option) => {
      current[group.name] = option;
      dfs(index + 1, current);
    });
  };

  dfs(0, {});
  return result;
};

const buildSkuRowsFromGroups = (
  groups: VariantGroupFormValue[],
  existingVariants?: ProductVariant[],
): VariantRow[] => {
  const combinations = getCartesianProduct(groups);
  const existingMap = buildVariantValueMap(existingVariants);

  return combinations.map((attributes) => {
    const normalizedKey = Object.entries(attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");

    const matched = existingMap.get(normalizedKey);

    return {
      key: normalizedKey,
      label: Object.values(attributes).join(" / "),
      attributes,
      stock: Number(matched?.stock || 0),
      priceBtc: Number(matched?.prices?.btc || 0),
      priceBtb: Number(matched?.prices?.btb || 0),
      priceCtv: Number(matched?.prices?.ctv || 0),
    };
  });
};

const buildDefaultSingleVariantRow = (
  product?: ProductRecord | null,
): VariantRow[] => {
  const firstVariant = product?.variants?.[0];

  return [
    {
      key: "default",
      label: "Mặc định",
      attributes: {},
      stock: Number(firstVariant?.stock || 0),
      priceBtc: Number(firstVariant?.prices?.btc || 0),
      priceBtb: Number(firstVariant?.prices?.btb || 0),
      priceCtv: Number(firstVariant?.prices?.ctv || 0),
    },
  ];
};

const Component = () => {
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();

  const [file, setFile] = useState<File | null>(null);
  const [errorFile, setErrorFile] = useState(false);

  const [openExcelModal, setOpenExcelModal] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<
    "create" | "edit" | "view"
  >("create");

  const [excelData, setExcelData] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(
    null,
  );

  const [searchData, setSearchData] = useState<ProductRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [bulkValues, setBulkValues] = useState<{
    stock?: number;
    priceBtc?: number;
    priceBtb?: number;
    priceCtv?: number;
  }>({});

  const watchedEnableVariants = Form.useWatch("enableVariants", productForm);
  const watchedVariantGroups = Form.useWatch("variantGroups", productForm);

  const isViewMode = productModalMode === "view";

  const fetchProducts = async () => {
    try {
      showLoading();

      const querySnapshot = await getDocs(collection(db, "Products"));

      const data = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as ProductRecord[];

      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("Lấy dữ liệu sản phẩm thất bại");
    } finally {
      hideLoading();
    }
  };

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Category"));

      const rawData = querySnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setCategories(normalizeCategoryOptions(rawData));
    } catch (error) {
      console.error(error);
      toast.error("Lấy danh mục thất bại");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!productModalOpen) return;

    if (watchedEnableVariants) {
      const nextRows = buildSkuRowsFromGroups(
        watchedVariantGroups || [],
        editingProduct?.variants || [],
      );

      setVariantRows(nextRows);
    } else {
      setVariantRows(buildDefaultSingleVariantRow(editingProduct));
    }
  }, [
    watchedEnableVariants,
    watchedVariantGroups,
    editingProduct,
    productModalOpen,
  ]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();

    categories.forEach((item) => {
      map.set(item.value, item.label);
    });

    return map;
  }, [categories]);

  const onSearch = useCallback(() => {
    const values = form.getFieldsValue();

    setIsSearching(true);

    let filteredData = [...products];

    if (values.keyword) {
      const keyword = String(values.keyword || "")
        .toLowerCase()
        .trim();

      filteredData = filteredData.filter(
        (item) =>
          item.name?.toLowerCase().includes(keyword) ||
          item.id?.toLowerCase().includes(keyword),
      );
    }

    if (values.category) {
      filteredData = filteredData.filter(
        (item) => item.category === values.category,
      );
    }

    if (values.status) {
      filteredData = filteredData.filter(
        (item) => item.status === values.status,
      );
    }

    if (values.createdAt) {
      filteredData = filteredData.filter((item) =>
        dayjs(item.createAt).isSame(values.createdAt, "day"),
      );
    }

    setSearchData(filteredData);
  }, [form, products]);

  const exportToExcel = (
    data: any,
    fileName = "production.xlsx",
    isExport: boolean,
  ) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

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
      return new File([dataBlob], `${fileName}.xlsx`, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }
  };

  const downloadTemplate = useCallback(() => {
    const templateData = [
      {
        id: "product_001",
        name: "Tên sản phẩm mẫu",
        category: "cate_bontam_kcg_massage",
        description: "Mô tả sản phẩm",
        quality: "Chính Hãng",
        origin: "Châu Âu",
        guarantee: "T",
        amount: 10,
        status: "AVAILABLE",
        createAt: dayjs().format("DD/MM/YYYY HH:mm:ss"),
        price_ctv: 1000000,
        price_btc: 1200000,
        price_btb: 900000,
      },
    ];

    exportToExcel(templateData, "product_template", true);
  }, []);

  const resetProductModal = useCallback(() => {
    setProductModalOpen(false);
    setEditingProduct(null);
    setProductModalMode("create");
    setImageFileList([]);
    setVariantRows([]);
    setBulkValues({});
    productForm.resetFields();
  }, [productForm]);

  const openCreateProductModal = useCallback(() => {
    setProductModalMode("create");
    setEditingProduct(null);
    setImageFileList([]);
    setBulkValues({});
    setVariantRows(buildDefaultSingleVariantRow(null));

    productForm.resetFields();
    productForm.setFieldsValue({
      status: "AVAILABLE",
      enableVariants: false,
      variantGroups: [],
      stockSingle: 0,
      priceBtcSingle: 0,
      priceBtbSingle: 0,
      priceCtvSingle: 0,
    });

    setProductModalOpen(true);
  }, [productForm]);

  const openEditProductModal = useCallback(
    (record: ProductRecord, mode: "edit" | "view") => {
      const groups = buildVariantGroupsFromProduct(record);
      const enableVariants = groups.length > 0;

      setProductModalMode(mode);
      setEditingProduct(record);
      setBulkValues({});

      setImageFileList(
        (record?.images || []).map((url, index) => ({
          uid: `${record.id}-${index}`,
          name: `image-${index + 1}.png`,
          status: "done",
          url,
        })),
      );

      productForm.resetFields();
      productForm.setFieldsValue({
        name: record?.name || "",
        category: record?.category || undefined,
        brand: record?.brand || "",
        feature: record?.attributes?.feature || "",
        material: record?.attributes?.material || "",
        shape: record?.attributes?.shape || "",
        preservationType: record?.attributes?.preservationType || "",
        style: record?.attributes?.style || "",
        description: record?.description || "",
        quality: record?.quality || "",
        origin: record?.origin || "",
        guarantee: record?.guarantee || "",
        status: record?.status || "AVAILABLE",
        enableVariants,
        variantGroups: groups,
        stockSingle: Number(record?.variants?.[0]?.stock || 0),
        priceBtcSingle: Number(record?.variants?.[0]?.prices?.btc || 0),
        priceBtbSingle: Number(record?.variants?.[0]?.prices?.btb || 0),
        priceCtvSingle: Number(record?.variants?.[0]?.prices?.ctv || 0),
      });

      setVariantRows(
        enableVariants
          ? buildSkuRowsFromGroups(groups, record?.variants || [])
          : buildDefaultSingleVariantRow(record),
      );

      setProductModalOpen(true);
    },
    [productForm],
  );

  const updateVariantRow = useCallback(
    (
      rowKey: string,
      field: keyof Pick<
        VariantRow,
        "stock" | "priceBtc" | "priceBtb" | "priceCtv"
      >,
      value?: number | null,
    ) => {
      setVariantRows((prev) =>
        prev.map((item) =>
          item.key === rowKey
            ? {
                ...item,
                [field]: Number(value || 0),
              }
            : item,
        ),
      );
    },
    [],
  );

  const applyBulkToVariants = useCallback(() => {
    if (!variantRows.length) {
      toast.warning("Chưa có biến thể để áp dụng");
      return;
    }

    setVariantRows((prev) =>
      prev.map((item) => ({
        ...item,
        stock:
          bulkValues.stock !== undefined && bulkValues.stock !== null
            ? Number(bulkValues.stock)
            : item.stock,
        priceBtc:
          bulkValues.priceBtc !== undefined && bulkValues.priceBtc !== null
            ? Number(bulkValues.priceBtc)
            : item.priceBtc,
        priceBtb:
          bulkValues.priceBtb !== undefined && bulkValues.priceBtb !== null
            ? Number(bulkValues.priceBtb)
            : item.priceBtb,
        priceCtv:
          bulkValues.priceCtv !== undefined && bulkValues.priceCtv !== null
            ? Number(bulkValues.priceCtv)
            : item.priceCtv,
      })),
    );

    toast.success("Đã áp dụng cho tất cả biến thể");
  }, [bulkValues, variantRows.length]);

  const buildProductPayload = useCallback(
    async (values: any) => {
      const productId = editingProduct?.id || `product_${Date.now()}`;

      const oldUrls = imageFileList
        .filter((item) => item.url)
        .map((item) => String(item.url));

      const newFiles = imageFileList
        .filter((item) => item.originFileObj)
        .map((item) => item.originFileObj as File);

      const newUploadedUrls = await Promise.all(
        newFiles.map((item) => uploadImageToFirebase(item, productId)),
      );

      const images = [...oldUrls, ...newUploadedUrls].slice(0, MAX_IMAGES);

      const variants: ProductVariant[] = values.enableVariants
        ? variantRows.map((item) => ({
            attributes: item.attributes,
            stock: Number(item.stock || 0),
            prices: {
              btc: Number(item.priceBtc || 0),
              btb: Number(item.priceBtb || 0),
              ctv: Number(item.priceCtv || 0),
            },
          }))
        : [
            {
              attributes: {},
              stock: Number(values.stockSingle || 0),
              prices: {
                btc: Number(values.priceBtcSingle || 0),
                btb: Number(values.priceBtbSingle || 0),
                ctv: Number(values.priceCtvSingle || 0),
              },
            },
          ];

      return {
        id: productId,
        name: String(values.name || "").trim(),
        category: values.category,
        brand: String(values.brand || "").trim(),
        description: String(values.description || "").trim(),
        quality: String(values.quality || "").trim(),
        origin: String(values.origin || "").trim(),
        guarantee: String(values.guarantee || "").trim(),
        status: values.status || "AVAILABLE",
        images,
        attributes: {
          feature: String(values.feature || "").trim(),
          material: String(values.material || "").trim(),
          shape: String(values.shape || "").trim(),
          preservationType: String(values.preservationType || "").trim(),
          style: String(values.style || "").trim(),
        },
        variants,
        createAt:
          editingProduct?.createAt || dayjs().format("DD/MM/YYYY HH:mm:ss"),
        updatedAt: dayjs().format("DD/MM/YYYY HH:mm:ss"),
        updatedServerAt: serverTimestamp(),
      };
    },
    [editingProduct, imageFileList, variantRows],
  );

  const handleSubmitProduct = useCallback(async () => {
    try {
      const values = await productForm.validateFields();

      if (!imageFileList.length) {
        toast.warning("Vui lòng chọn ít nhất 1 ảnh sản phẩm");
        return;
      }

      if (values.enableVariants) {
        const groups = (values.variantGroups || []).filter(
          (item: VariantGroupFormValue) =>
            String(item?.name || "").trim() &&
            Array.isArray(item?.options) &&
            item.options.length > 0,
        );

        if (!groups.length) {
          toast.warning("Vui lòng nhập ít nhất 1 nhóm biến thể");
          return;
        }

        if (!variantRows.length) {
          toast.warning("Danh sách biến thể đang trống");
          return;
        }

        const hasInvalidVariantRow = variantRows.some(
          (item) =>
            Number(item.stock) < 0 ||
            Number(item.priceBtc) <= 0 ||
            Number(item.priceBtb) <= 0 ||
            Number(item.priceCtv) <= 0,
        );

        if (hasInvalidVariantRow) {
          toast.warning("Vui lòng kiểm tra tồn kho và giá của từng biến thể");
          return;
        }
      }

      showLoading();

      const payload = await buildProductPayload(values);

      await setDoc(doc(collection(db, "Products"), payload.id), payload, {
        merge: true,
      });

      toast.success(
        productModalMode === "create"
          ? "Thêm mới sản phẩm thành công"
          : "Cập nhật sản phẩm thành công",
      );

      resetProductModal();
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error(
        productModalMode === "create"
          ? "Thêm mới sản phẩm thất bại"
          : "Cập nhật sản phẩm thất bại",
      );
    } finally {
      hideLoading();
    }
  }, [
    buildProductPayload,
    fetchProducts,
    imageFileList.length,
    productForm,
    productModalMode,
    resetProductModal,
    variantRows,
  ]);

  const columns = [
    {
      title: "Ảnh",
      render: (_: any, record: ProductRecord) => (
        <img
          src={record.images?.[0]}
          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
        />
      ),
      width: 80,
    },
    {
      title: "ID",
      dataIndex: "id",
      width: 180,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      width: 280,
    },
    {
      title: "Danh mục",
      render: (_: any, record: ProductRecord) =>
        categoryMap.get(String(record.category || "")) ||
        record.category ||
        "--",
      width: 220,
    },
    {
      title: "Giá CTV",
      render: (_: any, record: ProductRecord) => {
        const price = record.variants?.[0]?.prices?.ctv || 0;
        return formatCurrency(price);
      },
      width: 140,
    },
    {
      title: "Giá BTC",
      render: (_: any, record: ProductRecord) => {
        const price = record.variants?.[0]?.prices?.btc || 0;
        return formatCurrency(price);
      },
      width: 140,
    },
    {
      title: "Giá BTB",
      render: (_: any, record: ProductRecord) => {
        const price = record.variants?.[0]?.prices?.btb || 0;
        return formatCurrency(price);
      },
      width: 140,
    },
    {
      title: "Tồn kho",
      render: (_: any, record: ProductRecord) => getProductTotalStock(record),
      width: 100,
    },
    {
      title: "Variants",
      render: (_: any, record: ProductRecord) => record.variants?.length || 1,
      width: 90,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (value: string) => {
        if (value === "AVAILABLE") return <Tag color="green">Còn hàng</Tag>;
        if (value === "SOLDOUT") return <Tag color="red">Hết hàng</Tag>;
        return <Tag color="orange">Không khả dụng</Tag>;
      },
      width: 140,
    },
    {
      title: "Thao tác",
      fixed: "right" as const,
      width: 110,
      render: (_: any, record: ProductRecord) => {
        return (
          <div className="flex flex-row items-center">
            <Button
              type="text"
              icon={<EyeOutlined className="text-link-500" />}
              onClick={() => openEditProductModal(record, "view")}
            />
            <Button
              type="text"
              className="ml-8"
              icon={<EditFilled className="text-link-500" />}
              onClick={() => openEditProductModal(record, "edit")}
            />
          </div>
        );
      },
    },
  ];

  const propsUpload: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx",
    beforeUpload: (nextFile) => {
      const isExcel =
        nextFile.type === "application/vnd.ms-excel" ||
        nextFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      if (!isExcel) {
        message.error("Chỉ chấp nhận file Excel");
        return Upload.LIST_IGNORE;
      }

      const reader = new FileReader();

      reader.onload = async (e) => {
        const REQUIRED_COLUMNS = [
          "id",
          "name",
          "category",
          "description",
          "quality",
          "origin",
          "guarantee",
          "amount",
          "status",
          "createAt",
          "price_ctv",
          "price_btc",
          "price_btb",
        ];

        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        const headers: string[] = (json[0] || []) as string[];

        const missing = REQUIRED_COLUMNS.filter(
          (col) =>
            !headers.some(
              (header: string) =>
                String(header || "")
                  .trim()
                  .toLowerCase() === col.toLowerCase(),
            ),
        );

        if (missing.length > 0) {
          setErrorFile(true);
          message.error("Dữ liệu không đúng định dạng");
        } else {
          message.success("Tải lên file thành công");
          setExcelData(rows);
        }
      };

      reader.readAsArrayBuffer(nextFile as File);
      setFile(nextFile as File);
      setErrorFile(false);

      return false;
    },
  };

  const onCheckFile = useCallback(async () => {
    try {
      showLoading();

      if (file) {
        const data = excelData.map((item: any) => ({ ...item }));
        const transformedData = transformProducts(data);
        const productRef = collection(db, "Products");

        let successCount = 0;

        for (const product of transformedData) {
          await setDoc(doc(productRef, product?.id), product, { merge: true });
          successCount++;
        }

        toast.success(`Upload thành công ${successCount} sản phẩm`);
        fetchProducts();
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload file sản phẩm thất bại");
    } finally {
      hideLoading();
      setOpenExcelModal(false);
      setFile(null);
      setExcelData([]);
      setErrorFile(false);
    }
  }, [excelData, file]);

  const uploadImageToFirebase = async (file: File, productId: string) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      throw new Error("File không phải ảnh");
    }

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `products/${productId}/${dayjs().valueOf()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const uploadImageProps: UploadProps = {
    listType: "picture-card",
    multiple: true,
    fileList: imageFileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");

      if (!isImage) {
        toast.error("Chỉ chấp nhận file ảnh");
        return Upload.LIST_IGNORE;
      }

      return false;
    },
    onChange: ({ fileList }) => {
      if (fileList.length > MAX_IMAGES) {
        toast.warning(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh`);
      }

      setImageFileList(fileList.slice(0, MAX_IMAGES));
    },
    onPreview: async (file) => {
      const src =
        file.url ||
        (file.originFileObj
          ? await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file.originFileObj as File);
              reader.onload = () => resolve(String(reader.result || ""));
              reader.onerror = (error) => reject(error);
            })
          : "");

      const image = new window.Image();
      image.src = src;

      const imgWindow = window.open(src);
      imgWindow?.document.write(image.outerHTML);
    },
  };

  const skuColumns = [
    {
      title: "Tên biến thể",
      dataIndex: "label",
      width: 220,
      render: (value: string) => <span>{value || "Mặc định"}</span>,
    },
    {
      title: (
        <span>
          <span className="text-red-500">*</span> Hàng có sẵn
        </span>
      ),
      dataIndex: "stock",
      width: 140,
      render: (value: number, record: VariantRow) => (
        <InputNumber
          min={0}
          precision={0}
          className="w-full"
          disabled={isViewMode}
          value={value}
          onChange={(nextValue) =>
            updateVariantRow(record.key, "stock", nextValue)
          }
        />
      ),
    },
    {
      title: (
        <span>
          <span className="text-red-500">*</span> Giá bán lẻ
        </span>
      ),
      dataIndex: "priceBtc",
      width: 160,
      render: (value: number, record: VariantRow) => (
        <InputNumber
          min={0}
          className="w-full"
          disabled={isViewMode}
          value={value}
          formatter={(val) =>
            `${Number(val || 0).toLocaleString("vi-VN")}`.replace(/NaN/g, "")
          }
          parser={(val) => Number(String(val || "").replace(/[^\d]/g, ""))}
          onChange={(nextValue) =>
            updateVariantRow(record.key, "priceBtc", nextValue)
          }
        />
      ),
    },
    {
      title: (
        <span>
          <span className="text-red-500">*</span> Giá bán buôn
        </span>
      ),
      dataIndex: "priceBtb",
      width: 160,
      render: (value: number, record: VariantRow) => (
        <InputNumber
          min={0}
          className="w-full"
          disabled={isViewMode}
          value={value}
          formatter={(val) =>
            `${Number(val || 0).toLocaleString("vi-VN")}`.replace(/NaN/g, "")
          }
          parser={(val) => Number(String(val || "").replace(/[^\d]/g, ""))}
          onChange={(nextValue) =>
            updateVariantRow(record.key, "priceBtb", nextValue)
          }
        />
      ),
    },
    {
      title: (
        <span>
          <span className="text-red-500">*</span> Giá CTV
        </span>
      ),
      dataIndex: "priceCtv",
      width: 160,
      render: (value: number, record: VariantRow) => (
        <InputNumber
          min={0}
          className="w-full"
          disabled={isViewMode}
          value={value}
          formatter={(val) =>
            `${Number(val || 0).toLocaleString("vi-VN")}`.replace(/NaN/g, "")
          }
          parser={(val) => Number(String(val || "").replace(/[^\d]/g, ""))}
          onChange={(nextValue) =>
            updateVariantRow(record.key, "priceCtv", nextValue)
          }
        />
      ),
    },
  ];

  return (
    <div className="block-content">
      <Card title="Danh sách sản phẩm">
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          onFinish={() => undefined}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item name="keyword" label="Tìm kiếm">
                <Input
                  className="h-40"
                  placeholder="Tìm kiếm theo ID, tên sản phẩm"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item label="Danh mục" name="category">
                <Select
                  size="large"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={categories}
                  placeholder="Chọn danh mục"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item label="Trạng thái" name="status">
                <Select
                  size="large"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={PRODUCT_STATUS_OPTIONS}
                  placeholder="Trạng thái"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="createdAt"
                label="Ngày tạo"
                rules={[
                  () => ({
                    validator(_, value) {
                      if (value && dayjs(value).isAfter(dayjs(), "day")) {
                        return Promise.reject(
                          new Error("Vui lòng chọn lại ngày tạo"),
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <MyDatePicker
                  placeholder="Chọn ngày tạo"
                  className="h-40 w-full"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Form.Item>
              <Button onClick={onSearch} type="primary" className="h-40">
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
                onClick={openCreateProductModal}
                icon={<PlusOutlined />}
                className="h-40"
                type="primary"
              >
                Thêm mới sản phẩm
              </Button>
            </Form.Item>

            <Form.Item className="ml-16">
              <Button
                onClick={() => setOpenExcelModal(true)}
                icon={<ExportOutlined />}
                className="h-40"
                type="default"
              >
                Tải danh sách sản phẩm
              </Button>
            </Form.Item>

            <Form.Item className="ml-16">
              <Button
                onClick={downloadTemplate}
                icon={<DownloadOutlined />}
                className="h-40"
                type="default"
              >
                Tải file mẫu
              </Button>
            </Form.Item>
          </Row>
        </Form>

        <Table
          rowKey="id"
          bordered
          dataSource={isSearching ? searchData : products}
          columns={columns}
          scroll={{ y: 500, x: 1800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Tổng ${total} sản phẩm`,
          }}
        />

        <Modal
          open={openExcelModal}
          title="Tải danh sách sản phẩm từ Excel"
          onCancel={() => {
            setOpenExcelModal(false);
            setFile(null);
            setExcelData([]);
            setErrorFile(false);
          }}
          width={1000}
          footer={null}
        >
          <Dragger
            {...propsUpload}
            fileList={file ? [file as any] : []}
            onRemove={() => {
              setFile(null);
              setExcelData([]);
              setErrorFile(false);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Nhấn hoặc thả file vào đây để tải lên
            </p>
            <p className="ant-upload-hint">
              Hỗ trợ tải lên từng file Excel theo đúng mẫu dữ liệu.
            </p>
          </Dragger>

          {errorFile ? (
            <div className="mt-8 text-error-500">
              Vui lòng chọn đúng file mẫu.
            </div>
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
                setExcelData([]);
                setErrorFile(false);
                setOpenExcelModal(false);
              }}
              type="default"
              className="ml-16 h-40"
            >
              Huỷ
            </Button>
          </Row>
        </Modal>

        <Modal
          open={productModalOpen}
          title={
            productModalMode === "create"
              ? "Thêm mới sản phẩm"
              : productModalMode === "edit"
                ? "Chỉnh sửa sản phẩm"
                : "Chi tiết sản phẩm"
          }
          onCancel={resetProductModal}
          width={1280}
          footer={null}
          destroyOnClose
        >
          <Form form={productForm} layout="vertical" autoComplete="off">
            <Card title="Thông tin cơ bản">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Hình ảnh sản phẩm"
                    required
                    extra={`Tối đa ${MAX_IMAGES} ảnh`}
                  >
                    <Upload {...uploadImageProps} disabled={isViewMode}>
                      {imageFileList.length >= MAX_IMAGES ||
                      isViewMode ? null : (
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Tải ảnh</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Tên sản phẩm"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên sản phẩm" },
                      { min: 3, message: "Tên sản phẩm tối thiểu 3 ký tự" },
                      { max: 255, message: "Tên sản phẩm tối đa 255 ký tự" },
                      {
                        validator: (_, value) => {
                          if (!value || String(value).trim()) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Tên sản phẩm không hợp lệ"),
                          );
                        },
                      },
                    ]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập tên sản phẩm"
                      disabled={isViewMode}
                      maxLength={255}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="Danh mục"
                    rules={[
                      { required: true, message: "Vui lòng chọn danh mục" },
                    ]}
                  >
                    <Select
                      size="large"
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      options={categories}
                      placeholder="Chọn danh mục"
                      disabled={isViewMode}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="brand"
                    label="Thương hiệu"
                    rules={[
                      { max: 120, message: "Thương hiệu tối đa 120 ký tự" },
                    ]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập thương hiệu"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[
                      { required: true, message: "Vui lòng chọn trạng thái" },
                    ]}
                  >
                    <Select
                      size="large"
                      options={PRODUCT_STATUS_OPTIONS}
                      disabled={isViewMode}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="feature"
                    label="Đặc điểm"
                    rules={[{ max: 120, message: "Đặc điểm tối đa 120 ký tự" }]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập đặc điểm"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="material"
                    label="Vật liệu"
                    rules={[{ max: 120, message: "Vật liệu tối đa 120 ký tự" }]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập vật liệu"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="shape"
                    label="Hình dạng"
                    rules={[
                      { max: 120, message: "Hình dạng tối đa 120 ký tự" },
                    ]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập hình dạng"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="preservationType"
                    label="Loại bảo quản"
                    rules={[
                      { max: 120, message: "Loại bảo quản tối đa 120 ký tự" },
                    ]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập loại bảo quản"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="style"
                    label="Phong cách"
                    rules={[
                      { max: 120, message: "Phong cách tối đa 120 ký tự" },
                    ]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập phong cách"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="quality"
                    label="Chất lượng"
                    rules={[
                      { max: 120, message: "Chất lượng tối đa 120 ký tự" },
                    ]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập chất lượng"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="origin"
                    label="Xuất xứ"
                    rules={[{ max: 120, message: "Xuất xứ tối đa 120 ký tự" }]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập xuất xứ"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="guarantee"
                    label="Bảo hành"
                    rules={[{ max: 120, message: "Bảo hành tối đa 120 ký tự" }]}
                  >
                    <Input
                      className="h-40"
                      placeholder="Nhập bảo hành"
                      disabled={isViewMode}
                      maxLength={120}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Chi tiết sản phẩm" className="mt-16">
              <Form.Item
                name="description"
                label="Mô tả sản phẩm"
                rules={[{ max: 5000, message: "Mô tả tối đa 5000 ký tự" }]}
              >
                <Input.TextArea
                  rows={5}
                  placeholder="Nhập mô tả sản phẩm"
                  disabled={isViewMode}
                  maxLength={5000}
                />
              </Form.Item>
            </Card>

            <Card title="Thông tin bán hàng" className="mt-16">
              <div className="mb-16">
                <Space align="center" size={12}>
                  <span className="text-16 font-semibold">Thêm biến thể</span>
                  <Form.Item
                    name="enableVariants"
                    valuePropName="checked"
                    noStyle
                  >
                    <Switch disabled={isViewMode} />
                  </Form.Item>
                </Space>
                <div className="mt-8 text-14 text-color-700">
                  Thêm tối đa 3 biến thể sản phẩm cho kích thước, màu sắc, chất
                  liệu, v.v. khác nhau.
                </div>
              </div>

              {watchedEnableVariants ? (
                <>
                  <Form.List name="variantGroups">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map((field) => (
                          <Card
                            key={field.key}
                            className="mb-16"
                            styles={{ body: { paddingBottom: 12 } }}
                            title="Biến thể"
                            extra={
                              !isViewMode ? (
                                <Button
                                  type="text"
                                  icon={<DeleteOutlined />}
                                  danger
                                  onClick={() => remove(field.name)}
                                />
                              ) : null
                            }
                          >
                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item
                                  name={[field.name, "name"]}
                                  label="Tên biến thể"
                                  rules={[
                                    {
                                      required: true,
                                      message: "Vui lòng nhập tên biến thể",
                                    },
                                    {
                                      max: 50,
                                      message: "Tên biến thể tối đa 50 ký tự",
                                    },
                                  ]}
                                >
                                  <Input
                                    className="h-40"
                                    placeholder="Ví dụ: Kích thước, Màu sắc, Chất liệu"
                                    disabled={isViewMode}
                                    maxLength={50}
                                  />
                                </Form.Item>
                              </Col>

                              <Col span={12}>
                                <Form.Item
                                  name={[field.name, "options"]}
                                  label="Tùy chọn"
                                  rules={[
                                    {
                                      validator: (_, value: string[]) => {
                                        if (!value || !value.length) {
                                          return Promise.reject(
                                            new Error(
                                              "Vui lòng nhập ít nhất 1 tùy chọn",
                                            ),
                                          );
                                        }

                                        const invalid = value.some(
                                          (item) => !String(item || "").trim(),
                                        );

                                        if (invalid) {
                                          return Promise.reject(
                                            new Error("Tùy chọn không hợp lệ"),
                                          );
                                        }

                                        if (value.length > 20) {
                                          return Promise.reject(
                                            new Error(
                                              "Tối đa 20 tùy chọn cho mỗi biến thể",
                                            ),
                                          );
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Select
                                    mode="tags"
                                    size="large"
                                    placeholder="Nhập từng tùy chọn rồi nhấn Enter"
                                    tokenSeparators={[","]}
                                    disabled={isViewMode}
                                    maxTagCount="responsive"
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Card>
                        ))}

                        {!isViewMode ? (
                          <Button
                            type="link"
                            icon={<PlusOutlined />}
                            className="!px-0"
                            onClick={() => {
                              if (fields.length >= MAX_VARIANT_GROUPS) {
                                toast.warning(
                                  `Chỉ được thêm tối đa ${MAX_VARIANT_GROUPS} biến thể`,
                                );
                                return;
                              }

                              add({
                                name: "",
                                options: [],
                              });
                            }}
                          >
                            Thêm biến thể
                          </Button>
                        ) : null}
                      </>
                    )}
                  </Form.List>

                  <div className="mt-24">
                    <div className="mb-12 text-18 font-semibold">
                      Danh sách biến thể
                    </div>

                    {!isViewMode ? (
                      <Row gutter={12} className="mb-16">
                        <Col span={4}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            placeholder="Số lượng"
                            value={bulkValues.stock}
                            onChange={(value) =>
                              setBulkValues((prev) => ({
                                ...prev,
                                stock: Number(value || 0),
                              }))
                            }
                          />
                        </Col>

                        <Col span={4}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            placeholder="Giá bán lẻ"
                            value={bulkValues.priceBtc}
                            formatter={(val) =>
                              `${Number(val || 0).toLocaleString("vi-VN")}`.replace(
                                /NaN/g,
                                "",
                              )
                            }
                            parser={(val) =>
                              Number(String(val || "").replace(/[^\d]/g, ""))
                            }
                            onChange={(value) =>
                              setBulkValues((prev) => ({
                                ...prev,
                                priceBtc: Number(value || 0),
                              }))
                            }
                          />
                        </Col>

                        <Col span={4}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            placeholder="Giá bán buôn"
                            value={bulkValues.priceBtb}
                            formatter={(val) =>
                              `${Number(val || 0).toLocaleString("vi-VN")}`.replace(
                                /NaN/g,
                                "",
                              )
                            }
                            parser={(val) =>
                              Number(String(val || "").replace(/[^\d]/g, ""))
                            }
                            onChange={(value) =>
                              setBulkValues((prev) => ({
                                ...prev,
                                priceBtb: Number(value || 0),
                              }))
                            }
                          />
                        </Col>

                        <Col span={4}>
                          <InputNumber
                            className="w-full"
                            min={0}
                            placeholder="Giá CTV"
                            value={bulkValues.priceCtv}
                            formatter={(val) =>
                              `${Number(val || 0).toLocaleString("vi-VN")}`.replace(
                                /NaN/g,
                                "",
                              )
                            }
                            parser={(val) =>
                              Number(String(val || "").replace(/[^\d]/g, ""))
                            }
                            onChange={(value) =>
                              setBulkValues((prev) => ({
                                ...prev,
                                priceCtv: Number(value || 0),
                              }))
                            }
                          />
                        </Col>

                        <Col span={4}>
                          <Button
                            className="h-40 w-full"
                            onClick={applyBulkToVariants}
                          >
                            Áp dụng tất cả
                          </Button>
                        </Col>
                      </Row>
                    ) : null}

                    <Table
                      rowKey="key"
                      bordered
                      pagination={false}
                      locale={{ emptyText: "Không có SKU nào" }}
                      dataSource={variantRows}
                      columns={skuColumns}
                      scroll={{ x: 900 }}
                    />
                  </div>
                </>
              ) : (
                <Row gutter={16}>
                  <Col span={6}>
                    <Form.Item
                      name="stockSingle"
                      label="Tồn kho"
                      rules={[
                        { required: true, message: "Vui lòng nhập tồn kho" },
                        {
                          validator: (_, value) => {
                            if (
                              value === undefined ||
                              value === null ||
                              value < 0
                            ) {
                              return Promise.reject(
                                new Error("Tồn kho phải lớn hơn hoặc bằng 0"),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        precision={0}
                        className="h-40 w-full"
                        placeholder="Nhập tồn kho"
                        disabled={isViewMode}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item
                      name="priceBtcSingle"
                      label="Giá bán lẻ"
                      rules={[
                        { required: true, message: "Vui lòng nhập giá bán lẻ" },
                        {
                          validator: (_, value) => {
                            if (
                              value === undefined ||
                              value === null ||
                              value <= 0
                            ) {
                              return Promise.reject(
                                new Error("Giá bán lẻ phải lớn hơn 0"),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        className="h-40 w-full"
                        placeholder="Nhập giá bán lẻ"
                        disabled={isViewMode}
                        formatter={(val) =>
                          `${Number(val || 0).toLocaleString("vi-VN")}`.replace(
                            /NaN/g,
                            "",
                          )
                        }
                        parser={(val) =>
                          Number(String(val || "").replace(/[^\d]/g, ""))
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item
                      name="priceBtbSingle"
                      label="Giá bán buôn"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập giá bán buôn",
                        },
                        {
                          validator: (_, value) => {
                            if (
                              value === undefined ||
                              value === null ||
                              value <= 0
                            ) {
                              return Promise.reject(
                                new Error("Giá bán buôn phải lớn hơn 0"),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        className="h-40 w-full"
                        placeholder="Nhập giá bán buôn"
                        disabled={isViewMode}
                        formatter={(val) =>
                          `${Number(val || 0).toLocaleString("vi-VN")}`.replace(
                            /NaN/g,
                            "",
                          )
                        }
                        parser={(val) =>
                          Number(String(val || "").replace(/[^\d]/g, ""))
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item
                      name="priceCtvSingle"
                      label="Giá CTV"
                      rules={[
                        { required: true, message: "Vui lòng nhập giá CTV" },
                        {
                          validator: (_, value) => {
                            if (
                              value === undefined ||
                              value === null ||
                              value <= 0
                            ) {
                              return Promise.reject(
                                new Error("Giá CTV phải lớn hơn 0"),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        className="h-40 w-full"
                        placeholder="Nhập giá CTV"
                        disabled={isViewMode}
                        formatter={(val) =>
                          `${Number(val || 0).toLocaleString("vi-VN")}`.replace(
                            /NaN/g,
                            "",
                          )
                        }
                        parser={(val) =>
                          Number(String(val || "").replace(/[^\d]/g, ""))
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Card>

            <Row justify="end" className="mt-16">
              <Button className="h-40" onClick={resetProductModal}>
                {isViewMode ? "Đóng" : "Huỷ"}
              </Button>

              {!isViewMode ? (
                <Button
                  type="primary"
                  className="ml-16 h-40"
                  onClick={handleSubmitProduct}
                >
                  {productModalMode === "create" ? "Thêm mới" : "Cập nhật"}
                </Button>
              ) : null}
            </Row>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

const ManageProduct = memo(Component);

export { ManageProduct };
