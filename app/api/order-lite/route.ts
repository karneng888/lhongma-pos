import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { menuItems } from "@/app/data/menu";

async function getOrCreateActiveSessionId(tableNo: string) {
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
    return activeSession.id;
  }

  const { data: newSession, error: insertError } = await supabase
    .from("table_sessions")
    .insert({
      table_no: tableNo,
      status: "active",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return newSession.id;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const tableNo = String(formData.get("tableNo") || "");
    const itemId = Number(formData.get("itemId"));
    const qty = Math.max(1, Number(formData.get("qty") || 1));
    const note = String(formData.get("note") || "").trim();

    const menu = menuItems.find((item) => item.id === itemId);

    if (!tableNo || !menu) {
      return NextResponse.json(
        { error: "ข้อมูลโต๊ะหรือเมนูไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const selectedOptions: any[] = [];
    let optionTotal = 0;

    menu.optionGroups?.forEach((group) => {
      const selectedIds = formData.getAll(`option_${group.id}`).map(String);

      selectedIds.forEach((selectedId) => {
        const option = group.options.find((item) => item.id === selectedId);

        if (option) {
          selectedOptions.push({
            groupId: group.id,
            groupName: group.name,
            id: option.id,
            name: option.name,
            price: option.price,
            stockId: option.stockId || option.id,
          });

          optionTotal += option.price;
        }
      });
    });

    const unitPrice = menu.price + optionTotal;
    const itemTotal = unitPrice * qty;

    const sessionId = await getOrCreateActiveSessionId(tableNo);

    const { error } = await supabase.from("orders").insert({
      table_no: tableNo,
      name: menu.name,
      price: menu.price,
      qty,
      note,
      station: menu.station,
      status: "new",
      paid: false,
      options: selectedOptions,
      item_total: itemTotal,
      kitchen_printed: false,
      cashier_printed: false,
      session_id: sessionId,
      order_source: "customer",
    });

    if (error) {
      throw error;
    }

    return NextResponse.redirect(
      new URL(`/order-lite/${tableNo}`, request.url),
      303
    );
  } catch (error: any) {
    console.error("Order lite error:", error);

    return NextResponse.json(
      {
        error: "ส่งออเดอร์ไม่สำเร็จ",
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}