require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const os = require("os");
const path = require("path");
const PDFDocument = require("pdfkit");
const { print } = require("pdf-to-printer");

// ชื่อเครื่องปริ้น ต้องตรงกับชื่อใน Windows เป๊ะ ๆ
const PRINTER_NAME = "XP-80C";

// เช็กออเดอร์ทุกกี่วินาที
const CHECK_EVERY_MS = 7000;

// ขนาดกระดาษ 80mm หน่วยเป็น point
const PAPER_WIDTH = 226;
const PAPER_HEIGHT = 1400;

// ปรับตำแหน่งซ้าย-ขวาตรงนี้
// ถ้ายังเอียงขวา ให้ลด LEFT_MARGIN หรือเพิ่ม RIGHT_MARGIN
// ถ้าเอียงซ้ายเกิน ให้เพิ่ม LEFT_MARGIN หรือลด RIGHT_MARGIN
const LEFT_MARGIN = 4;
const RIGHT_MARGIN = 50;
const CONTENT_WIDTH = PAPER_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;

// ฟอนต์ไทยใน Windows
const THAI_FONT = "C:\\Windows\\Fonts\\tahoma.ttf";
const THAI_FONT_BOLD = "C:\\Windows\\Fonts\\tahomabd.ttf";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ไม่เจอ Supabase URL หรือ ANON KEY ใน .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let isPrinting = false;

function getTableName(tableNo) {
  if (tableNo.startsWith("takeaway-")) {
    return `กลับบ้าน ${tableNo.replace("takeaway-", "")}`;
  }

  return `โต๊ะ ${tableNo}`;
}

function formatOptions(options) {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return [];
  }

  return options.map((option) => option.name);
}

function drawDivider(doc) {
  const y = doc.y + 8;

  doc
    .moveTo(LEFT_MARGIN, y)
    .lineTo(PAPER_WIDTH - RIGHT_MARGIN, y)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.2);
}

function drawCenteredText(doc, text, fontSize, isBold = false) {
  doc
    .font(isBold ? "ThaiBold" : "Thai")
    .fontSize(fontSize)
    .text(text, LEFT_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: "center",
      lineGap: 2,
    });
}

function drawLeftText(doc, text, fontSize, isBold = false) {
  doc
    .font(isBold ? "ThaiBold" : "Thai")
    .fontSize(fontSize)
    .text(text, LEFT_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: "left",
      lineGap: 3,
    });
}

async function createKitchenPdf(orders, kitchenTitle) {
  const firstOrder = orders[0];

  const pdfPath = path.join(
    os.tmpdir(),
    `lhongma-kitchen-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.pdf`
  );

  const doc = new PDFDocument({
    size: [PAPER_WIDTH, PAPER_HEIGHT],
    margin: 0,
  });

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  if (fs.existsSync(THAI_FONT)) {
    doc.registerFont("Thai", THAI_FONT);
  } else {
    doc.registerFont("Thai", "Helvetica");
  }

  if (fs.existsSync(THAI_FONT_BOLD)) {
    doc.registerFont("ThaiBold", THAI_FONT_BOLD);
  } else {
    doc.registerFont("ThaiBold", "Helvetica-Bold");
  }

  doc.y = 12;

  // Header
  drawCenteredText(doc, "ร้านหลงมา", 15, true);
  doc.moveDown(0.15);
  drawCenteredText(doc, "KITCHEN ORDER", 15, true);
  doc.moveDown(0.15);
  drawCenteredText(doc, kitchenTitle, 15, true);
  doc.moveDown(0.35);
  drawDivider(doc);

  // Table
  drawCenteredText(doc, getTableName(firstOrder.table_no), 15, true);
  doc.moveDown(0.15);

  const nowText = new Date().toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  });

  drawCenteredText(doc, nowText, 12, false);
  doc.moveDown(0.4);
  drawDivider(doc);

  // Orders
  orders.forEach((order, index) => {
    drawLeftText(doc, `${index + 1}. ${order.name}`, 18, true);
    doc.moveDown(0.15);

    drawLeftText(doc, `จำนวน: ${order.qty}`, 15, true);
    doc.moveDown(0.15);

    const options = formatOptions(order.options);
    options.forEach((optionName) => {
      drawLeftText(doc, `+ ${optionName}`, 15, false);
      doc.moveDown(0.08);
    });

    if (order.note) {
      doc.moveDown(0.15);
      drawLeftText(doc, `หมายเหตุ: ${order.note}`, 15, true);
    }

    doc.moveDown(0.45);
    drawDivider(doc);
  });

  doc.moveDown(0.3);
  drawCenteredText(doc, "จบออเดอร์", 11, true);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return pdfPath;
}

