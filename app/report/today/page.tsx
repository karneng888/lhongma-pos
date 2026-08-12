"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type PaidOrderOption = {
  name?: string;
  price?: number;
  groupName?: string;
  groupId?: string;
};

type PaidOrder = {
  id: number;
  table_no: string;
  name: string;
  price: number;
  qty: number;
  item_total?: number | null;
  paid: boolean;
  paid_at?: string | null;
  receipt_no?: string | null;
  payment_method?: "cash" | "transfer" | null;
  cash_received?: number | null;
  change_amount?: number | null;
  created_at: string;
  options?: PaidOrderOption[] | string | null;
  note?: string | null;
};

type Bill = {
  receiptNo: string;
  tableNo: string;
  paidAt: string;
  paymentMethod: string;
  cashReceived: number;
  changeAmount: number;
  total: number;
  items: PaidOrder[];
};

function getItemUnitPrice(item: PaidOrder) {
  return Number(item.item_total || item.price || 0);
}

function getTableName(tableNo: string) {
  if (tableNo.startsWith("takeaway-")) {
    const billNo = tableNo.replace("takeaway-", "");
    return `กลับบ้าน ${billNo}`;
  }

  if (tableNo === "takeaway") return "กลับบ้าน";
  return `โต๊ะ ${tableNo}`;
}

function normalizeOptionText(value?: string) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()\[\]{}\-_/]/g, "");
}

function getOrderOptions(item: PaidOrder): PaidOrderOption[] {
  if (Array.isArray(item.options)) {
    return item.options;
  }

  // รองรับกรณี Supabase ส่ง options กลับมาเป็นข้อความ JSON
  if (typeof item.options === "string") {
    try {
      const parsed = JSON.parse(item.options);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("อ่าน options ไม่สำเร็จ", error, item.options);
      return [];
    }
  }

  return [];
}

function getReportMenuName(item: PaidOrder) {
  const options = getOrderOptions(item);

  // หาเนื้อสัตว์หลักจากชื่อกลุ่มก่อน
  const mainProteinFromGroup = options.find((option) => {
    const groupText = normalizeOptionText(
      `${option.groupName || ""} ${option.groupId || ""}`
    );

    if (!groupText) return false;

    const isExtraProtein =
      groupText.includes("เพิ่ม") ||
      groupText.includes("extra") ||
      groupText.includes("additional") ||
      groupText.includes("addprotein");

    if (isExtraProtein) return false;

    return (
      groupText.includes("เนื้อสัตว์หลัก") ||
      groupText.includes("เลือกเนื้อสัตว์") ||
      groupText === "เนื้อสัตว์" ||
      groupText.includes("mainprotein") ||
      groupText.includes("proteinmain")
    );
  });

  // เผื่อชื่อ groupName ในข้อมูลไม่ตรง ให้หาโดยชื่อหมู/ไก่/ทะเลแทน
  const proteinKeywords = [
    "เครื่องในไก่",
    "หมูกรอบ",
    "ไก่กรอบ",
    "หมูตุ๋น",
    "เนื้อตุ๋น",
    "หมูสับ",
    "หมูชิ้น",
    "เนื้อสับ",
    "เนื้อชิ้น",
    "ตับหมู",
    "ปลาหมึก",
    "ทะเล",
    "กุ้ง",
    "ไก่",
    "หมู",
    "เนื้อ",
    "ตับ",
  ].map(normalizeOptionText);

  const mainProteinFallback = options.find((option) => {
    const optionName = normalizeOptionText(option.name);
    const groupText = normalizeOptionText(
      `${option.groupName || ""} ${option.groupId || ""}`
    );

    if (!optionName) return false;

    const isClearlyNotMainProtein =
      optionName.includes("เพิ่ม") ||
      groupText.includes("เพิ่ม") ||
      groupText.includes("extra") ||
      groupText.includes("additional") ||
      groupText.includes("เส้น") ||
      groupText.includes("เผ็ด") ||
      groupText.includes("ไข่") ||
      groupText.includes("กับข้าว") ||
      groupText.includes("ขนาด");

    if (isClearlyNotMainProtein) return false;

    return proteinKeywords.some((keyword) => optionName.includes(keyword));
  });

  const mainProtein = mainProteinFromGroup || mainProteinFallback;
  const proteinName = mainProtein?.name?.trim();
  const baseName = item.name.trim();

  if (!proteinName) {
    return baseName;
  }

  // กันชื่อซ้ำ เช่น เมนูเดิมมีคำว่า "หมูกรอบ" อยู่แล้ว
  if (
    normalizeOptionText(baseName).includes(normalizeOptionText(proteinName))
  ) {
    return baseName;
  }

  return `${baseName}${proteinName}`;
}

