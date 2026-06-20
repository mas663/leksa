import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  let word: string;
  try {
    const body = await req.json();
    word = body.word;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  if (!word || typeof word !== "string" || !word.trim()) {
    return NextResponse.json({ error: "Kata tidak boleh kosong" }, { status: 400 });
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Konfigurasi AI tidak tersedia di server" },
      { status: 500 }
    );
  }

  const prompt = `Kamu asisten pembuat kartu kosakata bahasa Inggris untuk pelajar Indonesia. Untuk satu kata Inggris yang diberikan, kembalikan HANYA objek JSON valid tanpa teks lain, tanpa markdown, tanpa \`\`\`. Gunakan makna paling umum. Pastikan contoh kalimat natural dan catatan grammar akurat.

Kata: "${word.trim()}"

Skema JSON wajib (kembalikan persis ini, tanpa kunci tambahan):
{"translation":"...","partOfSpeech":"...","exampleEN":"...","exampleID":"...","grammarNote":"..."}`;

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("Gemini API error:", geminiRes.status, errText);
      if (geminiRes.status === 429) {
        return NextResponse.json(
          { error: "Kuota AI harian sudah habis, coba lagi nanti atau isi manual." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Layanan AI sedang tidak tersedia. Silakan isi manual." },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    console.log("[/api/generate] raw Gemini response:", JSON.stringify(geminiData, null, 2));

    let rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    console.log("[/api/generate] extracted text:", rawText);

    // Clean markdown fences defensively
    rawText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(rawText);
    console.log("[/api/generate] parsed result:", parsed);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "Gagal memproses respons AI. Silakan isi manual atau coba lagi." },
      { status: 500 }
    );
  }
}
