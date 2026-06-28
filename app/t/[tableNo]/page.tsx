"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { menuItems, MenuItem, MenuOption } from "@/app/data/menu";
import { supabase } from "@/app/lib/supabase";

type SelectedOption = {
  id: string;
  name: string;
  price: number;
  groupId: string;
  groupName: string;
};

type CartItem = MenuItem & {
  cartId: string;
  qty: number;
  note: string;
  selectedOptions: SelectedOption[];
  itemTotal: number;
};

export default function TableOrderPage() {
  const params = useParams();
  const tableNo = String(params.tableNo);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "noodle" | "rice" | "drink">("all");
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [openOptionGroups, setOpenOptionGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionStatusMap, setOptionStatusMap] = useState<Map<string, boolean>>(
  new Map()
);

  const optionTotal = selectedOptions.reduce(
    (sum, option) => sum + option.price,
    0
  );

  const selectedItemTotal = selectedMenu ? selectedMenu.price + optionTotal : 0;

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.itemTotal * item.qty,
    0
  );
  const filteredMenuItems =
    activeCategory === "all"
     ? menuItems
     : menuItems.filter((item) => item.station === activeCategory);

  const openMenu = (item: MenuItem) => {
    setSelectedMenu(item);
    setSelectedOptions([]);
    setOpenOptionGroups({});
    setNote("");
    setQty(1);
  };

  const closeMenu = () => {
    setSelectedMenu(null);
    setSelectedOptions([]);
    setOpenOptionGroups({});
    setNote("");
    setQty(1);
  };

  const toggleOptionGroupOpen = (groupId: string) => {
    setOpenOptionGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isOptionSelected = (optionId: string) => {
    return selectedOptions.some((option) => option.id === optionId);
  };

  const toggleOption = (
    groupId: string,
    groupName: string,
    type: "single" | "multiple",
    option: MenuOption
  ) => {
    const selectedOption: SelectedOption = {
      id: option.id,
      name: option.name,
      price: option.price,
      groupId,
      groupName,
    };

    setSelectedOptions((prev) => {
      const alreadySelected = prev.some(
        (item) => item.groupId === groupId && item.id === option.id
      );

      if (type === "single") {
        if (alreadySelected) {
          return prev.filter((item) => item.groupId !== groupId);
        }

        return [
          ...prev.filter((item) => item.groupId !== groupId),
          selectedOption,
        ];
      }

      if (alreadySelected) {
        return prev.filter(
          (item) => !(item.groupId === groupId && item.id === option.id)
        );
      }

      return [...prev, selectedOption];
    });
  };

  const addSelectedMenuToCart = () => {
    if (!selectedMenu) return;
    const hasMainProtein = selectedMenu.optionGroups?.some(
    (group) => group.id === "main-protein"
  );

  const selectedMainProtein = selectedOptions.some(
    (option) => option.groupId === "main-protein"
  );

  if (hasMainProtein && !selectedMainProtein) {
    alert("กรุณาเลือกเนื้อสัตว์หลักก่อนค่ะ");
    return;
  }
    const newCartItem: CartItem = {
      ...selectedMenu,
      cartId: `${selectedMenu.id}-${Date.now()}`,
      qty,
      note,
      selectedOptions,
      itemTotal: selectedItemTotal,
    };

    setCart((prev) => [...prev, newCartItem]);
    closeMenu();
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateCartQty = (cartId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, qty: newQty } : item
      )
    );
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert("กรุณาเลือกเมนูก่อนค่ะ");
      return;
    }

    setIsSubmitting(true);

    const newOrders = cart.map((item) => ({
      table_no: tableNo,
      name: item.name,
      price: item.price,
      qty: item.qty,
      note: item.note,
      station: item.station,
      status: "new",
      paid: false,
      options: item.selectedOptions.map((option) => ({
        name: option.name,
        price: option.price,
        groupName: option.groupName,
      })),
      item_total: item.itemTotal,
    }));

    const { error } = await supabase.from("orders").insert(newOrders);

    setIsSubmitting(false);

    if (error) {
      console.error(error);
      alert("ส่งออเดอร์ไม่สำเร็จ: " + error.message);
      return;
    }

    alert("ส่งออเดอร์เรียบร้อยค่ะ");
    setCart([]);
  };
  const loadOptionStatus = async () => {
  const { data, error } = await supabase
    .from("option_status")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const map = new Map<string, boolean>();

  (data || []).forEach((item) => {
    map.set(item.option_id, item.is_available);
  });

  setOptionStatusMap(map);
};

