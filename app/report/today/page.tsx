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

  const summary = useMemo(() => {
    const totalSales = orders.reduce((sum, item) => {
      return sum + getItemUnitPrice(item) * Number(item.qty || 1);
    }, 0);

    const receiptSet = new Set(
      orders.map((item) => item.receipt_no).filter(Boolean)
    );

    const cashSales = orders
      .filter((item) => item.payment_method === "cash")
      .reduce((sum, item) => sum + getItemUnitPrice(item) * Number(item.qty || 1), 0);

    const transferSales = orders
      .filter((item) => item.payment_method === "transfer")
      .reduce((sum, item) => sum + getItemUnitPrice(item) * Number(item.qty || 1), 0);

    const itemQty = orders.reduce((sum, item) => sum + Number(item.qty || 1), 0);

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
    const map = new Map<
      string,
      {
        receiptNo: string;
        tableNo: string;
        paidAt: string;
        paymentMethod: string;
        total: number;
        items: PaidOrder[];
      }
    >();

    orders.forEach((item) => {
      const receiptNo = item.receipt_no || `no-receipt-${item.id}`;
      const total = getItemUnitPrice(item) * Number(item.qty || 1);

      if (!map.has(receiptNo)) {
        map.set(receiptNo, {
          receiptNo,
          tableNo: item.table_no,
          paidAt: item.paid_at || item.created_at,
          paymentMethod: item.payment_method || "-",
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
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );
  }, [orders]);
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
      <div className="mx-auto max-w-6xl">
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
                    <div key={bill.receiptNo} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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

                        <div className="text-right">
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
                              {(getItemUnitPrice(item) * item.qty).toFixed(0)}฿
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
    </main>
  );
}