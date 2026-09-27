import { pcmToWav, DEFAULT_SAMPLE_RATE, WAV_MIME } from "../wav.js";
import type { SpeechProvider, SpeechRequest } from "../types.js";

/**
 * A short 440 Hz tone — audible enough to prove playback, not a voice.
 *
 * Long enough (3 s) that an E2E assertion can observe the "speaking" chip and
 * still stop it: a shorter clip can finish before the browser is polled again,
 * which would make "is it playing?" a race rather than a fact.
 */
const TONE_MS = 3000;
const TONE_HZ = 440;
const AMPLITUDE = 8000;

/**
 * Offline speech provider: synthesizes a real, valid WAV in memory.
 *
 * The E2E suite runs the real backend with `SPEECH_PROVIDER=stub`, so the whole
 * narration path (route → ownership → language resolution → audio bytes →
 * `<audio>` playback) is exercised without a key, without network, and without
 * a bill. It speaks no words: what the tests verify is *plumbing*, while the
 * language contract is covered by the browser-fallback tests and the API tests.
 */
export class StubSpeechProvider implements SpeechProvider {
  readonly id = "stub";

  async synthesize(_request: SpeechRequest): Promise<{ audio: Buffer; mimeType: string }> {
    const samples = Math.floor((DEFAULT_SAMPLE_RATE * TONE_MS) / 1000);
    const pcm = Buffer.alloc(samples * 2);
    for (let i = 0; i < samples; i++) {
      const value = Math.round(AMPLITUDE * Math.sin((2 * Math.PI * TONE_HZ * i) / DEFAULT_SAMPLE_RATE));
      pcm.writeInt16LE(value, i * 2);
    }
    return { audio: pcmToWav(pcm, { sampleRate: DEFAULT_SAMPLE_RATE, channels: 1, bitsPerSample: 16 }), mimeType: WAV_MIME };
  }
}
