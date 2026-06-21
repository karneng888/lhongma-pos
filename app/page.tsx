import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-orange-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-orange-900">
          POS ร้านหลงมา
        </h1>

        <p className="mt-2 text-orange-800">
          ระบบสแกน QR สั่งอาหาร / แยกครัว / คิดเงิน / พิมพ์ใบเสร็จ
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/t/1"
            className="rounded-xl bg-white p-6 shadow hover:bg-orange-100"
          >
            <h2 className="text-2xl font-bold">ลูกค้าโต๊ะ 1</h2>
            <p className="mt-2 text-gray-600">จำลองหน้าสแกน QR สั่งอาหาร</p>
          </Link>

          <Link
            href="/kitchen/noodle"
            className="rounded-xl bg-white p-6 shadow hover:bg-orange-100"
          >
            <h2 className="text-2xl font-bold">ครัวก๋วยเตี๋ยว</h2>
            <p className="mt-2 text-gray-600">ดูออเดอร์เฉพาะก๋วยเตี๋ยว</p>
          </Link>

          <Link
            href="/kitchen/rice"
            className="rounded-xl bg-white p-6 shadow hover:bg-orange-100"
          >
            <h2 className="text-2xl font-bold">ครัวตามสั่ง</h2>
            <p className="mt-2 text-gray-600">ดูออเดอร์เฉพาะอาหารตามสั่ง</p>
          </Link>

          <Link
            href="/cashier"
            className="rounded-xl bg-white p-6 shadow hover:bg-orange-100"
          >
            <h2 className="text-2xl font-bold">แคชเชียร์</h2>
            <p className="mt-2 text-gray-600">คิดเงิน ปิดโต๊ะ พิมพ์ใบเสร็จ</p>
          </Link>
        </div>
      </div>
    </main>
  );
} 