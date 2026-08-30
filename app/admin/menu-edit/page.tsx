"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type OptionGroupKey =
  | "noodle"
  | "noodle_soup"
  | "rice_spicy"
  | "rice_no_spicy"
  | "fried_rice"
  | "rice_simple"
  | "crispy"
  | "no_main_protein"
  | "suki"
  | "simple_takeaway"
  | "none";

type MenuItem = {
  id: number;
  name: string;
  english_name: string | null;
  price: number;
  station: "noodle" | "rice" | "drink";
  is_active: boolean;
  option_group_key: OptionGroupKey | null;
};

export default function MenuEditPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<MenuItem | null>(null);

  const [name, setName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [price, setPrice] = useState("");
  const [station, setStation] =
    useState<"noodle" | "rice" | "drink">("rice");

  const [optionGroupKey, setOptionGroupKey] =
    useState<OptionGroupKey>("none");
    const [searchText, setSearchText] = useState("");
const [filterStation, setFilterStation] =
  useState<"all" | "noodle" | "rice" | "drink">("all");
  async function loadMenus() {
    setLoading(true);

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      alert("โหลดเมนูไม่สำเร็จ: " + error.message);
      setLoading(false);
      return;
    }

    setMenus((data || []) as MenuItem[]);
    setLoading(false);
  }

  useEffect(() => {
    loadMenus();
  }, []);

  function clearForm() {
    setEditing(null);
    setName("");
    setEnglishName("");
    setPrice("");
    setStation("rice");
    setOptionGroupKey("none");
  }

  function startEdit(menu: MenuItem) {
    setEditing(menu);
    setName(menu.name);
    setEnglishName(menu.english_name || "");
    setPrice(String(menu.price));
    setStation(menu.station);
    setOptionGroupKey(menu.option_group_key || "none");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveMenu() {
    if (!name.trim()) {
      alert("กรุณาใส่ชื่อเมนู");
      return;
    }

    if (price === "") {
      alert("กรุณาใส่ราคา");
      return;
    }

    if (Number(price) < 0) {
      alert("ราคาไม่ถูกต้อง");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: name.trim(),
          english_name: englishName.trim() || null,
          price: Number(price),
          station,
          option_group_key: optionGroupKey,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);

      if (error) {
        console.error(error);
        alert("แก้ไขเมนูไม่สำเร็จ: " + error.message);
        return;
      }

      alert("แก้ไขเมนูเรียบร้อย");
    } else {
      const nextId =
        menus.length > 0
          ? Math.max(...menus.map((menu) => menu.id)) + 1
          : 1;

      const { error } = await supabase
        .from("menu_items")
        .insert({
          id: nextId,
          name: name.trim(),
          english_name: englishName.trim() || null,
          price: Number(price),
          station,
          option_group_key: optionGroupKey,
          is_active: true,
        });

      if (error) {
        console.error(error);
        alert("เพิ่มเมนูไม่สำเร็จ: " + error.message);
        return;
      }

      alert("เพิ่มเมนูเรียบร้อย");
    }

    clearForm();
    loadMenus();
  }

  async function toggleActive(menu: MenuItem) {
    const { error } = await supabase
      .from("menu_items")
      .update({
        is_active: !menu.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", menu.id);

    if (error) {
      console.error(error);
      alert("เปลี่ยนสถานะไม่สำเร็จ: " + error.message);
      return;
    }

    loadMenus();
  }

  function getStationName(station: string) {
    if (station === "noodle") return "ก๋วยเตี๋ยว";
    if (station === "rice") return "ตามสั่ง";
    if (station === "drink") return "เครื่องดื่ม";
    return station;
  }

  function getOptionName(key: OptionGroupKey | null) {
    switch (key) {
      case "noodle":
        return "ก๋วยเตี๋ยวทั่วไป";
      case "noodle_soup":
        return "เกาเหลา / น้ำซุป";
      case "rice_spicy":
        return "ตามสั่งเผ็ด";
      case "rice_no_spicy":
        return "ตามสั่งไม่เผ็ด";
      case "fried_rice":
        return "ข้าวผัด";
      case "rice_simple":
        return "ผัดซีอิ๊ว / เมนูง่าย";
      case "crispy":
        return "ไก่กรอบ / หมูกรอบ";
      case "no_main_protein":
        return "ไม่เลือกเนื้อหลัก";
      case "suki":
        return "สุกี้";
      case "simple_takeaway":
        return "เมนูง่าย + กลับบ้าน";
      case "none":
      default:
        return "ไม่มีตัวเลือก";
    }
  }
  const filteredMenus = menus.filter((menu) => {
  const matchSearch =
    menu.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (menu.english_name || "")
      .toLowerCase()
      .includes(searchText.toLowerCase());

  const matchStation =
    filterStation === "all" ||
    menu.station === filterStation;

  return matchSearch && matchStation;
});
  return (
    <main className="min-h-screen bg-orange-50 p-4 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl bg-white p-4 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-orange-900">
        จัดการรายการเมนู
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        เพิ่มเมนู / แก้ชื่อ / แก้ราคา / เลือกชุดตัวเลือก
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <Link
        href="/pos"
        className="rounded-xl bg-gray-900 px-4 py-2 text-center text-sm font-bold text-white hover:bg-gray-800"
      >
        ← กลับ POS
      </Link>

      <Link
        href="/cashier"
        className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-blue-700"
      >
        กลับ Cashier
      </Link>
    </div>
  </div>

          <div className="mt-4 grid gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-bold">
                ชื่อเมนูไทย
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อเมนู"
                className="h-11 w-full rounded-xl border px-3 text-sm"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-bold">
                English
              </label>
              <input
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                placeholder="English name"
                className="h-11 w-full rounded-xl border px-3 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold">
                ราคา
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50"
                className="h-11 w-full rounded-xl border px-3 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold">
                หมวด / ครัว
              </label>
              <select
                value={station}
                onChange={(e) =>
                  setStation(
                    e.target.value as "noodle" | "rice" | "drink"
                  )
                }
                className="h-11 w-full rounded-xl border px-3 text-sm"
              >
                <option value="noodle">ก๋วยเตี๋ยว</option>
                <option value="rice">ตามสั่ง</option>
                <option value="drink">เครื่องดื่ม</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold">
                ชุดตัวเลือก
              </label>
              <select
                value={optionGroupKey}
                onChange={(e) =>
                  setOptionGroupKey(
                    e.target.value as OptionGroupKey
                  )
                }
                className="h-11 w-full rounded-xl border px-3 text-sm"
              >
                <option value="none">ไม่มีตัวเลือก</option>
                <option value="noodle">ก๋วยเตี๋ยวทั่วไป</option>
                <option value="noodle_soup">เกาเหลา / เลือกน้ำซุป</option>
                <option value="rice_spicy">ตามสั่งเผ็ด</option>
                <option value="rice_no_spicy">ตามสั่งไม่เผ็ด</option>
                <option value="fried_rice">ข้าวผัด</option>
                <option value="rice_simple">ผัดซีอิ๊ว / เมนูง่าย</option>
                <option value="crispy">ไก่กรอบ / หมูกรอบ</option>
                <option value="no_main_protein">
                  เมนูไม่ต้องเลือกเนื้อหลัก
                </option>
                <option value="suki">สุกี้</option>
                <option value="simple_takeaway">
                  เมนูง่าย + กลับบ้าน
                </option>
              </select>
            </div>

            <div className="md:col-span-12 flex flex-wrap gap-2 pt-1">
              <button
                onClick={saveMenu}
                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
              >
                {editing ? "บันทึกการแก้ไข" : "+ เพิ่มเมนู"}
              </button>

              {editing && (
                <button
                  onClick={clearForm}
                  className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
        </div>
              <div className="mb-4 grid gap-3 md:grid-cols-3">
  <input
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    placeholder="ค้นหาชื่อเมนู..."
    className="h-11 rounded-xl border bg-white px-3 md:col-span-2"
    
  />

  <select
    value={filterStation}
    onChange={(e) =>
      setFilterStation(
        e.target.value as
          | "all"
          | "noodle"
          | "rice"
          | "drink"
      )
    }
    className="h-11 rounded-xl bg-white border px-3"
  >
    <option value="all">ทุกหมวด</option>
    <option value="noodle">ก๋วยเตี๋ยว</option>
    <option value="rice">ตามสั่ง</option>
    <option value="drink">เครื่องดื่ม</option>
  </select>
</div>
        <div className="mt-4 rounded-2xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-orange-900">
              รายการเมนูทั้งหมด
            </h2>
            <p className="text-sm text-gray-500">
              เลื่อนดูได้ เห็น 3–4 เมนู
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl bg-orange-50 p-4 text-center text-sm">
              กำลังโหลด...
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto pr-1">
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
    {filteredMenus.map((menu) => (
      <div
        key={menu.id}
        className={`rounded-xl border p-3 shadow-sm ${
          menu.is_active
            ? "border-gray-200 bg-white"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex h-full flex-col justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-900">
              {menu.name}
            </p>

            {menu.english_name && (
              <p className="truncate text-xs text-gray-500">
                {menu.english_name}
              </p>
            )}

            <p className="mt-2 text-base font-bold text-orange-700">
              {menu.price} บาท
            </p>

            <div className="mt-2 flex flex-wrap gap-1">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {getStationName(menu.station)}
              </span>

              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                {getOptionName(menu.option_group_key)}
              </span>

              {!menu.is_active && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  เลิกขายแล้ว
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => startEdit(menu)}
              className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              แก้ไข
            </button>

            <button
              onClick={() => toggleActive(menu)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold text-white ${
                menu.is_active
                  ? "bg-red-500 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {menu.is_active ? "เลิกขาย" : "เปิด"}
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
          )}
        </div>
      </div>
    </main>
  );
}