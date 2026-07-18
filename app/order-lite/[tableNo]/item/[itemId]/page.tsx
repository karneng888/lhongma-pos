import { menuItems } from "@/app/data/menu";

type PageProps = {
  params: Promise<{
    tableNo: string;
    itemId: string;
  }>;
};

export default async function OrderLiteItemPage({ params }: PageProps) {
  const { tableNo, itemId } = await params;

  const menu = menuItems.find((item) => item.id === Number(itemId));

  if (!menu) {
    return (
      <main className="min-h-screen bg-orange-50 p-4 text-gray-900">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h1 className="text-2xl font-bold">ไม่พบเมนูนี้</h1>
          <a
            href={`/order-lite/${tableNo}`}
            className="mt-4 block rounded-xl bg-gray-900 p-3 text-center font-bold text-white"
          >
            กลับไปเลือกเมนู
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 p-4 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h1 className="text-3xl font-bold text-orange-900">{menu.name}</h1>

          {menu.englishName && (
            <p className="mt-1 text-gray-500">{menu.englishName}</p>
          )}

          <p className="mt-3 text-2xl font-bold text-orange-700">
            ราคาเริ่มต้น {menu.price}฿
          </p>

          <p className="mt-2 text-gray-600">โต๊ะ {tableNo}</p>
        </div>

        <form
          action="/api/order-lite"
          method="POST"
          className="mt-5 rounded-2xl bg-white p-5 shadow"
        >
          <input type="hidden" name="tableNo" value={tableNo} />
          <input type="hidden" name="itemId" value={menu.id} />

          <label className="block">
            <span className="text-xl font-bold">จำนวน</span>
            <input
              name="qty"
              type="number"
              min="1"
              defaultValue="1"
              className="mt-2 w-full rounded-xl border p-4 text-2xl font-bold"
            />
          </label>

          {menu.optionGroups?.map((group) => (
            <div key={group.id} className="mt-6 rounded-2xl border p-4">
              <h2 className="text-xl font-bold text-orange-900">
                {group.name}
              </h2>

              {group.englishName && (
                <p className="text-sm text-gray-500">{group.englishName}</p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3">
                {group.options.map((option) => {
                  const inputType =
                    group.type === "single" ? "radio" : "checkbox";

                  return (
                    <label
                      key={option.id}
                      className="block rounded-xl border bg-orange-50 p-4 text-lg font-bold"
                    >
                      <input
                        type={inputType}
                        name={`option_${group.id}`}
                        value={option.id}
                        className="mr-2"
                      />
                      {option.name}
                      {option.price > 0 && (
                        <span className="block text-sm text-orange-700">
                          +{option.price}฿
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <label className="mt-6 block">
            <span className="text-xl font-bold">หมายเหตุ</span>
            <textarea
              name="note"
              rows={3}
              placeholder="เช่น ไม่ใส่ผัก / แยกน้ำ / เผ็ดน้อย"
              className="mt-2 w-full rounded-xl border p-4 text-lg"
            />
          </label>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <a
              href={`/order-lite/${tableNo}`}
              className="rounded-xl bg-gray-900 p-4 text-center text-xl font-bold text-white"
            >
              กลับ
            </a>

            <button
              type="submit"
              className="rounded-xl bg-orange-600 p-4 text-xl font-bold text-white"
            >
              ส่งออเดอร์
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}