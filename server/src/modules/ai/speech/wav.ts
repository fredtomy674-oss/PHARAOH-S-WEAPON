/**
 * PHASE 40 (D-044) — WAV assembly for server-generated speech.
 *
 * Gemini's TTS returns raw 16-bit little-endian PCM (`audio/L16;rate=24000`),
 * which no browser plays directly. Wrapping it in a 44-byte RIFF header is a
 * few lines of Buffer arithmetic — no transcoder, no new dependency, and the
 * bytes stay exactly what the provider produced.
 */
export const WAV_MIME = "audio/wav";
export const DEFAULT_SAMPLE_RATE = 24000;

export interface PcmFormat {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

/** Wraps raw PCM in a canonical 44-byte RIFF/WAVE header. */
export function pcmToWav(pcm: Buffer, format: PcmFormat): Buffer {
  const { sampleRate, channels, bitsPerSample } = format;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // PCM fmt chunk size
  header.writeUInt16LE(1, 20); // audioFormat 1 = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

/** True for raw-PCM mime types (`audio/L16`, with or without codec/rate). */
export function isPcmMime(mimeType: string): boolean {
  return (mimeType.toLowerCase().split(";")[0] ?? "").trim() === "audio/l16";
}

/** Reads `rate=24000` out of `audio/L16;codec=pcm;rate=24000`. */
export function readPcmSampleRate(mimeType: string, fallback = DEFAULT_SAMPLE_RATE): number {
  const match = /rate=(\d+)/i.exec(mimeType);
  if (!match) return fallback;
  const rate = Number(match?.[1] ?? 0);
  return Number.isFinite(rate) && rate > 0 ? rate : fallback;
}

/**
 * Normalizes whatever the provider returned into a browser-playable WAV.
 * Already-WAV payloads pass through untouched; raw PCM gets a header.
 */
export function toPlayableWav(
  audio: Buffer,
  mimeType: string,
): { audio: Buffer; mimeType: string } | null {
  const normalized = mimeType.toLowerCase();
  if (normalized === WAV_MIME || normalized === "audio/wave" || normalized === "audio/x-wav") {
    return { audio, mimeType: WAV_MIME };
  }
  if (isPcmMime(mimeType)) {
    return {
      audio: pcmToWav(audio, { sampleRate: readPcmSampleRate(mimeType), channels: 1, bitsPerSample: 16 }),
      mimeType: WAV_MIME,
    };
  }
  // An audio type the browser may or may not play (e.g. audio/mpeg): pass it
  // through — the client falls back to its own voice if playback fails.
  return normalized.startsWith("audio/") ? { audio, mimeType } : null;
}
