# Mureka API Client

A TypeScript client for the Mureka AI API, providing type-safe access to music generation, lyrics creation, speech synthesis, and fine-tuning capabilities.

## Features

- 🎵 Music Generation
- 📝 Lyrics Generation & Extension
- 🎤 Speech Synthesis
- 🎧 Podcast Generation
- 🎼 Instrumental Generation
- 🎹 Song Stemming
- 🎯 Fine-tuning Support
- 💳 Billing Information

## Installation

```bash
npm install @superbuilders/mureka
```

## Usage

```typescript
import * as mureka from "@superbuilders/mureka"

const client = mureka.createClient({
  apiKey: "your-api-key"
})

// Generate lyrics
const lyrics = await client.generateLyrics({
  prompt: "A song about artificial intelligence"
})

// Generate a song
const song = await client.generateSong({
  lyrics: lyrics.lyrics,
  model: "auto"
})

// Check song generation status
const status = await client.querySongTask({
  task_id: song.id
})
```

## API Reference

### Music Generation

- `generateSong`: Create a new song with lyrics
- `querySongTask`: Check the status of a song generation task
- `stemSong`: Split a song into individual tracks
- `generateInstrumental`: Create instrumental music

### Lyrics

- `generateLyrics`: Generate lyrics from a prompt
- `extendLyrics`: Extend existing lyrics

### Speech & Podcast

- `generateSpeech`: Convert text to speech
- `generatePodcast`: Create a podcast-style conversation

### Fine-tuning

- `createUpload`: Initialize a fine-tuning upload
- `addUploadPart`: Add parts to an upload
- `completeUpload`: Finalize an upload
- `createFineTuningTask`: Start a fine-tuning task
- `queryFineTuningTask`: Check fine-tuning task status

### File Management

- `uploadFile`: Upload files for various purposes (reference, vocal, melody, etc.)

### Account

- `getBillingInfo`: Retrieve account billing information

## Error Handling

The client includes comprehensive error handling with specific error types for common API responses:

- `ErrInvalidRequest` (400)
- `ErrInvalidAuthentication` (401)
- `ErrForbidden` (403)
- `ErrRateLimitOrQuotaExceeded` (429)
- `ErrServerError` (500)
- `ErrEngineOverloaded` (503)

## License

MIT
