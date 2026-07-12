"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { menuItems, MenuItem, MenuOption } from "@/app/data/menu";

type Station = "noodle" | "rice" | "drink";
type AddMenuCategory = "noodle" | "rice" | "drink";

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
type CustomMenuItem = {
  id: number;
  name: string;
  price: number;
  station: Station;
  note?: string | null;
  is_active: boolean;
};
type OrderItem = {
  id: number;
  table_no: string;
  session_id?: string | null;
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
  order_source?: "customer" | "cashier" | null;
  kitchen_printed?: boolean | null;
};

const getItemUnitPrice = (item: OrderItem) => {
  return Number(item.item_total || item.price);
};

function getTableName(tableNo: string) {
  if (tableNo.startsWith("takeaway-")) {
    const billNo = tableNo.replace("takeaway-", "");
    return `กลับบ้าน ${billNo}`;
  }

  if (tableNo === "takeaway") return "กลับบ้าน";
  return `โต๊ะ ${tableNo}`;
}

async function getOrCreateActiveSessionId(tableNo: string) {
  if (!tableNo || tableNo.startsWith("takeaway-") || tableNo === "takeaway") {
    return null;
  }

  const { data: activeSession, error: selectError } = await supabase
    .from("table_sessions")
    .select("id")
    .eq("table_no", tableNo)
    .eq("status", "active")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (activeSession?.id) {
    return activeSession.id as string;
  }

  const { data: newSession, error: insertError } = await supabase
    .from("table_sessions")
    .insert([{ table_no: tableNo, status: "active" }])
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return newSession.id as string;
}

