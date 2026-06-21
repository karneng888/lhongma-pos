"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { menuItems, MenuItem, MenuOption } from "@/app/data/menu";

type Station = "noodle" | "rice" | "drink";

type OrderOption = {
  name: string;
  price: number;
  groupName?: string;
};

type SelectedOption = {
  id: string;
  name: string;
  price: number;
  groupId: string;
  groupName: string;
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
  paid_at?: string | null;
  receipt_no?: string | null;
  payment_method?: "cash" | "transfer" | null;
  cash_received?: number | null;
  change_amount?: number | null;
  created_at: string;
  options?: OrderOption[] | null;
  item_total?: number | null;
};

const getItemUnitPrice = (item: OrderItem) => {
  return Number(item.item_total || item.price);
};

export default function CashierPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash"
  );
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [addItemNote, setAddItemNote] = useState("");
  const [addItemQty, setAddItemQty] = useState(1);

  const [lastReceipt, setLastReceipt] = useState<{
    receiptNo: string;
    tableNo: string;
    items: OrderItem[];
    total: number;
    paymentMethod: "cash" | "transfer";
    cashReceived: number;
    changeAmount: number;
    paidAt: string;
  } | null>(null);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("paid", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      alert("โหลดบิลไม่สำเร็จ: " + error.message);
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
  }, []);

  const tables = useMemo(() => {
    const tableMap = new Map<string, OrderItem[]>();

    orders.forEach((order) => {
      if (!tableMap.has(order.table_no)) {
        tableMap.set(order.table_no, []);
      }

      tableMap.get(order.table_no)?.push(order);
    });

    return Array.from(tableMap.entries()).map(([tableNo, items]) => ({
      tableNo,
      items,
      total: items.reduce(
        (sum, item) => sum + getItemUnitPrice(item) * item.qty,
        0
      ),
    }));
  }, [orders]);

  const selectedItems =
    tables.find((table) => table.tableNo === selectedTable)?.items || [];

  const total = selectedItems.reduce(
    (sum, item) => sum + getItemUnitPrice(item) * item.qty,
    0
  );

  const changeAmount =
    paymentMethod === "cash" ? Math.max(cashReceived - total, 0) : 0;

  const addOptionTotal = selectedOptions.reduce(
    (sum, option) => sum + option.price,
    0
  );

  const addItemUnitTotal = selectedMenu ? selectedMenu.price + addOptionTotal : 0;

  const openAddItem = () => {
    if (!selectedTable) {
      alert("กรุณาเลือกโต๊ะก่อนค่ะ");
      return;
    }

    setIsAddItemOpen(true);
    setSelectedMenu(null);
    setSelectedOptions([]);
    setAddItemNote("");
    setAddItemQty(1);
  };

  const closeAddItem = () => {
    setIsAddItemOpen(false);
    setSelectedMenu(null);
    setSelectedOptions([]);
    setAddItemNote("");
    setAddItemQty(1);
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

  const addItemToTable = async () => {
    if (!selectedTable) {
      alert("กรุณาเลือกโต๊ะก่อนค่ะ");
      return;
    }

    if (!selectedMenu) {
      alert("กรุณาเลือกเมนูก่อนค่ะ");
      return;
    }

    const newOrder = {
      table_no: selectedTable,
      name: selectedMenu.name,
      price: selectedMenu.price,
      qty: addItemQty,
      note: addItemNote,
      station: selectedMenu.station,
      status: "new",
      paid: false,
      options: selectedOptions.map((option) => ({
        name: option.name,
        price: option.price,
        groupName: option.groupName,
      })),
      item_total: addItemUnitTotal,
    };

    const { error } = await supabase.from("orders").insert([newOrder]);

    if (error) {
      console.error(error);
      alert("เพิ่มรายการไม่สำเร็จ: " + error.message);
      return;
    }

    closeAddItem();
    await loadOrders();
  };

  const updateQty = async (item: OrderItem, newQty: number) => {
    if (newQty <= 0) {
      await deleteItem(item);
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ qty: newQty })
      .eq("id", item.id);

    if (error) {
      console.error(error);
      alert("แก้จำนวนไม่สำเร็จ: " + error.message);
      return;
    }

    await loadOrders();
  };

  const deleteItem = async (item: OrderItem) => {
    const confirmed = confirm(`ต้องการลบ "${item.name}" ออกจากบิลไหม?`);

    if (!confirmed) return;

    const { error } = await supabase.from("orders").delete().eq("id", item.id);

    if (error) {
      console.error(error);
      alert("ลบรายการไม่สำเร็จ: " + error.message);
      return;
    }

    await loadOrders();
  };

  const startEditNote = (item: OrderItem) => {
    setEditingNoteId(item.id);
    setNoteDraft(item.note || "");
  };

  const saveNote = async (itemId: number) => {
    const { error } = await supabase
      .from("orders")
      .update({ note: noteDraft })
      .eq("id", itemId);

    if (error) {
      console.error(error);
      alert("บันทึกหมายเหตุไม่สำเร็จ: " + error.message);
      return;
    }

    setEditingNoteId(null);
    setNoteDraft("");
    await loadOrders();
  };

  const payAndPrint = async () => {
    if (!selectedTable) {
      alert("กรุณาเลือกโต๊ะก่อนค่ะ");
      return;
    }

    if (selectedItems.length === 0) {
      alert("ไม่มีรายการอาหารในโต๊ะนี้ค่ะ");
      return;
    }

    if (paymentMethod === "cash" && cashReceived < total) {
      alert("รับเงินสดยังไม่พอค่ะ");
      return;
    }

    const receiptNo = `R${new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;

    const paidAt = new Date().toISOString();

    const { error } = await supabase
      .from("orders")
      .update({
        paid: true,
        paid_at: paidAt,
        receipt_no: receiptNo,
        payment_method: paymentMethod,
        cash_received: paymentMethod === "cash" ? cashReceived : total,
        change_amount: changeAmount,
      })
      .eq("table_no", selectedTable)
      .eq("paid", false);

    if (error) {
      console.error(error);
      alert("รับเงินไม่สำเร็จ: " + error.message);
      return;
    }

    setLastReceipt({
      receiptNo,
      tableNo: selectedTable,
      items: selectedItems,
      total,
      paymentMethod,
      cashReceived: paymentMethod === "cash" ? cashReceived : total,
      changeAmount,
      paidAt,
    });

    setTimeout(() => {
      window.print();
    }, 300);

    setSelectedTable("");
    setCashReceived(0);
    await loadOrders();
  };

  return (
    <main className="min-h-screen bg-orange-50 p-4">
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
        <div className="rounded-xl bg-white p-5 shadow">
          <h1 className="text-3xl font-bold text-orange-900">
            แคชเชียร์ ร้านหลงมา
          </h1>
          <p className="text-gray-500">
            เลือกโต๊ะ แก้ไขบิล เพิ่มรายการ รับเงิน และพิมพ์ใบเสร็จ
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-white p-5 shadow">
            <h2 className="text-2xl font-bold">โต๊ะที่เปิดบิล</h2>

            {isLoading ? (
              <p className="mt-4 text-gray-500">กำลังโหลดบิล...</p>
            ) : tables.length === 0 ? (
              <p className="mt-4 text-gray-500">ยังไม่มีบิลค้างชำระ</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {tables.map((table) => (
                  <button
                    key={table.tableNo}
                    onClick={() => {
                      setSelectedTable(table.tableNo);
                      setCashReceived(table.total);
                    }}
                    className={`rounded-xl border p-4 text-left hover:bg-orange-100 ${
                      selectedTable === table.tableNo
                        ? "border-orange-500 bg-orange-100"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between">
                      <p className="text-2xl font-bold">โต๊ะ {table.tableNo}</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {table.total}฿
                      </p>
                    </div>

                    <p className="mt-1 text-gray-500">
                      {table.items.length} รายการ
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-white p-5 shadow">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">รายละเอียดบิล</h2>

              {selectedTable && (
                <button
                  onClick={openAddItem}
                  className="rounded-xl bg-orange-600 px-4 py-2 font-bold text-white"
                >
                  + เพิ่มรายการ
                </button>
              )}
            </div>

            {!selectedTable ? (
              <p className="mt-4 text-gray-500">เลือกโต๊ะทางซ้ายก่อนค่ะ</p>
            ) : (
              <div className="mt-4">
                <p className="text-xl font-bold">โต๊ะ {selectedTable}</p>

                <div className="mt-4 space-y-4">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="rounded-xl border p-3">
                      <div className="flex justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold">
                            {item.name} x {item.qty}
                          </p>

                          {item.options && item.options.length > 0 && (
                            <div className="mt-1 text-sm text-gray-600">
                              {item.options.map((option, index) => (
                                <p key={index}>
                                  + {option.name}
                                  {option.price > 0
                                    ? ` ${option.price}฿`
                                    : ""}
                                </p>
                              ))}
                            </div>
                          )}

                          {editingNoteId === item.id ? (
                            <div className="mt-2">
                              <input
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                className="w-full rounded-lg border p-2 text-sm"
                                placeholder="แก้หมายเหตุ"
                              />

                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() => saveNote(item.id)}
                                  className="rounded-lg bg-green-600 px-3 py-1 text-sm font-bold text-white"
                                >
                                  บันทึก
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setNoteDraft("");
                                  }}
                                  className="rounded-lg bg-gray-100 px-3 py-1 text-sm"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {item.note && (
                                <p className="mt-1 text-sm text-gray-500">
                                  หมายเหตุ: {item.note}
                                </p>
                              )}

                              <button
                                onClick={() => startEditNote(item)}
                                className="mt-2 rounded-lg bg-gray-100 px-3 py-1 text-sm"
                              >
                                แก้หมายเหตุ
                              </button>
                            </>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="font-bold">
                            {getItemUnitPrice(item) * item.qty}฿
                          </p>

                          <div className="mt-2 flex gap-1">
                            <button
                              onClick={() => updateQty(item, item.qty - 1)}
                              className="rounded-lg bg-gray-100 px-3 py-1 font-bold"
                            >
                              -
                            </button>

                            <button
                              onClick={() => updateQty(item, item.qty + 1)}
                              className="rounded-lg bg-gray-100 px-3 py-1 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => deleteItem(item)}
                            className="mt-2 rounded-lg bg-red-100 px-3 py-1 text-sm font-bold text-red-700"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-between text-2xl font-bold">
                  <span>รวม</span>
                  <span>{total} บาท</span>
                </div>

                <div className="mt-6">
                  <p className="font-bold">ช่องทางชำระเงิน</p>

                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`flex-1 rounded-xl p-3 font-bold ${
                        paymentMethod === "cash"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      เงินสด
                    </button>

                    <button
                      onClick={() => {
                        setPaymentMethod("transfer");
                        setCashReceived(total);
                      }}
                      className={`flex-1 rounded-xl p-3 font-bold ${
                        paymentMethod === "transfer"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      โอน
                    </button>
                  </div>
                </div>

                {paymentMethod === "cash" && (
                  <div className="mt-5">
                    <label className="font-bold">รับเงินสด</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border p-4 text-2xl font-bold"
                    />

                    <div className="mt-3 flex justify-between text-xl font-bold">
                      <span>เงินทอน</span>
                      <span>{changeAmount} บาท</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={payAndPrint}
                  className="mt-6 w-full rounded-xl bg-green-600 p-4 text-xl font-bold text-white hover:bg-green-700"
                >
                  รับเงินและพิมพ์ใบเสร็จ
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center">
          <div className="mx-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow md:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  เพิ่มรายการ โต๊ะ {selectedTable}
                </h2>
                <p className="text-gray-500">
                  เลือกเมนู ใส่ตัวเลือก แล้วเพิ่มเข้าบิล
                </p>
              </div>

              <button
                onClick={closeAddItem}
                className="rounded-full bg-gray-100 px-3 py-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <h3 className="font-bold">เลือกเมนู</h3>

              <div className="mt-2 grid gap-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedMenu(item);
                      setSelectedOptions([]);
                      setAddItemNote("");
                      setAddItemQty(1);
                    }}
                    className={`flex justify-between rounded-xl border p-3 text-left ${
                      selectedMenu?.id === item.id
                        ? "border-orange-500 bg-orange-100"
                        : "bg-white"
                    }`}
                  >
                    <span className="font-bold">{item.name}</span>
                    <span>{item.price}฿</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedMenu && (
              <>
                {selectedMenu.optionGroups?.map((group) => (
                  <div key={group.id} className="mt-5">
                    <h3 className="text-lg font-bold">{group.name}</h3>
                    <p className="text-sm text-gray-500">
                      {group.type === "single"
                        ? "เลือกได้ 1 อย่าง"
                        : "เลือกได้หลายอย่าง"}
                    </p>

                    <div className="mt-2 grid gap-2">
                      {group.options.map((option) => {
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
                      })}
                    </div>
                  </div>
                ))}

                <div className="mt-5">
                  <h3 className="font-bold">หมายเหตุ</h3>
                  <input
                    value={addItemNote}
                    onChange={(e) => setAddItemNote(e.target.value)}
                    placeholder="เช่น ไม่ใส่ผัก / เผ็ดน้อย / ไม่ใส่น้ำตาล"
                    className="mt-2 w-full rounded-xl border p-3"
                  />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-bold">จำนวน</span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setAddItemQty((prev) => Math.max(prev - 1, 1))
                      }
                      className="rounded-lg bg-gray-100 px-4 py-2 font-bold"
                    >
                      -
                    </button>

                    <span className="text-xl font-bold">{addItemQty}</span>

                    <button
                      onClick={() => setAddItemQty((prev) => prev + 1)}
                      className="rounded-lg bg-gray-100 px-4 py-2 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex justify-between text-xl font-bold">
                  <span>รวมรายการนี้</span>
                  <span>{addItemUnitTotal * addItemQty} บาท</span>
                </div>

                <button
                  onClick={addItemToTable}
                  className="mt-5 w-full rounded-xl bg-orange-600 p-4 text-xl font-bold text-white hover:bg-orange-700"
                >
                  เพิ่มเข้าบิล
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {lastReceipt && (
        <div className="print-only font-mono text-sm">
          <div className="text-center">
            <h1 className="text-lg font-bold">หลงมา</h1>
            <p>ก๋วยเตี๋ยว / อาหารตามสั่ง</p>
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <p>ใบเสร็จเลขที่: {lastReceipt.receiptNo}</p>
          <p>โต๊ะ: {lastReceipt.tableNo}</p>
          <p>
            วันที่:{" "}
            {new Date(lastReceipt.paidAt).toLocaleString("th-TH", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>

          <div className="my-2 border-t border-dashed border-black" />

          {lastReceipt.items.map((item) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between">
                <span>
                  {item.name} x {item.qty}
                </span>
                <span>{getItemUnitPrice(item) * item.qty}</span>
              </div>

              {item.options && item.options.length > 0 && (
                <div>
                  {item.options.map((option, index) => (
                    <p key={index}>
                      + {option.name}
                      {option.price > 0 ? ` ${option.price}฿` : ""}
                    </p>
                  ))}
                </div>
              )}

              {item.note && <p>หมายเหตุ: {item.note}</p>}
            </div>
          ))}

          <div className="my-2 border-t border-dashed border-black" />

          <div className="flex justify-between font-bold">
            <span>รวมทั้งหมด</span>
            <span>{lastReceipt.total} บาท</span>
          </div>

          <div className="flex justify-between">
            <span>ชำระโดย</span>
            <span>
              {lastReceipt.paymentMethod === "cash" ? "เงินสด" : "โอน"}
            </span>
          </div>

          <div className="flex justify-between">
            <span>รับเงิน</span>
            <span>{lastReceipt.cashReceived} บาท</span>
          </div>

          {lastReceipt.paymentMethod === "cash" && (
            <div className="flex justify-between">
              <span>เงินทอน</span>
              <span>{lastReceipt.changeAmount} บาท</span>
            </div>
          )}

          <div className="my-2 border-t border-dashed border-black" />

          <p className="text-center">ขอบคุณค่ะ</p>
        </div>
      )}
    </main>
  );
}