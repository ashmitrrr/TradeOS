import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Maps browser MIME type to a file extension Whisper recognises
function mimeToExt(mimeType = '') {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm'; // default for webm/opus from modern browsers
}

export async function transcribeAudio(audioBuffer, mimeType) {
  const ext = mimeToExt(mimeType);
  const file = await toFile(audioBuffer, `recording.${ext}`, { type: mimeType });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  });

  return transcription;
}