async function printKitchenTicket(orders, kitchenTitle) {
  const pdfPath = await createKitchenPdf(orders, kitchenTitle);

  try {
    await print(pdfPath, {
      printer: PRINTER_NAME,
      scale: "fit",
    });
  } finally {
    setTimeout(() => {
      try {
        fs.unlinkSync(pdfPath);
      } catch {}
    }, 5000);
  }
}

async function markOrdersPrinted(orderIds) {
  const { error } = await supabase
    .from("orders")
    .update({ kitchen_printed: true })
    .in("id", orderIds);

  if (error) {
    console.error("อัปเดต kitchen_printed ไม่สำเร็จ:", error.message);
    return;
  }

  console.log(`ติ๊กปริ้นแล้ว ${orderIds.length} รายการ`);
}

async function printGroup(tableNo, orders, kitchenTitle) {
  if (orders.length === 0) return;

  console.log(
    `กำลังปริ้น ${getTableName(tableNo)} | ${kitchenTitle} | จำนวน ${orders.length} รายการ`
  );

  await printKitchenTicket(orders, kitchenTitle);

  const orderIds = orders.map((order) => order.id);
  await markOrdersPrinted(orderIds);

  console.log(`ปริ้นแล้ว: ${getTableName(tableNo)} | ${kitchenTitle}`);
}

async function checkAndPrintOrders() {
  if (isPrinting) return;

  isPrinting = true;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("paid", false)
      .eq("kitchen_printed", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("โหลดออเดอร์ไม่สำเร็จ:", error.message);
      return;
    }

    const orders = data || [];

    if (orders.length === 0) {
      console.log("ยังไม่มีออเดอร์ใหม่");
      return;
    }

    const groupedByTable = new Map();

    orders.forEach((order) => {
      if (!groupedByTable.has(order.table_no)) {
        groupedByTable.set(order.table_no, []);
      }

      groupedByTable.get(order.table_no).push(order);
    });

    for (const [tableNo, tableOrders] of groupedByTable.entries()) {
      // ใบที่ 1: ก๋วยเตี๋ยว + น้ำ
      const noodleAndDrinkOrders = tableOrders.filter((order) => {
        return order.station === "noodle" || order.station === "drink";
      });

      // ใบที่ 2: ตามสั่ง
      const riceOrders = tableOrders.filter((order) => {
        return order.station === "rice";
      });

      // ถ้ามีแต่ก๋วยเตี๋ยว/น้ำ = ออกแค่ 1 ใบ
      await printGroup(tableNo, noodleAndDrinkOrders, "ก๋วยเตี๋ยว / น้ำ");

      // ถ้ามีตามสั่งด้วย = ออกเพิ่มอีก 1 ใบ
      await printGroup(tableNo, riceOrders, "ตามสั่ง");
    }
  } catch (err) {
    console.error("เกิด error ตอนปริ้น:", err.message);
  } finally {
    isPrinting = false;
  }
}

console.log("Print server started...");
console.log(`Printer: ${PRINTER_NAME}`);
console.log("กำลังรอออเดอร์ใหม่...");

checkAndPrintOrders();
setInterval(checkAndPrintOrders, CHECK_EVERY_MS);