"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { menuItems } from "@/app/data/menu";

type OptionStatus = {
  option_id: string;
  is_available: boolean;
};

type Category = "all" | "noodle" | "rice" | "drink";

type StockOption = {
  stockId: string;
  name: string;
  price: number;
  groups: string[];
  menuNames: string[];
  stations: string[];
};

function getCategoryName(station: string) {
  if (station === "noodle") return "ก๋วยเตี๋ยว";
  if (station === "rice") return "ตามสั่ง";
  if (station === "drink") return "เครื่องดื่ม";
  return station;
}

function cleanOptionName(name: string) {
  return name.replace("เพิ่ม", "").trim();
}

export default function AdminOptionsPage() {
  const [statuses, setStatuses] = useState<OptionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [isAllowed, setIsAllowed] = useState(false);
  async function loadOptionStatus() {
    const { data, error } = await supabase
      .from("option_status")
      .select("*")
      .order("option_id", { ascending: true });

    if (error) {
      console.error(error);
      alert("โหลดสถานะช้อยส์ไม่สำเร็จ: " + error.message);
      setLoading(false);
      return;
    }

    setStatuses(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOptionStatus();
  }, []);
  useEffect(() => {
  const isLogin = sessionStorage.getItem("lhongma-admin-login");

  if (isLogin !== "yes") {
    window.location.href = "/login";
    return;
  }

  setIsAllowed(true);
}, []);
  const statusMap = useMemo(() => {
    const map = new Map<string, boolean>();

    statuses.forEach((status) => {
      map.set(status.option_id, status.is_available);
    });

    return map;
  }, [statuses]);

  const allStockOptions = useMemo(() => {
    const optionMap = new Map<string, StockOption>();

    menuItems.forEach((menu) => {
      menu.optionGroups?.forEach((group) => {
        group.options.forEach((option) => {
          const stockId = option.stockId || option.id;
          const displayName = cleanOptionName(option.name);

          const existing = optionMap.get(stockId);

          if (existing) {
            if (!existing.groups.includes(group.name)) {
              existing.groups.push(group.name);
            }

            if (!existing.menuNames.includes(menu.name)) {
              existing.menuNames.push(menu.name);
            }

            if (!existing.stations.includes(menu.station)) {
              existing.stations.push(menu.station);
            }

            return;
          }

          optionMap.set(stockId, {
            stockId,
            name: displayName,
            price: option.price,
            groups: [group.name],
            menuNames: [menu.name],
            stations: [menu.station],
          });
        });
      });
    });

    return Array.from(optionMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "th")
    );
  }, []);

  const filteredOptions = useMemo(() => {
    if (activeCategory === "all") return allStockOptions;

    return allStockOptions.filter((option) =>
      option.stations.includes(activeCategory)
    );
  }, [activeCategory, allStockOptions]);

  async function toggleOption(stockId: string) {
    const currentStatus = statusMap.get(stockId) ?? true;
    const newStatus = !currentStatus;

    const { error } = await supabase.from("option_status").upsert({
      option_id: stockId,
      is_available: newStatus,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(error);
      alert("อัปเดตสถานะช้อยส์ไม่สำเร็จ: " + error.message);
      return;
    }

    setStatuses((prev) => {
      const exists = prev.some((item) => item.option_id === stockId);

      if (exists) {
        return prev.map((item) =>
          item.option_id === stockId
            ? { ...item, is_available: newStatus }
            : item
        );
      }

      return [...prev, { option_id: stockId, is_available: newStatus }];
    });
  }
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
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-900">
                จัดการช้อยส์ / วัตถุดิบ
              </h1>
              <p className="text-gray-500">
                ปิดวัตถุดิบครั้งเดียว เช่น ไก่กรอบ หมูกรอบ ทะเล เส้นใหญ่
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/menu"
                className="rounded-xl bg-white px-4 py-3 text-center font-bold text-gray-900 shadow hover:bg-orange-100"
              >
                จัดการเมนู
              </Link>

              <Link
                href="/pos"
                className="rounded-xl bg-gray-900 px-4 py-3 text-center font-bold text-white hover:bg-gray-800"
              >
                กลับหน้าแผนผังโต๊ะ
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "noodle", label: "ก๋วยเตี๋ยว" },
            { id: "rice", label: "ตามสั่ง" },
            { id: "drink", label: "เครื่องดื่ม" },
          ].map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as Category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 font-bold ${
                activeCategory === category.id
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-800 shadow"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl bg-white p-6 text-center shadow">
            กำลังโหลดช้อยส์...
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {filteredOptions.map((option) => {
              const isAvailable = statusMap.get(option.stockId) ?? true;

              return (
                <div
                  key={option.stockId}
                  className={`rounded-2xl border p-4 shadow ${
                    isAvailable
                      ? "border-green-200 bg-white"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xl font-bold">{option.name}</p>

                      <p className="text-gray-500">
                        {option.groups.join(" / ")}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        ใช้ในหมวด:{" "}
                        {option.stations
                          .map((station) => getCategoryName(station))
                          .join(", ")}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        stockId: {option.stockId}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleOption(option.stockId)}
                      className={`rounded-xl px-5 py-3 font-bold ${
                        isAvailable
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {isAvailable ? "เปิดขาย" : "หมด / ปิดช้อยส์"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}