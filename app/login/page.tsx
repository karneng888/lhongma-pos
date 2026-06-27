"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_PASSWORD = "1234";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("lhongma-admin-login", "yes");
      router.push("/pos");
      return;
    }

    setError("รหัสผ่านไม่ถูกต้องค่ะ");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-orange-50 p-4 text-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold text-orange-900">
          เข้าสู่ระบบแอดมิน
        </h1>

        <p className="mt-2 text-gray-500">
          ใส่รหัสผ่านเพื่อเข้าใช้งานหน้าแอดมินและรายงาน
        </p>

        <div className="mt-6">
          <label className="font-bold">รหัสผ่าน</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
            className="mt-2 w-full rounded-xl border p-4 text-xl font-bold"
            placeholder="ใส่รหัสผ่าน"
          />

          {error && <p className="mt-2 font-bold text-red-600">{error}</p>}
        </div>

        <button
          onClick={handleLogin}
          className="mt-6 w-full rounded-xl bg-orange-600 p-4 text-xl font-bold text-white hover:bg-orange-700"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </main>
  );
}