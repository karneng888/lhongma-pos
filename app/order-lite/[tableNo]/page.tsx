import Link from "next/link";
import { menuItems } from "@/app/data/menu";

type PageProps = {
  params: Promise<{
    tableNo: string;
  }>;
};

export default async function OrderLiteTablePage({ params }: PageProps) {
  const { tableNo } = await params;

  const noodleItems = menuItems.filter((item) => item.station === "noodle");
  const riceItems = menuItems.filter((item) => item.station === "rice");
  const drinkItems = menuItems.filter((item) => item.station === "drink");

  return (
    <main className="min-h-screen bg-orange-50 p-4 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h1 className="text-3xl font-bold text-orange-900">
            สั่งอาหาร โต๊ะ {tableNo}
          </h1>
          <p className="mt-2 text-gray-600">
            หน้าเบาสำหรับ iPad รุ่นเก่า เลือกเมนูแล้วกดส่งทีละรายการ
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href="/pos-lite"
              className="rounded-xl bg-gray-900 p-3 text-center font-bold text-white"
            >
              กลับ POS Lite
            </a>

            <a
              href={`/cashier?table=${tableNo}`}
              className="rounded-xl bg-blue-600 p-3 text-center font-bold text-white"
            >
              ไปแคชเชียร์
            </a>
          </div>
        </div>

        <MenuSection title="ก๋วยเตี๋ยว" items={noodleItems} tableNo={tableNo} />
        <MenuSection title="ตามสั่ง" items={riceItems} tableNo={tableNo} />
        <MenuSection title="เครื่องดื่ม" items={drinkItems} tableNo={tableNo} />
      </div>
    </main>
  );
}

function MenuSection({
  title,
  items,
  tableNo,
}: {
  title: string;
  items: typeof menuItems;
  tableNo: string;
}) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow">
      <h2 className="text-2xl font-bold text-orange-900">{title}</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={`/order-lite/${tableNo}/item/${item.id}`}
            className="flex min-h-[110px] flex-col justify-between rounded-2xl border bg-white p-3 shadow hover:bg-orange-100"
          >
            <div>
              <p className="text-lg font-bold leading-tight">{item.name}</p>

              {item.englishName && (
                <p className="mt-1 text-xs text-gray-500">
                  {item.englishName}
                </p>
              )}
            </div>

            <p className="mt-2 text-xl font-bold text-orange-700">
              {item.price}฿
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}