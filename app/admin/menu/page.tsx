"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { menuItems } from "@/app/data/menu";

type MenuStatus = {
  menu_id: number;
  is_available: boolean;
};

type Category = "all" | "noodle" | "rice" | "drink";

function getCategoryName(station: string) {
  if (station === "noodle") return "ก๋วยเตี๋ยว";
  if (station === "rice") return "ตามสั่ง";
  if (station === "drink") return "เครื่องดื่ม";
  return station;
}

export default function AdminMenuPage() {
  const [statuses, setStatuses] = useState<MenuStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [isAllowed, setIsAllowed] = useState(false);

  async function loadMenuStatus() {
    const { data, error } = await supabase
      .from("menu_status")
      .select("*")
      .order("menu_id", { ascending: true });

    if (error) {
      console.error(error);
      alert("โหลดสถานะเมนูไม่สำเร็จ: " + error.message);
      setLoading(false);
      return;
    }

    setStatuses(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMenuStatus();
  }, []);

  const statusMap = useMemo(() => {
    const map = new Map<number, boolean>();

    statuses.forEach((status) => {
      map.set(status.menu_id, status.is_available);
    });

    return map;
  }, [statuses]);

  useEffect(() => {
  const isLogin = sessionStorage.getItem("lhongma-admin-login");

  if (isLogin !== "yes") {
    window.location.href = "/login";
    return;
  }

  setIsAllowed(true);
}, []);

  const filteredMenuItems = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter((item) => item.station === activeCategory);
  }, [activeCategory]);

  async function toggleMenu(menuId: number) {
    const currentStatus = statusMap.get(menuId) ?? true;
    const newStatus = !currentStatus;

    const { error } = await supabase
      .from("menu_status")
      .upsert({
        menu_id: menuId,
        is_available: newStatus,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(error);
      alert("อัปเดตสถานะเมนูไม่สำเร็จ: " + error.message);
      return;
    }

    setStatuses((prev) => {
      const exists = prev.some((item) => item.menu_id === menuId);

      if (exists) {
        return prev.map((item) =>
          item.menu_id === menuId
            ? { ...item, is_available: newStatus }
            : item
        );
      }

      return [...prev, { menu_id: menuId, is_available: newStatus }];
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
                จัดการเมนู
              </h1>
              <p className="text-gray-500">
                เปิด/ปิดเมนูที่หมดชั่วคราว
              </p>
            </div>

            <Link
              href="/pos"
              className="rounded-xl bg-gray-900 px-4 py-3 text-center font-bold text-white hover:bg-gray-800"
            >
              กลับหน้าแผนผังโต๊ะ
            </Link>
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
            กำลังโหลดเมนู...
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {filteredMenuItems.map((item) => {
              const isAvailable = statusMap.get(item.id) ?? true;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 shadow ${
                    isAvailable
                      ? "border-green-200 bg-white"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xl font-bold">{item.name}</p>
                      <p className="text-gray-500">
                        {getCategoryName(item.station)} · {item.price} บาท
                      </p>
                    </div>

                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`rounded-xl px-5 py-3 font-bold ${
                        isAvailable
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {isAvailable ? "เปิดขาย" : "หมด / ปิดขาย"}
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
