"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Station = "noodle" | "rice" | "drink";

type OrderOption = {
  name: string;
  price: number;
  groupName?: string;
};

type OrderItem = {
  id: number;
  table_no: string;
  name: string;
  price: number;
  qty: number;
  note: string | null;
  station: Station;
  status: "new" | "cooking" | "done";
  paid: boolean;
  created_at: string;
  options?: OrderOption[] | null;
  item_total?: number | null;
};

export default function KitchenPage() {
  const params = useParams();
  const station = String(params.station) as Station;

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const stationName =
    station === "noodle"
      ? "ครัวก๋วยเตี๋ยว"
      : station === "rice"
      ? "ครัวตามสั่ง"
      : "เครื่องดื่ม";

  const loadOrders = async () => {
    let query = supabase
  .from("orders")
  .select("*")
  .eq("paid", false)
  .in("status", ["new", "cooking"])
  .order("created_at", { ascending: true });

if (station === "noodle") {
  query = query.in("station", ["noodle", "drink"]);
} else {
  query = query.eq("station", station);
}

const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("โหลดออเดอร์ไม่สำเร็จ: " + error.message);
      setIsLoading(false);
      return;
    }

    setOrders(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();

    const timer = setInterval(() => {
      loadOrders();
    }, 1000);

    return () => clearInterval(timer);
  }, [station]);

  const updateStatus = async (id: number, status: "new" | "cooking" | "done") => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("อัปเดตสถานะไม่สำเร็จ: " + error.message);
      return;
    }

    loadOrders();
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow">
          <div>
            <h1 className="text-3xl font-bold">{stationName}</h1>
            <p className="text-gray-500">รายการออเดอร์ที่รอทำ</p>
          </div>

          <button
            onClick={() => window.print()}
            className="rounded-xl bg-slate-800 px-4 py-3 font-bold text-white"
          >
            พิมพ์หน้านี้
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-xl bg-white p-8 text-center shadow">
            <p className="text-xl text-gray-500">กำลังโหลดออเดอร์...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white p-8 text-center shadow">
            <p className="text-xl text-gray-500">ยังไม่มีออเดอร์ใหม่</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`rounded-xl border-l-8 bg-white p-5 shadow ${
                  order.status === "new"
                    ? "border-orange-500"
                    : "border-blue-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold">โต๊ะ {order.table_no}</p>
                    <p className="text-sm text-gray-500">
                      เวลา{" "}
                      {new Date(order.created_at).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      order.status === "new"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.status === "new" ? "ออเดอร์ใหม่" : "กำลังทำ"}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-2xl font-bold">
                    {order.qty}x {order.name}
                  </p>

                {order.options && order.options.length > 0 && (
                <div className="mt-2 rounded-lg bg-orange-50 p-3 text-lg font-bold text-orange-900">
                {order.options.map((option, index) => (
                <p key={index}>
                + {option.name}
                {option.price > 0 ? ` ${option.price}฿` : ""}
                </p>
                ))}
                </div>
                )}

                  {order.note && (
                    <p className="mt-2 rounded-lg bg-yellow-100 p-3 text-lg font-bold text-yellow-900">
                      หมายเหตุ: {order.note}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex gap-3">
                  {order.status === "new" && (
                    <button
                      onClick={() => updateStatus(order.id, "cooking")}
                      className="flex-1 rounded-xl bg-blue-600 p-3 font-bold text-white"
                    >
                      เริ่มทำ
                    </button>
                  )}

                  <button
                    onClick={() => updateStatus(order.id, "done")}
                    className="flex-1 rounded-xl bg-green-600 p-3 font-bold text-white"
                  >
                    เสร็จแล้ว
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}