useEffect(() => {
  loadOptionStatus();
}, []);
  return (
    <main className="min-h-screen bg-orange-50 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl bg-white p-5 shadow">
          <h1 className="text-3xl font-bold text-orange-900">ร้านหลงมา</h1>
          <p className="mt-1 text-lg text-gray-700">โต๊ะ {tableNo}</p>
          <p className="text-sm text-gray-500">
            เลือกเมนู ใส่ตัวเลือก แล้วกดยืนยันออเดอร์
          </p>
        </div>

        <h2 className="mt-6 text-2xl font-bold">เมนูอาหาร</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
  {[
    { id: "all", label: "ทั้งหมด" },
    { id: "noodle", label: "ก๋วยเตี๋ยว" },
    { id: "rice", label: "ตามสั่ง" },
    { id: "drink", label: "เครื่องดื่ม" },
  ].map((category) => (
    <button
      key={category.id}
      onClick={() =>
        setActiveCategory(
          category.id as "all" | "noodle" | "rice" | "drink"
        )
      }
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

        <div className="mt-4 grid gap-3">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => openMenu(item)}
              className="flex items-center justify-between rounded-xl bg-white p-4 text-left shadow hover:bg-orange-100"
            >
              <div>
                <p className="text-lg font-bold">{item.name}</p>
                <p className="text-sm text-gray-500">
                  หมวด:{" "}
                  {item.station === "noodle"
                    ? "ก๋วยเตี๋ยว"
                    : item.station === "rice"
                    ? "ตามสั่ง"
                    : "เครื่องดื่ม"}
                </p>
              </div>

              <p className="text-xl font-bold text-orange-700">
                {item.price}฿
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-white p-5 shadow">
          <h2 className="text-2xl font-bold">ตะกร้าออเดอร์</h2>

          {cart.length === 0 ? (
            <p className="mt-3 text-gray-500">ยังไม่มีรายการ</p>
          ) : (
            <div className="mt-4 space-y-4">
              {cart.map((item) => (
                <div key={item.cartId} className="border-b pb-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        {item.name} x {item.qty}
                      </p>

                      {item.selectedOptions.length > 0 && (
                        <div className="mt-1 text-sm text-gray-600">
                          {item.selectedOptions.map((option) => (
                            <p key={`${item.cartId}-${option.groupId}-${option.id}`}>
                              + {option.name}
                              {option.price > 0 ? ` ${option.price}฿` : ""}
                            </p>
                          ))}
                        </div>
                      )}

                      {item.note && (
                        <p className="mt-1 text-sm text-gray-500">
                          หมายเหตุ: {item.note}
                        </p>
                      )}

                      <p className="mt-1 font-bold text-orange-700">
                        {item.itemTotal * item.qty} บาท
                      </p>
                    </div>

                    <div className="flex h-fit gap-2">
                      <button
                        onClick={() => updateCartQty(item.cartId, item.qty - 1)}
                        className="rounded-lg bg-gray-100 px-3 py-1 font-bold"
                      >
                        -
                      </button>

                      <button
                        onClick={() => updateCartQty(item.cartId, item.qty + 1)}
                        className="rounded-lg bg-gray-100 px-3 py-1 font-bold"
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="rounded-lg bg-red-100 px-3 py-1 text-red-700"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between text-xl font-bold">
                <span>รวม</span>
                <span>{cartTotal} บาท</span>
              </div>

              <button
                onClick={submitOrder}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-orange-600 p-4 text-xl font-bold text-white hover:bg-orange-700 disabled:bg-gray-400"
              >
                {isSubmitting ? "กำลังส่งออเดอร์..." : "ยืนยันออเดอร์"}
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center">
          <div className="mx-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow md:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedMenu.name}</h2>
                <p className="text-gray-500">
                  ราคาเริ่มต้น {selectedMenu.price} บาท
                </p>
              </div>

              <button
                onClick={closeMenu}
                className="rounded-full bg-gray-100 px-3 py-1 font-bold"
              >
                ✕
              </button>
            </div>

            {selectedMenu.optionGroups?.map((group) => {
              const isOpen = openOptionGroups[group.id] || false;

              const selectedInGroup = selectedOptions.filter(
                (option) => option.groupId === group.id
              );

              const selectedText =
                selectedInGroup.length > 0
                  ? selectedInGroup.map((option) => option.name).join(", ")
                  : "ยังไม่ได้เลือก";

              const availableOptions = group.options.filter(
                (option) =>
                  optionStatusMap.get(option.stockId || option.id) !== false
              );

              return (
                <div key={group.id} className="mt-4 rounded-2xl border bg-white">
                  <button
                    type="button"
                    onClick={() => toggleOptionGroupOpen(group.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left"
                  >
                    <div>
                      <h3 className="text-lg font-bold">{group.name}</h3>
                      <p className="text-sm text-gray-500">
                        {group.type === "single"
                          ? "เลือกได้ 1 อย่าง"
                          : "เลือกได้หลายอย่าง"}
                      </p>
                      <p
                        className={`mt-1 text-sm ${
                          selectedInGroup.length > 0
                            ? "font-bold text-orange-700"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedText}
                      </p>
                    </div>

                    <span className="text-2xl font-bold text-orange-700">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="grid gap-2 border-t p-3">
                      {availableOptions.length === 0 ? (
                        <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                          ตัวเลือกในหมวดนี้หมดค่ะ
                        </p>
                      ) : (
                        availableOptions.map((option) => {
                          const selected = isOptionSelected(option.id);

                          return (
                            <button
                              key={option.id}
                              onClick={() =>
                                toggleOption(
                                  group.id,
                                  group.name,
                                  group.type,
                                  option
                                )
                              }
                              className={`flex justify-between rounded-xl border p-3 text-left ${
                                selected
                                  ? "border-orange-500 bg-orange-100"
                                  : "bg-white"
                              }`}
                            >
                              <span className="font-bold">{option.name}</span>
                              <span>
                                {option.price > 0 ? `+${option.price}฿` : "ฟรี"}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-5">
              <h3 className="font-bold">หมายเหตุ</h3>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ไม่ใส่ผัก / เผ็ดน้อย / ไม่ใส่น้ำตาล"
                className="mt-2 w-full rounded-xl border p-3"
              />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-bold">จำนวน</span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((prev) => Math.max(prev - 1, 1))}
                  className="rounded-lg bg-gray-100 px-4 py-2 font-bold"
                >
                  -
                </button>

                <span className="text-xl font-bold">{qty}</span>

                <button
                  onClick={() => setQty((prev) => prev + 1)}
                  className="rounded-lg bg-gray-100 px-4 py-2 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-5 flex justify-between text-xl font-bold">
              <span>รวมรายการนี้</span>
              <span>{selectedItemTotal * qty} บาท</span>
            </div>

            <button
              onClick={addSelectedMenuToCart}
              className="mt-5 w-full rounded-xl bg-orange-600 p-4 text-xl font-bold text-white hover:bg-orange-700"
            >
              เพิ่มลงตะกร้า
            </button>
          </div>
        </div>
      )}
    </main>
  );
}