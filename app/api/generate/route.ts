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

  const input = word.trim();
  const isPhrase = input.includes(" ");

  const prompt = `Kamu asisten pembuat kartu kosakata bahasa Inggris untuk pelajar Indonesia.

Input dari user: "${input}"

Aturan wajib:
1. Jika input adalah SATU KATA (bukan frasa):
   - Ubah ke bentuk dasar/kamus (lemma). Contoh: "running"→"run", "cats"→"cat", "better"→"good", "went"→"go".
   - ${isPhrase ? "Input ini adalah frasa, lewati aturan lemma." : "Input ini satu kata, terapkan lemma."}
2. Jika input adalah FRASA (2+ kata, mis. "give up"): JANGAN ubah, simpan apa adanya.
3. Kapitalkan huruf PERTAMA saja dari kata/frasa final. Contoh: "run"→"Run", "give up"→"Give up".
4. Field "word" dalam respons = bentuk final (sudah dilemmatisasi jika perlu, sudah dikapitalisasi).
5. Untuk field "wordForms":
   - Jika partOfSpeech adalah "verb": kembalikan {"type":"verb","v1":"...","v2":"...","v3":"..."} (V1=infinitif, V2=past tense, V3=past participle), SEMUA huruf kecil.
   - Jika partOfSpeech adalah "noun": kembalikan {"type":"noun","singular":"...","plural":"..."}, SEMUA huruf kecil.
   - Untuk adjective, adverb, frasa, atau kelas kata lain: kembalikan null.
6. Gunakan makna paling umum. Contoh kalimat harus natural. Catatan grammar harus akurat.

Kembalikan HANYA objek JSON valid tanpa teks lain, tanpa markdown, tanpa \`\`\`.

Skema JSON wajib (kembalikan persis ini, tanpa kunci tambahan):
{"word":"...","translation":"...","partOfSpeech":"...","exampleEN":"...","exampleID":"...","grammarNote":"...","wordForms":null_atau_objek}`;

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

    let rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Clean markdown fences defensively
    rawText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(rawText);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "Gagal memproses respons AI. Silakan isi manual atau coba lagi." },
      { status: 500 }
    );
  }
}