export default function TodayReportPage() {
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [reprintBill, setReprintBill] = useState<Bill | null>(null);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [editItems, setEditItems] = useState<PaidOrder[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  async function loadTodaySales() {
    setLoading(true);

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("paid", true)
      .gte("paid_at", start.toISOString())
      .lt("paid_at", end.toISOString())
      .order("paid_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("โหลดรายงานไม่สำเร็จ: " + error.message);
      setLoading(false);
      return;
    }

    setOrders((data || []) as PaidOrder[]);
    setLoading(false);
  }

  useEffect(() => {
    loadTodaySales();
  }, []);

  useEffect(() => {
    const isLogin = sessionStorage.getItem("lhongma-admin-login");

    if (isLogin !== "yes") {
      window.location.href = "/login";
      return;
    }

    setIsAllowed(true);
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => {
      setReprintBill(null);
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const summary = useMemo(() => {
    const totalSales = orders.reduce((sum, item) => {
      return sum + getItemUnitPrice(item) * Number(item.qty || 1);
    }, 0);

    const receiptSet = new Set(
      orders.map((item) => item.receipt_no).filter(Boolean)
    );

    const cashSales = orders
      .filter((item) => item.payment_method === "cash")
      .reduce(
        (sum, item) =>
          sum + getItemUnitPrice(item) * Number(item.qty || 1),
        0
      );

    const transferSales = orders
      .filter((item) => item.payment_method === "transfer")
      .reduce(
        (sum, item) =>
          sum + getItemUnitPrice(item) * Number(item.qty || 1),
        0
      );

    const itemQty = orders.reduce(
      (sum, item) => sum + Number(item.qty || 1),
      0
    );

    return {
      totalSales,
      billCount: receiptSet.size,
      cashSales,
      transferSales,
      itemQty,
    };
  }, [orders]);

  const bestSellers = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        qty: number;
        total: number;
      }
    >();

    orders.forEach((item) => {
      const menuName = getReportMenuName(item);

      const existing = map.get(menuName);
      const qty = Number(item.qty || 1);
      const total = getItemUnitPrice(item) * qty;

      if (existing) {
        existing.qty += qty;
        existing.total += total;
      } else {
        map.set(menuName, {
          name: menuName,
          qty,
          total,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [orders]);

  const bills = useMemo(() => {
    const map = new Map<string, Bill>();

    orders.forEach((item) => {
      const receiptNo = item.receipt_no || `no-receipt-${item.id}`;
      const total = getItemUnitPrice(item) * Number(item.qty || 1);

      if (!map.has(receiptNo)) {
        map.set(receiptNo, {
          receiptNo,
          tableNo: item.table_no,
          paidAt: item.paid_at || item.created_at,
          paymentMethod: item.payment_method || "-",
          cashReceived: Number(item.cash_received || 0),
          changeAmount: Number(item.change_amount || 0),
          total: 0,
          items: [],
        });
      }

      const bill = map.get(receiptNo);
      if (!bill) return;

      bill.total += total;
      bill.items.push(item);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );
  }, [orders]);

  const handleReprint = (bill: Bill) => {
    setReprintBill(bill);

    // รอ React render ส่วน print-only ก่อนเปิดหน้าต่างพิมพ์
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const openEditBill = (bill: Bill) => {
    setEditBill(bill);
    setEditItems(
      bill.items.map((item) => ({
        ...item,
        qty: Number(item.qty || 1),
        price: Number(item.price || 0),
        item_total: Number(item.item_total || item.price || 0),
      }))
    );
    setDeletedItemIds([]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("1");
  };

  const closeEditBill = () => {
    if (savingEdit) return;
    setEditBill(null);
    setEditItems([]);
    setDeletedItemIds([]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("1");
  };

  const changeEditItemQty = (id: number, nextQty: number) => {
    if (nextQty < 1) return;

    setEditItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, qty: nextQty } : item
      )
    );
  };

  const changeEditItemName = (id: number, name: string) => {
    setEditItems((current) =>
      current.map((item) => (item.id === id ? { ...item, name } : item))
    );
  };

  const changeEditItemPrice = (id: number, value: string) => {
    const nextPrice = Number(value);
    if (Number.isNaN(nextPrice) || nextPrice < 0) return;

    setEditItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              price: nextPrice,
              item_total: nextPrice,
            }
          : item
      )
    );
  };

  const deletePaidItem = (item: PaidOrder) => {
    if (!editBill) return;

    const ok = window.confirm(
      `ลบ "${getReportMenuName(item)}" ออกจากบิล ${editBill.receiptNo} ใช่ไหม?`
    );
    if (!ok) return;

    if (item.id > 0) {
      setDeletedItemIds((current) =>
        current.includes(item.id) ? current : [...current, item.id]
      );
    }

    setEditItems((current) => current.filter((row) => row.id !== item.id));
  };

  const addPaidItem = () => {
    if (!editBill) return;

    const name = newItemName.trim();
    const price = Number(newItemPrice);
    const qty = Number(newItemQty);

    if (!name) {
      alert("กรุณาใส่ชื่อรายการ");
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      alert("กรุณาใส่ราคาให้ถูกต้อง");
      return;
    }

    if (!Number.isInteger(qty) || qty < 1) {
      alert("จำนวนต้องเป็น 1 ขึ้นไป");
      return;
    }

    const tempItem: PaidOrder = {
      id: -Date.now(),
      table_no: editBill.tableNo,
      name,
      price,
      qty,
      item_total: price,
      paid: true,
      paid_at: editBill.paidAt,
      receipt_no: editBill.receiptNo,
      payment_method:
        editBill.paymentMethod === "cash" ||
        editBill.paymentMethod === "transfer"
          ? editBill.paymentMethod
          : null,
      cash_received: Number(editBill.cashReceived || 0),
      change_amount: Number(editBill.changeAmount || 0),
      created_at: new Date().toISOString(),
      options: [],
      note: null,
    };

    setEditItems((current) => [...current, tempItem]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("1");
  };

  const saveEditedBill = async () => {
    if (!editBill) return;

    if (editItems.length === 0) {
      alert(
        "บิลนี้ไม่มีรายการเหลือแล้ว ถ้าต้องการยกเลิกทั้งบิล แนะนำทำปุ่ม VOID แยกต่างหาก เพื่อไม่ให้ข้อมูลประวัติหาย"
      );
      return;
    }

    const hasInvalidItem = editItems.some(
      (item) =>
        !item.name.trim() ||
        Number(item.qty) < 1 ||
        Number.isNaN(Number(item.item_total ?? item.price)) ||
        Number(item.item_total ?? item.price) < 0
    );

    if (hasInvalidItem) {
      alert("ตรวจสอบชื่อ ราคา และจำนวนของแต่ละรายการอีกครั้ง");
      return;
    }

    setSavingEdit(true);

    try {
      // 1) ลบเฉพาะรายการเดิมที่ผู้ใช้กดลบ
      if (deletedItemIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("orders")
          .delete()
          .in("id", deletedItemIds);

        if (deleteError) throw deleteError;
      }

      // 2) อัปเดตรายการเดิม
      for (const item of editItems.filter((row) => row.id > 0)) {
        const unitPrice = Number(item.item_total ?? item.price ?? 0);

        const { error } = await supabase
          .from("orders")
          .update({
            name: item.name.trim(),
            qty: Number(item.qty || 1),
            price: unitPrice,
            item_total: unitPrice,
          })
          .eq("id", item.id);

        if (error) throw error;
      }

      // 3) เพิ่มรายการใหม่เข้า receipt_no เดิม
      const newItems = editItems.filter((row) => row.id < 0);

      if (newItems.length > 0) {
        const payload = newItems.map((item) => {
          const unitPrice = Number(item.item_total ?? item.price ?? 0);

          return {
            table_no: editBill.tableNo,
            name: item.name.trim(),
            price: unitPrice,
            qty: Number(item.qty || 1),
            item_total: unitPrice,
            paid: true,
            paid_at: editBill.paidAt,
            receipt_no: editBill.receiptNo,
            payment_method:
              editBill.paymentMethod === "cash" ||
              editBill.paymentMethod === "transfer"
                ? editBill.paymentMethod
                : null,
            cash_received: Number(editBill.cashReceived || 0),
            change_amount: Number(editBill.changeAmount || 0),
            options: [],
            note: null,
          };
        });

        const { error: insertError } = await supabase
          .from("orders")
          .insert(payload);

        if (insertError) {
          throw new Error(
            insertError.message +
              " | ถ้า orders มี column บังคับอื่น ๆ ส่ง error นี้มาให้ฉัน เดี๋ยวเติม field ให้ตรงฐานข้อมูลร้านหลงมา"
          );
        }
      }

      const newTotal = editItems.reduce(
        (sum, item) =>
          sum +
          Number(item.item_total ?? item.price ?? 0) *
            Number(item.qty || 1),
        0
      );

      const nextChange =
        editBill.paymentMethod === "cash"
          ? Math.max(Number(editBill.cashReceived || 0) - newTotal, 0)
          : 0;

      const { error: paymentError } = await supabase
        .from("orders")
        .update({
          change_amount: nextChange,
        })
        .eq("receipt_no", editBill.receiptNo);

      if (paymentError) throw paymentError;

      await loadTodaySales();
      setEditBill(null);
      setEditItems([]);
      setDeletedItemIds([]);
      alert("แก้ไขบิลเรียบร้อยแล้ว");
    } catch (error: any) {
      console.error(error);
      alert("บันทึกการแก้ไขไม่สำเร็จ: " + (error?.message || error));
    } finally {
      setSavingEdit(false);
    }
  };

  const editBillTotal = editItems.reduce(
    (sum, item) =>
      sum +
      Number(item.item_total ?? item.price ?? 0) * Number(item.qty || 1),
    0
  );

  if (!isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50 text-gray-900">
        <div className="rounded-2xl bg-white p-6 font-bold shadow">
          กำลังตรวจสอบสิทธิ์...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 p-4 text-gray-900">
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }

          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          @page {
            size: 80mm auto;
            margin: 4mm;
          }
        }

        .print-only {
          display: none;
        }
      `}</style>

      <div className="no-print mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-900">
                รายงานยอดขายวันนี้
              </h1>
              <p className="text-gray-500">
                ดูยอดขาย บิลทั้งหมด และเมนูขายดีของวันนี้
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadTodaySales}
                className="rounded-xl bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700"
              >
                รีเฟรช
              </button>

              <Link
                href="/pos"
                className="rounded-xl bg-gray-900 px-4 py-3 text-center font-bold text-white hover:bg-gray-800"
              >
                กลับหน้า POS
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl bg-white p-6 text-center shadow">
            กำลังโหลดรายงาน...
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-orange-600 p-5 text-white shadow">
                <p className="text-sm opacity-90">ยอดขายรวม</p>
                <p className="mt-2 text-4xl font-bold">
                  {summary.totalSales.toFixed(0)}฿
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow">
                <p className="text-sm text-gray-500">จำนวนบิล</p>
                <p className="mt-2 text-4xl font-bold">
                  {summary.billCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow">
                <p className="text-sm text-gray-500">จำนวนรายการ</p>
                <p className="mt-2 text-4xl font-bold">
                  {summary.itemQty}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow">
                <p className="text-sm text-gray-500">เฉลี่ยต่อบิล</p>
                <p className="mt-2 text-4xl font-bold">
                  {summary.billCount > 0
                    ? (summary.totalSales / summary.billCount).toFixed(0)
                    : 0}
                  ฿
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow">
                <h2 className="text-2xl font-bold">แยกตามช่องทางชำระ</h2>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between rounded-xl bg-gray-50 p-4 text-xl font-bold">
                    <span>เงินสด</span>
                    <span>{summary.cashSales.toFixed(0)}฿</span>
                  </div>

                  <div className="flex justify-between rounded-xl bg-gray-50 p-4 text-xl font-bold">
                    <span>โอน</span>
                    <span>{summary.transferSales.toFixed(0)}฿</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow">
                <h2 className="text-2xl font-bold">เมนูขายดี</h2>

                {bestSellers.length === 0 ? (
                  <p className="mt-4 text-gray-500">ยังไม่มีข้อมูลวันนี้</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {bestSellers.slice(0, 10).map((item, index) => (
                      <div
                        key={item.name}
                        className="flex justify-between rounded-xl bg-gray-50 p-3"
                      >
                        <div>
                          <p className="font-bold">
                            {index + 1}. {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.qty} รายการ
                          </p>
                        </div>

                        <p className="font-bold text-orange-700">
                          {item.total.toFixed(0)}฿
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <section className="mt-5 rounded-2xl bg-white p-5 shadow">
              <h2 className="text-2xl font-bold">บิลวันนี้</h2>

              {bills.length === 0 ? (
                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-gray-500">
                  ยังไม่มีบิลที่ชำระแล้ววันนี้
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {bills.map((bill) => (
                    <div
                      key={bill.receiptNo}
                      className="rounded-2xl border p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-bold">
                            {getTableName(bill.tableNo)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {bill.receiptNo}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(bill.paidAt).toLocaleString("th-TH", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>

                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <div className="text-left md:text-right">
                            <p className="text-2xl font-bold text-orange-700">
                              {bill.total.toFixed(0)}฿
                            </p>
                            <p className="text-sm text-gray-500">
                              {bill.paymentMethod === "cash"
                                ? "เงินสด"
                                : bill.paymentMethod === "transfer"
                                ? "โอน"
                                : "-"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditBill(bill)}
                              className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-white shadow hover:bg-amber-600"
                            >
                              ✏️ แก้ไขบิล
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReprint(bill)}
                              className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow hover:bg-blue-700"
                            >
                              🖨 พิมพ์ซ้ำ
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
                        {bill.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between gap-3"
                          >
                            <span>
                              {getReportMenuName(item)} x{item.qty}
                            </span>
                            <span>
                              {(
                                getItemUnitPrice(item) * item.qty
                              ).toFixed(0)}
                              ฿
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {editBill && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-orange-900">
                  แก้ไขบิล
                </h2>
                <p className="text-sm text-gray-500">
                  {editBill.receiptNo} · {getTableName(editBill.tableNo)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditBill}
                disabled={savingEdit}
                className="rounded-xl bg-gray-100 px-3 py-2 font-bold hover:bg-gray-200 disabled:opacity-50"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {editItems.length === 0 ? (
                <div className="rounded-xl bg-red-50 p-4 font-bold text-red-700">
                  ไม่มีรายการเหลือในบิลนี้
                </div>
              ) : (
                editItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                      <label className="block">
                        <span className="mb-1 block text-sm font-bold">
                          ชื่อรายการ
                        </span>
                        <input
                          value={item.name}
                          onChange={(e) =>
                            changeEditItemName(item.id, e.target.value)
                          }
                          className="w-full rounded-xl border px-3 py-2"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-sm font-bold">
                          ราคาต่อหน่วย
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={Number(item.item_total ?? item.price ?? 0)}
                          onChange={(e) =>
                            changeEditItemPrice(item.id, e.target.value)
                          }
                          className="w-full rounded-xl border px-3 py-2"
                        />
                      </label>
                    </div>

                    {getOrderOptions(item).length > 0 && (
                      <div className="mt-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                        ตัวเลือกเดิม:{" "}
                        {getOrderOptions(item)
                          .map((option) => option.name)
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            changeEditItemQty(item.id, Number(item.qty) - 1)
                          }
                          disabled={Number(item.qty) <= 1 || savingEdit}
                          className="h-10 w-10 rounded-xl bg-gray-200 text-xl font-bold disabled:opacity-40"
                        >
                          −
                        </button>

                        <div className="min-w-12 text-center text-xl font-bold">
                          {item.qty}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            changeEditItemQty(item.id, Number(item.qty) + 1)
                          }
                          disabled={savingEdit}
                          className="h-10 w-10 rounded-xl bg-gray-200 text-xl font-bold disabled:opacity-40"
                        >
                          +
                        </button>

                        <span className="ml-2 font-bold text-orange-700">
                          {(
                            Number(item.item_total ?? item.price ?? 0) *
                            Number(item.qty || 1)
                          ).toFixed(0)}
                          ฿
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deletePaidItem(item)}
                        disabled={savingEdit}
                        className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        🗑 ลบรายการ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-orange-50 p-4">
              <h3 className="text-lg font-bold text-orange-900">
                + เพิ่มรายการในบิลเดิม
              </h3>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px_100px_auto]">
                <input
                  placeholder="ชื่อรายการ เช่น ไข่ดาว"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="rounded-xl border bg-white px-3 py-2"
                />

                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="ราคา"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="rounded-xl border bg-white px-3 py-2"
                />

                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="จำนวน"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="rounded-xl border bg-white px-3 py-2"
                />

                <button
                  type="button"
                  onClick={addPaidItem}
                  disabled={savingEdit}
                  className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  เพิ่ม
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                รายการที่เพิ่มจากหน้านี้เป็นรายการแบบกำหนดเอง
                เหมาะกับกรณีลืมคิดไข่ดาว น้ำ หรือรายการเล็ก ๆ
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-gray-900 p-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold">ยอดใหม่</span>
                <span className="text-3xl font-bold">
                  {editBillTotal.toFixed(0)}฿
                </span>
              </div>

              {editBill.paymentMethod === "cash" && (
                <div className="mt-2 text-sm text-gray-300">
                  เงินที่รับไว้เดิม {editBill.cashReceived.toFixed(0)}฿
                  {" · "}
                  เงินทอนใหม่{" "}
                  {Math.max(
                    Number(editBill.cashReceived || 0) - editBillTotal,
                    0
                  ).toFixed(0)}
                  ฿
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditBill}
                disabled={savingEdit}
                className="rounded-xl bg-gray-200 px-5 py-3 font-bold hover:bg-gray-300 disabled:opacity-50"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={saveEditedBill}
                disabled={savingEdit || editItems.length === 0}
                className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {savingEdit ? "กำลังบันทึก..." : "💾 บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reprintBill && (
        <div className="print-only font-mono text-[12px] leading-tight">
          <div className="text-center">
            <h1 className="text-xl font-bold">หลงมา</h1>
            <p>ก๋วยเตี๋ยว / อาหารตามสั่ง</p>
            <p>ขอบคุณที่อุดหนุนค่ะ</p>

            <div className="mt-2 border border-black px-2 py-1 text-sm font-bold">
              สำเนา / REPRINT
            </div>
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <div className="space-y-1">
            <p>ใบเสร็จ: {reprintBill.receiptNo}</p>
            <p>โต๊ะ/บิล: {getTableName(reprintBill.tableNo)}</p>
            <p>
              วันที่:{" "}
              {new Date(reprintBill.paidAt).toLocaleString("th-TH", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <div className="space-y-2">
            {reprintBill.items.map((item) => {
              const unitPrice = getItemUnitPrice(item);
              const lineTotal = unitPrice * item.qty;
              const options = getOrderOptions(item);

              return (
                <div key={item.id}>
                  <div className="flex justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold">
                        {item.name} x{item.qty}
                      </p>
                      <p className="text-[11px]">
                        {unitPrice} x {item.qty}
                      </p>
                    </div>

                    <p className="font-bold">{lineTotal}</p>
                  </div>

                  {options.length > 0 && (
                    <div className="ml-2 mt-1">
                      {options.map((option, index) => (
                        <p key={index}>- {option.name}</p>
                      ))}
                    </div>
                  )}

                  {item.note && (
                    <p className="ml-2 mt-1">
                      * หมายเหตุ: {item.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <div className="space-y-1">
            <div className="flex justify-between text-base font-bold">
              <span>รวมทั้งหมด</span>
              <span>{reprintBill.total.toFixed(0)} บาท</span>
            </div>

            <div className="flex justify-between">
              <span>ชำระโดย</span>
              <span>
                {reprintBill.paymentMethod === "cash"
                  ? "เงินสด"
                  : reprintBill.paymentMethod === "transfer"
                  ? "โอน"
                  : "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>รับเงิน</span>
              <span>{reprintBill.cashReceived.toFixed(0)} บาท</span>
            </div>

            {reprintBill.paymentMethod === "cash" && (
              <div className="flex justify-between">
                <span>เงินทอน</span>
                <span>{reprintBill.changeAmount.toFixed(0)} บาท</span>
              </div>
            )}
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <div className="text-center">
            <p>ขอบคุณค่ะ</p>
            <p>แล้วแวะมาอีกนะคะ</p>
          </div>
        </div>
      )}
    </main>
  );
}