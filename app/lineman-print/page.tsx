"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LineManPrintPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copies, setCopies] = useState(1);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setMessage("");
  }

  async function handlePrint() {
    if (!file) {
      setMessage("กรุณาเลือกรูปก่อน");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `lineman-${Date.now()}.${ext}`;

      // 1. Upload screenshot
      const { error: uploadError } = await supabase.storage
        .from("lineman-orders")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("lineman-orders")
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;

      // 3. Create print job
      const { error: insertError } = await supabase
        .from("print_jobs")
        .insert({
  image_url: imageUrl,
  printer_name: "kitchen",
  status: "pending",
  copies: copies,
});

      if (insertError) {
        throw insertError;
      }

      setMessage("✅ ส่งไปที่ร้านแล้ว");
      setFile(null);
      setPreview("");
    } catch (error: any) {
      console.error(error);
      setMessage(`❌ ${error.message || "เกิดข้อผิดพลาด"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 500,
        margin: "0 auto",
        padding: 20,
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>
        LINE MAN Order Print
      </h1>

      <p style={{ marginBottom: 20 }}>
        อัปโหลด Screenshot ออเดอร์ แล้วส่งไปพิมพ์ที่ร้าน
      </p>

      <label
        style={{
          display: "block",
          border: "2px dashed #aaa",
          padding: 20,
          borderRadius: 12,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        📷 เลือกรูปออเดอร์

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </label>

      {preview && (
        <div style={{ marginTop: 20 }}>
          <img
            src={preview}
            alt="preview"
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #ddd",
            }}
          />
        </div>
      )}
<div style={{ marginTop: 20 }}>
  <div style={{ fontWeight: 700, marginBottom: 8 }}>
    จำนวนใบที่จะปริ้น
  </div>

  <div
    style={{
      display: "flex",
      gap: 10,
    }}
  >
    <button
      type="button"
      onClick={() => setCopies(1)}
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 10,
        border: copies === 1 ? "2px solid #000" : "1px solid #ccc",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      1 ใบ
    </button>

    <button
      type="button"
      onClick={() => setCopies(2)}
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 10,
        border: copies === 2 ? "2px solid #000" : "1px solid #ccc",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      2 ใบ
    </button>
  </div>
</div>
      <button
        onClick={handlePrint}
        disabled={loading || !file}
        style={{
          width: "100%",
          marginTop: 20,
          padding: 16,
          fontSize: 18,
          fontWeight: 700,
          border: "none",
          borderRadius: 12,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "กำลังส่ง..." : "🖨️ SEND TO PRINT"}
      </button>

      {message && (
        <div
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 10,
            background: "#f2f2f2",
          }}
        >
          {message}
        </div>
      )}
    </main>
  );
}