"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type OrderItem = {
  id: number;
  table_no: string;
  name: string;
  price: number;
  qty: number;
  item_total?: number | null;
  paid: boolean;
  status: string;
  created_at: string;
};

const tableLayout = [
  { tableNo: "1", left: "8%", top: "8%" },
  { tableNo: "2", left: "8%", top: "26%" },
  { tableNo: "3", left: "8%", top: "44%" },
  { tableNo: "4", left: "8%", top: "62%" },
  //{ tableNo: "5", left: "8%", top: "80%" },

  { tableNo: "6", left: "40%", top: "20%" },
  { tableNo: "7", left: "40%", top: "40%" },

  { tableNo: "8", left: "40%", top: "61%" },
  { tableNo: "9", left: "40%", top: "82%" },
];

function getTableName(tableNo: string) {
  if (tableNo.startsWith("takeaway-")) {
    const billNo = tableNo.replace("takeaway-", "");
    return `กลับบ้าน ${billNo}`;
  }

  return `โต๊ะ ${tableNo}`;
}

function getItemUnitPrice(item: OrderItem) {
  return Number(item.item_total || item.price || 0);
}

export default function PosPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("paid", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      alert("โหลดข้อมูลโต๊ะไม่สำเร็จ");
      setLoading(false);
      return;
    }

    setOrders((data || []) as OrderItem[]);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel("pos-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const tableSummary = useMemo(() => {
    return tableLayout.map((table) => {
      const tableOrders = orders.filter(
        (order) => order.table_no === table.tableNo
      );

      const total = tableOrders.reduce((sum, order) => {
        return sum + getItemUnitPrice(order) * Number(order.qty || 1);
      }, 0);

      const itemCount = tableOrders.reduce((sum, order) => {
        return sum + Number(order.qty || 1);
      }, 0);

      return {
        ...table,
        name: getTableName(table.tableNo),
        hasOrder: tableOrders.length > 0,
        total,
        itemCount,
      };
    });
  }, [orders]);

  const takeawaySummary = useMemo(() => {
    const takeawayMap = new Map<string, OrderItem[]>();

    orders.forEach((order) => {
      if (!order.table_no.startsWith("takeaway-")) return;

      if (!takeawayMap.has(order.table_no)) {
        takeawayMap.set(order.table_no, []);
      }

      takeawayMap.get(order.table_no)?.push(order);
    });

    return Array.from(takeawayMap.entries()).map(([tableNo, items]) => {
      const total = items.reduce((sum, order) => {
        return sum + getItemUnitPrice(order) * Number(order.qty || 1);
      }, 0);

      const itemCount = items.reduce((sum, order) => {
        return sum + Number(order.qty || 1);
      }, 0);

      return {
        tableNo,
        name: getTableName(tableNo),
        total,
        itemCount,
      };
    });
  }, [orders]);

  function openNewTakeawayBill() {
    const takeawayId = `takeaway-${Date.now().toString().slice(-6)}`;
    router.push(`/cashier?table=${takeawayId}`);
  }

  return (
    <main className="min-h-screen bg-orange-50 p-4 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 rounded-2xl bg-white p-5 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-900">
                แผนผังโต๊ะ ร้านหลงมา
              </h1>
              <p className="mt-1 text-gray-600">
                กดที่โต๊ะเพื่อเปิดบิล / คิดเงิน
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={openNewTakeawayBill}
                className="rounded-xl bg-orange-600 px-4 py-3 font-bold text-white shadow hover:bg-orange-700"
              >
                + เปิดบิลกลับบ้าน
              </button>

              <button
                onClick={loadOrders}
                className="rounded-xl bg-white px-4 py-3 font-bold shadow hover:bg-orange-100"
              >
                รีเฟรช
              </button>
              <Link
    href="/menu"
    target="_blank"
    className="rounded-xl bg-green-800 px-4 py-3 text-center font-bold text-white shadow hover:bg-green-900"
  >
    เปิดเมนูออนไลน์
  </Link>

              <Link
                href="/admin/menu"
                className="rounded-xl bg-gray-900 px-4 py-3 text-center font-bold text-white shadow hover:bg-gray-800"
              >
                จัดการเมนู
              </Link>

              <Link
                href="/admin/options"
                className="rounded-xl bg-yellow-400 px-4 py-3 text-center font-bold text-gray-950 shadow hover:bg-yellow-500"
              >
                จัดการวัตถุดิบ
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto pb-3">
          <div className="relative mx-auto h-[720px] w-[520px] min-w-[520px] overflow-hidden rounded-3xl bg-zinc-950 shadow-2xl">
              <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl bg-white px-8 py-3 text-3xl font-bold text-black shadow">
                ประตู
              </div>

              {tableSummary.map((table) => (
                <Link
                  key={table.tableNo}
                  href={`/cashier?table=${table.tableNo}`}
                  style={{
                    left: table.left,
                    top: table.top,
                  }}
                  className={`absolute flex h-28 w-36 flex-col items-center justify-center rounded-2xl border-4 text-center font-bold shadow-lg transition hover:scale-105 ${
                    table.hasOrder
                      ? "border-orange-200 bg-orange-600 text-white"
                      : "border-white bg-zinc-900 text-yellow-300"
                  }`}
                >
                  <div className="text-xl">{table.name}</div>

                  {table.hasOrder ? (
                    <>
                      <div className="mt-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                        ยังไม่จ่าย
                      </div>
                      <div className="mt-1 text-2xl">
                        ฿{table.total.toFixed(0)}
                      </div>
                      <div className="text-xs opacity-90">
                        {table.itemCount} รายการ
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      ว่าง
                    </div>
                  )}
                </Link>
              ))}
            </div>
            </div>
            <section className="mt-6 rounded-2xl bg-white p-5 shadow">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">บิลกลับบ้าน</h2>
                  <p className="text-gray-500">
                    เปิดบิลใหม่สำหรับลูกค้ากลับบ้านหลายคนพร้อมกัน
                  </p>
                </div>

                <button
                  onClick={openNewTakeawayBill}
                  className="rounded-xl bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700"
                >
                  + เปิดบิลกลับบ้าน
                </button>
              </div>

              {takeawaySummary.length === 0 ? (
                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-gray-500">
                  ยังไม่มีบิลกลับบ้านค้างชำระ
                </p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {takeawaySummary.map((bill) => (
                    <Link
                      key={bill.tableNo}
                      href={`/cashier?table=${bill.tableNo}`}
                      className="rounded-2xl bg-orange-600 p-5 text-white shadow transition hover:scale-105"
                    >
                      <p className="text-2xl font-bold">{bill.name}</p>
                      <p className="mt-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                        ยังไม่คิดเงิน
                      </p>
                      <p className="mt-4 text-3xl font-bold">
                        ฿{bill.total.toFixed(0)}
                      </p>
                      <p className="mt-1 text-sm opacity-90">
                        {bill.itemCount} รายการ
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-6">
          <Link
            href="/cashier"
            className="rounded-2xl bg-blue-900 p-4 text-center font-bold text-white shadow"
          >
            ไปหน้าแคชเชียร์
          </Link>
            <Link
            href="/report/today"
            className="rounded-2xl bg-green-600 p-4 text-center font-bold text-white shadow"
            >
             รายงานวันนี้
            </Link>
          <Link
            href="/kitchen/noodle"
            className="rounded-2xl bg-white p-4 text-center font-bold text-gray-900 shadow"
          >
            จอก๋วยเตี๋ยว
          </Link>

          <Link
            href="/kitchen/rice"
            className="rounded-2xl bg-white p-4 text-center font-bold text-gray-900 shadow"
          >
            จอตามสั่ง
          </Link>

          <Link
            href="/admin/menu"
            className="rounded-2xl bg-orange-600 p-4 text-center font-bold text-white shadow"
          >
            จัดการเมนู
          </Link>
            
          <Link
            href="/admin/options"
            className="rounded-2xl bg-yellow-400 p-4 text-center font-bold text-gray-950 shadow"
          >
            จัดการวัตถุดิบ
          </Link>
        </div>
      </div>
    </main>
  );
}
