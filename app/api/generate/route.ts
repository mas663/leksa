import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; text: string };

async function callGemini(apiKey: string, prompt: string): Promise<GeminiResult> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, text };
  }

  const data = await res.json();
  return { ok: true, data };
}

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
   - ${isPhrase ? 'Input ini FRASA — kembalikan wordForms: null. DILARANG mengisi konjugasi/bentuk apapun untuk frasa.' : 'Input ini satu kata — ikuti aturan berikut:'}
   - ${isPhrase ? '' : 'Jika partOfSpeech adalah "verb": kembalikan {"type":"verb","v1":"...","v2":"...","v3":"..."} (V1=infinitif, V2=past tense, V3=past participle), SEMUA huruf kecil.'}
   - ${isPhrase ? '' : 'Jika partOfSpeech adalah "noun": kembalikan {"type":"noun","singular":"...","plural":"..."}, SEMUA huruf kecil.'}
   - ${isPhrase ? '' : 'Untuk adjective, adverb, atau kelas kata lain: kembalikan null.'}
6. Gunakan makna paling umum. Contoh kalimat harus natural. Catatan grammar harus akurat.

Kembalikan HANYA objek JSON valid tanpa teks lain, tanpa markdown, tanpa \`\`\`.

Skema JSON wajib (kembalikan persis ini, tanpa kunci tambahan):
{"word":"...","translation":"...","partOfSpeech":"...","exampleEN":"...","exampleID":"...","grammarNote":"...","wordForms":null_atau_objek}`;

  try {
    let result = await callGemini(apiKey, prompt);

    if (!result.ok && [401, 403, 429].includes(result.status)) {
      const backupKey = process.env.AI_API_KEY_BACKUP;
      if (backupKey) {
        console.log(`[generate] Primary key returned ${result.status}, retrying with AI_API_KEY_BACKUP`);
        result = await callGemini(backupKey, prompt);
        if (result.ok) {
          console.log("[generate] Fallback key succeeded");
        }
      }
    }

    if (!result.ok) {
      console.error("Gemini API error:", result.status, result.text);
      if (result.status === 429) {
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

    const geminiData = result.data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
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
