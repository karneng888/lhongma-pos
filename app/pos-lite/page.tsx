const tables = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function PosLitePage() {
  return (
    <main className="min-h-screen bg-orange-50 p-4 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h1 className="text-3xl font-bold text-orange-900">
            POS Lite ร้านหลงมา
          </h1>
          <p className="mt-2 text-gray-600">
            สำหรับ iPad รุ่นเก่า / ใช้รับออเดอร์แบบง่าย
          </p>
        </div>

        <h2 className="mt-5 text-2xl font-bold">เลือกโต๊ะเพื่อสั่งอาหาร</h2>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {tables.map((tableNo) => (
            <a
              key={tableNo}
              href={`/t/${tableNo}`}
              className="rounded-2xl bg-white p-6 text-center text-3xl font-bold shadow hover:bg-orange-100"
            >
              โต๊ะ {tableNo}
              <span className="mt-2 block text-base font-bold text-orange-700">
                สั่งอาหาร
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          <a
            href="/cashier"
            className="rounded-2xl bg-blue-600 p-4 text-center text-xl font-bold text-white"
          >
            ไปหน้าแคชเชียร์
          </a>

          <a
            href="/pos"
            className="rounded-2xl bg-gray-900 p-4 text-center text-xl font-bold text-white"
          >
            กลับแผนผังเต็ม
          </a>

          <a
            href="/report/today"
            className="rounded-2xl bg-green-600 p-4 text-center text-xl font-bold text-white"
          >
            รายงานวันนี้
          </a>
        </div>
      </div>
    </main>
  );
}