async function closeAndCreateNewSession(tableNo: string) {
  if (!tableNo || tableNo.startsWith("takeaway-") || tableNo === "takeaway") {
    return;
  }

  const now = new Date().toISOString();

  const { error: closeError } = await supabase
    .from("table_sessions")
    .update({
      status: "closed",
      closed_at: now,
    })
    .eq("table_no", tableNo)
    .eq("status", "active");

  if (closeError) {
    throw closeError;
  }

  const { error: insertError } = await supabase
    .from("table_sessions")
    .insert([{ table_no: tableNo, status: "active" }]);

  if (insertError) {
    throw insertError;
  }
}

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
  const [isAddMenuListOpen, setIsAddMenuListOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [openOptionGroups, setOpenOptionGroups] = useState<Record<string, boolean>>(
  {}
);
  const [addItemNote, setAddItemNote] = useState("");
  const [addItemQty, setAddItemQty] = useState(1);

  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemStation, setCustomItemStation] = useState<Station>("rice");
  const [customItemNote, setCustomItemNote] = useState("");
  const [customMenuItems, setCustomMenuItems] = useState<CustomMenuItem[]>([]);
  const [rememberCustomItem, setRememberCustomItem] = useState(false);
  const [isMoveTableOpen, setIsMoveTableOpen] = useState(false);
  const [targetTable, setTargetTable] = useState("");

  const [activeAddCategory, setActiveAddCategory] =
    useState<AddMenuCategory>("noodle");

  const [optionStatusMap, setOptionStatusMap] = useState<
    Map<string, boolean>
  >(new Map());

  
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

  const loadOptionStatus = async () => {
    const { data, error } = await supabase.from("option_status").select("*");

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
  const loadCustomMenuItems = async () => {
  const { data, error } = await supabase
    .from("custom_menu_items")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setCustomMenuItems((data || []) as CustomMenuItem[]);
};
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableFromUrl = params.get("table");

    if (tableFromUrl) {
      setSelectedTable(tableFromUrl);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadOptionStatus();
    loadCustomMenuItems();

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

  useEffect(() => {
    if (selectedTable && total > 0 && paymentMethod === "cash") {
      setCashReceived(total);
    }
  }, [selectedTable, total, paymentMethod]);

  const changeAmount =
    paymentMethod === "cash" ? Math.max(cashReceived - total, 0) : 0;

  const addOptionTotal = selectedOptions.reduce(
    (sum, option) => sum + option.price,
    0
  );

  const addItemUnitTotal = selectedMenu
    ? selectedMenu.price + addOptionTotal
    : 0;

  const filteredAddMenuItems = useMemo(() => {
    return menuItems.filter((item) => item.station === activeAddCategory);
  }, [activeAddCategory]);

  const openAddItem = () => {
    if (!selectedTable) {
      alert("กรุณาเลือกโต๊ะก่อนค่ะ");
      return;
    }

    setIsAddItemOpen(true);
    setIsAddMenuListOpen(true);
    setSelectedMenu(null);
    setSelectedOptions([]);
    setAddItemNote("");
    setAddItemQty(1);
    setActiveAddCategory("noodle");
  };

  const closeAddItem = () => {
    setIsAddItemOpen(false);
    setIsAddMenuListOpen(true);
    setSelectedMenu(null);
    setSelectedOptions([]);
    setAddItemNote("");
    setAddItemQty(1);
  };

  const openCustomItem = () => {
    if (!selectedTable) {
      alert("กรุณาเลือกโต๊ะก่อนค่ะ");
      return;
    }

    setIsCustomItemOpen(true);
    setCustomItemName("");
    setCustomItemPrice(0);
    setCustomItemQty(1);
    setCustomItemStation("rice");
    setCustomItemNote("");
    setRememberCustomItem(false);
  };

  const closeCustomItem = () => {
    setIsCustomItemOpen(false);
    setCustomItemName("");
    setCustomItemPrice(0);
    setCustomItemQty(1);
    setCustomItemStation("rice");
    setCustomItemNote("");
    setRememberCustomItem(false);
  };

  const openMoveTable = () => {
    if (!selectedTable) {
      alert("กรุณาเลือกโต๊ะก่อนค่ะ");
      return;
    }

    setTargetTable("");
    setIsMoveTableOpen(true);
  };

  const closeMoveTable = () => {
    setIsMoveTableOpen(false);
    setTargetTable("");
  };

  const moveTable = async () => {
    if (!selectedTable) {
      alert("กรุณาเลือกโต๊ะก่อนค่ะ");
      return;
    }

    if (!targetTable.trim()) {
      alert("กรุณาใส่เลขโต๊ะปลายทางค่ะ");
      return;
    }

    const newTableNo = targetTable.trim();

    if (newTableNo === selectedTable) {
      alert("โต๊ะปลายทางเป็นโต๊ะเดิมค่ะ");
      return;
    }

    const confirmed = confirm(
      `ต้องการย้าย ${getTableName(selectedTable)} ไปเป็น ${getTableName(
        newTableNo
      )} ใช่ไหม?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("orders")
      .update({ table_no: newTableNo })
      .eq("table_no", selectedTable)
      .eq("paid", false);

    if (error) {
      console.error(error);
      alert("ย้ายโต๊ะไม่สำเร็จ: " + error.message);
      return;
    }

    setSelectedTable(newTableNo);
    closeMoveTable();
    await loadOrders();
  };
    const selectSavedCustomItem = (item: CustomMenuItem) => {
  setCustomItemName(item.name);
  setCustomItemPrice(Number(item.price));
  setCustomItemStation(item.station);
  setCustomItemNote(item.note || "");
  };
  const addCustomItemToTable = async () => {
    if (!selectedTable) {
      alert("กรุณาเลือกโต๊ะก่อนค่ะ");
      return;
    }

    if (!customItemName.trim()) {
      alert("กรุณาใส่ชื่อรายการค่ะ");
      return;
    }

    if (customItemPrice < 0) {
      alert("ราคาต้องไม่ติดลบค่ะ");
      return;
    }

    let activeSessionId: string | null = null;

    try {
      activeSessionId = await getOrCreateActiveSessionId(selectedTable);
    } catch (error: any) {
      console.error(error);
      alert("เปิดรอบโต๊ะไม่สำเร็จ: " + error.message);
      return;
    }

    const newOrder = {
      table_no: selectedTable,
      session_id: activeSessionId,
      name: customItemName.trim(),
      price: customItemPrice,
      qty: customItemQty,
      note: customItemNote,
      station: customItemStation,
      status: "new",
      paid: false,
      options: [],
      item_total: customItemPrice,
      order_source: "cashier",
      kitchen_printed: true,
    };

    const { error } = await supabase.from("orders").insert([newOrder]);

    if (error) {
      console.error(error);
      alert("เพิ่มรายการเองไม่สำเร็จ: " + error.message);
      return;
    }
      if (rememberCustomItem) {
  const alreadyExists = customMenuItems.some(
    (item) =>
      item.name.trim() === customItemName.trim() &&
      Number(item.price) === Number(customItemPrice) &&
      item.station === customItemStation
  );

  if (!alreadyExists) {
    const { error: saveError } = await supabase
      .from("custom_menu_items")
      .insert([
        {
          name: customItemName.trim(),
          price: customItemPrice,
          station: customItemStation,
          note: customItemNote || null,
          is_active: true,
        },
      ]);

    if (saveError) {
      console.error(saveError);
      alert("เพิ่มรายการเข้าบิลแล้ว แต่บันทึกเมนูไว้ใช้ครั้งหน้าไม่สำเร็จค่ะ");
    } else {
      await loadCustomMenuItems();
    }
  }
}
    closeCustomItem();
    await loadOrders();
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

  if (type === "single") {
    setOpenOptionGroups((prev) => ({
      ...prev,
      [groupId]: false,
    }));
  }
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

    let activeSessionId: string | null = null;

    try {
      activeSessionId = await getOrCreateActiveSessionId(selectedTable);
    } catch (error: any) {
      console.error(error);
      alert("เปิดรอบโต๊ะไม่สำเร็จ: " + error.message);
      return;
    }

    const newOrder = {
      table_no: selectedTable,
      session_id: activeSessionId,
      name: selectedMenu.name,
      price: selectedMenu.price,
      qty: addItemQty,
      note: addItemNote,
      station: selectedMenu.station,
      status: "new",
      paid: false,
      order_source: "cashier",
      kitchen_printed: true,
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

    setSelectedMenu(null);
    setIsAddMenuListOpen(false);
    setSelectedOptions([]);
    setOpenOptionGroups({});
    setAddItemNote("");
    setAddItemQty(1);
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
    const sendCashierItemsToKitchen = async () => {
  if (!selectedTable) {
    alert("กรุณาเลือกโต๊ะก่อนค่ะ");
    return;
  }

  const cashierItems = selectedItems.filter(
    (item) => item.order_source === "cashier" && item.kitchen_printed === true
  );

  if (cashierItems.length === 0) {
    alert("ยังไม่มีรายการที่แคชเชียร์เพิ่มเองรอส่งเข้าครัวค่ะ");
    return;
  }

  const confirmed = confirm(
    `ต้องการส่งรายการที่แคชเชียร์เพิ่มเอง ${cashierItems.length} รายการ ของ ${getTableName(
      selectedTable
    )} เข้าครัวใช่ไหม?`
  );

  if (!confirmed) return;

  const cashierItemIds = cashierItems.map((item) => item.id);

  const { error } = await supabase
    .from("orders")
    .update({ kitchen_printed: false })
    .in("id", cashierItemIds);

  if (error) {
    console.error(error);
    alert("ส่งเข้าครัวไม่สำเร็จ: " + error.message);
    return;
  }

  alert(`ส่งรายการเข้าครัวแล้ว ${cashierItems.length} รายการค่ะ`);
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

    try {
      await closeAndCreateNewSession(selectedTable);
    } catch (sessionError: any) {
      console.error(sessionError);
      alert(
        "รับเงินสำเร็จแล้ว แต่เปิดรอบโต๊ะใหม่ไม่สำเร็จ: " +
          sessionError.message
      );
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

    setTimeout(() => {
      window.location.href = "/pos";
    }, 800);
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-900">
                แคชเชียร์ ร้านหลงมา
              </h1>
              <p className="text-gray-500">
                เลือกโต๊ะ แก้ไขบิล เพิ่มรายการ รับเงิน และพิมพ์ใบเสร็จ
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
                      <p className="text-2xl font-bold">
                        {getTableName(table.tableNo)}
                      </p>
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
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={openAddItem}
                    className="rounded-xl bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700"
                  >
                    + เพิ่มเมนู
                  </button>

                  <button
                    onClick={openCustomItem}
                    className="min-w-[140px] rounded-xl bg-yellow-400 px-4 py-3 font-bold text-gray-950 shadow hover:bg-yellow-500"
                  >
                    + รายการเอง
                  </button>

                  <button
                    onClick={openMoveTable}
                    className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow hover:bg-blue-700"
                  >
                    ย้ายโต๊ะ
                  </button>
                </div>
              )}
            </div>

            {!selectedTable ? (
              <p className="mt-4 text-gray-500">เลือกโต๊ะทางซ้ายก่อนค่ะ</p>
            ) : (
              <div className="mt-4">
                <p className="text-xl font-bold">
                  {getTableName(selectedTable)}
                </p>

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
              onClick={sendCashierItemsToKitchen}
              className="mt-6 w-full rounded-xl bg-purple-600 p-4 text-xl font-bold text-white hover:bg-purple-700"
              >
              ส่งรายการที่เพิ่มเองเข้าครัว
              </button>
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
                  เพิ่มรายการ {getTableName(selectedTable)}
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
            <div className="mt-4 rounded-2xl bg-purple-50 p-3">
  <p className="mb-2 text-sm font-bold text-purple-900">
    เพิ่มเมนูให้ครบก่อน แล้วค่อยส่งเข้าครัว
  </p>

  <button
    onClick={sendCashierItemsToKitchen}
    className="w-full rounded-xl bg-purple-600 p-4 text-lg font-bold text-white hover:bg-purple-700"
  >
    ส่งรายการที่เพิ่มเองเข้าครัว
  </button>
</div>
            {isAddMenuListOpen ? (
              <div className="mt-5">
                <h3 className="font-bold">เลือกหมวดเมนู</h3>

                <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                  {[
                    { id: "noodle", label: "ก๋วยเตี๋ยว" },
                    { id: "rice", label: "ตามสั่ง" },
                    { id: "drink", label: "เครื่องดื่ม" },
                  ].map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveAddCategory(category.id as AddMenuCategory);
                        setSelectedMenu(null);
                        setSelectedOptions([]);
                        setOpenOptionGroups({});
                        setAddItemNote("");
                        setAddItemQty(1);
                      }}
                      className={`whitespace-nowrap rounded-full px-4 py-2 font-bold ${
                        activeAddCategory === category.id
                          ? "bg-orange-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                <h3 className="mt-4 font-bold">เลือกเมนู</h3>

                <div className="mt-2 grid gap-2">
                  {filteredAddMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedMenu(item);
                        setIsAddMenuListOpen(false);
                        setSelectedOptions([]);
                        setOpenOptionGroups({});
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

                      {item.englishName && (
                        <p className="mt-1 text-xs font-medium text-gray-500">
                          {item.englishName}
                        </p>
                      )}

                      <span>{item.price}฿</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-orange-300 bg-orange-50 p-4">
                {selectedMenu ? (
                  <>
                    <p className="text-sm font-bold text-orange-800">
                      เมนูที่เลือก
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold">{selectedMenu.name}</p>
                        {selectedMenu.englishName && (
                          <p className="text-xs text-gray-500">
                            {selectedMenu.englishName}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-orange-700">
                        {selectedMenu.price}฿
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="font-bold text-gray-600">
                    เลือกเมนูเพิ่มได้เลยค่ะ
                  </p>
                )}

                <button
                  onClick={() => setIsAddMenuListOpen(true)}
                  className="mt-3 w-full rounded-xl bg-white p-3 font-bold text-orange-700 shadow"
                >
                  เปลี่ยน / เลือกเมนูเพิ่ม
                </button>
              </div>
            )}

            {selectedMenu && (
              <>
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
                                    {option.price > 0
                                      ? `+${option.price}฿`
                                      : "ฟรี"}
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
                  เพิ่มเข้าบิล ยังไม่ปริ้น
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isCustomItemOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center">
          <div className="mx-auto w-full max-w-xl rounded-t-2xl bg-white p-5 shadow md:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  เพิ่มรายการเอง {getTableName(selectedTable)}
                </h2>
                <p className="text-gray-500">
                  ใช้สำหรับเมนูพิเศษ / ลูกค้าสั่งนอกเมนู / คิดราคาเอง
                </p>
              </div>

              <button
                onClick={closeCustomItem}
                className="rounded-full bg-gray-100 px-3 py-1 font-bold"
              >
                ✕
              </button>
            </div>
            {customMenuItems.length > 0 && (
  <div className="mt-5">
    <h3 className="font-bold">รายการที่เคยใช้</h3>

    <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
      {customMenuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => selectSavedCustomItem(item)}
          className="whitespace-nowrap rounded-xl bg-orange-100 px-4 py-3 text-left font-bold text-orange-900"
        >
          <span className="block">{item.name}</span>
          <span className="block text-sm text-orange-700">
            {Number(item.price)} บาท ·{" "}
            {item.station === "rice"
              ? "ตามสั่ง"
              : item.station === "noodle"
              ? "ก๋วยเตี๋ยว"
              : "เครื่องดื่ม"}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
            <div className="mt-5">
              <label className="font-bold">ชื่อรายการ</label>
              <input
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="เช่น ข้าวกะเพราหมูกรอบ + ไก่กรอบ"
                className="mt-2 w-full rounded-xl border p-3"
              />
            </div>

            <div className="mt-4">
              <label className="font-bold">ราคา</label>
              <input
                type="number"
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border p-3 text-xl font-bold"
              />
            </div>

            <div className="mt-4">
              <label className="font-bold">ส่งเข้าครัวไหน</label>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { id: "rice", label: "ตามสั่ง" },
                  { id: "noodle", label: "ก๋วยเตี๋ยว" },
                  { id: "drink", label: "เครื่องดื่ม" },
                ].map((station) => (
                  <button
                    key={station.id}
                    onClick={() =>
                      setCustomItemStation(station.id as Station)
                    }
                    className={`rounded-xl p-3 font-bold ${
                      customItemStation === station.id
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {station.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="font-bold">หมายเหตุ</label>
              <input
                value={customItemNote}
                onChange={(e) => setCustomItemNote(e.target.value)}
                placeholder="เช่น ไม่ใส่ผัก / แยกน้ำ / เผ็ดน้อย"
                className="mt-2 w-full rounded-xl border p-3"
              />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-bold">จำนวน</span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setCustomItemQty((prev) => Math.max(prev - 1, 1))
                  }
                  className="rounded-lg bg-gray-100 px-4 py-2 font-bold"
                >
                  -
                </button>

                <span className="text-xl font-bold">{customItemQty}</span>

                <button
                  onClick={() => setCustomItemQty((prev) => prev + 1)}
                  className="rounded-lg bg-gray-100 px-4 py-2 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-5 flex justify-between text-xl font-bold">
              <span>รวมรายการนี้</span>
              <span>{customItemPrice * customItemQty} บาท</span>
            </div>
                  <label className="mt-5 flex items-center gap-3 rounded-xl bg-gray-50 p-3 font-bold">
  <input
    type="checkbox"
    checked={rememberCustomItem}
    onChange={(e) => setRememberCustomItem(e.target.checked)}
    className="h-5 w-5"
  />
  <span>จำเมนูนี้ไว้ใช้ครั้งหน้า</span>
</label>
            <button
              onClick={addCustomItemToTable}
              className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-gray-950 shadow hover:bg-yellow-500"
            >
              เพิ่มรายการเองเข้าบิล
            </button>
          </div>
        </div>
      )}

      {isMoveTableOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center">
          <div className="mx-auto w-full max-w-md rounded-t-2xl bg-white p-5 shadow md:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">ย้ายโต๊ะ</h2>
                <p className="text-gray-500">
                  ย้ายบิลจาก {getTableName(selectedTable)} ไปโต๊ะใหม่
                </p>
              </div>

              <button
                onClick={closeMoveTable}
                className="rounded-full bg-gray-100 px-3 py-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <label className="font-bold">เลขโต๊ะปลายทาง</label>
              <input
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                placeholder="เช่น 5 หรือ takeaway-123456"
                className="mt-2 w-full rounded-xl border p-4 text-2xl font-bold"
              />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                (tableNo) => (
                  <button
                    key={tableNo}
                    onClick={() => setTargetTable(tableNo)}
                    className={`rounded-xl p-3 font-bold ${
                      targetTable === tableNo
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    โต๊ะ {tableNo}
                  </button>
                )
              )}
            </div>

            <button
              onClick={moveTable}
              className="mt-5 w-full rounded-xl bg-blue-600 p-4 text-xl font-bold text-white hover:bg-blue-700"
            >
              ยืนยันย้ายโต๊ะ
            </button>
          </div>
        </div>
      )}

      {lastReceipt && (
  <div className="print-only font-mono text-[12px] leading-tight">
    <div className="text-center">
      <h1 className="text-xl font-bold">หลงมา</h1>
      <p>ก๋วยเตี๋ยว / อาหารตามสั่ง</p>
      <p>ขอบคุณที่อุดหนุนค่ะ</p>
    </div>

    <div className="my-2 border-t border-dashed border-black" />

    <div className="space-y-1">
      <p>ใบเสร็จ: {lastReceipt.receiptNo}</p>
      <p>โต๊ะ/บิล: {getTableName(lastReceipt.tableNo)}</p>
      <p>
        วันที่:{" "}
        {new Date(lastReceipt.paidAt).toLocaleString("th-TH", {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </p>
    </div>

    <div className="my-2 border-t border-dashed border-black" />

    <div className="space-y-2">
      {lastReceipt.items.map((item) => {
        const unitPrice = getItemUnitPrice(item);
        const lineTotal = unitPrice * item.qty;

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

            {item.options && item.options.length > 0 && (
              <div className="ml-2 mt-1">
                {item.options.map((option, index) => (
                  <p key={index}>
                    - {option.name}
                    
                  </p>
                ))}
              </div>
            )}

            {item.note && (
              <p className="ml-2 mt-1">* หมายเหตุ: {item.note}</p>
            )}
          </div>
        );
      })}
    </div>

    <div className="my-2 border-t border-dashed border-black" />

    <div className="space-y-1">
      <div className="flex justify-between text-base font-bold">
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