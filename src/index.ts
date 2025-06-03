import * as errors from "@superbuilders/errors"
import * as z from "zod"

/**
 * Error code 400: Invalid request parameters.
 */
export const ErrInvalidRequest = errors.new("(status: 400) the request parameters are incorrect")

/**
 * Error code 401: Invalid authentication.
 */
export const ErrInvalidAuthentication = errors.new("(status: 401) invalid authentication")

/**
 * Error code 403: Access from an unsupported region.
 */
export const ErrForbidden = errors.new("(status: 403) accessing the api from an unsupported region")

/**
 * Error code 429: Rate limit reached or current quota exceeded.
 */
export const ErrRateLimitOrQuotaExceeded = errors.new(
	"(status: 429) sending requests too quickly or current quota exceeded"
)

/**
 * Error code 500: Server error.
 */
export const ErrServerError = errors.new("(status: 500) issue on our servers")

/**
 * Error code 503: Engine overloaded.
 */
export const ErrEngineOverloaded = errors.new("(status: 503) servers experiencing high traffic")

/**
 * Map of HTTP status codes to Mureka API errors.
 */
const STATUS_TO_ERROR: Record<number, Readonly<Error>> = {
	400: ErrInvalidRequest,
	401: ErrInvalidAuthentication,
	403: ErrForbidden,
	429: ErrRateLimitOrQuotaExceeded,
	500: ErrServerError,
	503: ErrEngineOverloaded
}

/**
 * The base URL for the Mureka API.
 */
const MUREKA_API_BASE_URL = "https://api.mureka.ai"

/**
 * The purposes available for file uploads.
 */
const PURPOSES = ["reference", "vocal", "melody", "instrumental", "voice", "fine-tuning"] as const
type Purpose = (typeof PURPOSES)[number]

/**
 * The models available for music generation.
 */
const MODELS = ["auto", "mureka-6", "mureka-5.5"] as const
type Model = (typeof MODELS)[number]

/**
 * The statuses of a music generation task.
 */
const TASK_STATUSES = ["preparing", "queued", "running", "succeeded", "failed", "timeouted", "cancelled"] as const

/**
 * The voices available for speech generation.
 */
const VOICES = ["Ethan", "Victoria", "Jake", "Luna", "Ema"] as const
type Voice = (typeof VOICES)[number]

/**
 * The section types available for lyrics generation.
 */
const SECTION_TYPES = ["intro", "verse", "pre-chorus", "chorus", "bridge", "breakdown", "outro"] as const

/**
 * The statuses of an upload task.
 */
const UPLOAD_STATUSES = ["pending", "completed", "cancelled"] as const

/**
 * Schema for the request body of the upload file endpoint.
 */
interface UploadFileInput {
	/** The File object (not file name) to be uploaded. */
	file: File
	/** The intended purpose of the uploaded file. Valid values: reference (mp3, max 30s), vocal (mp3, max 30s), melody (mp3, max 60s), instrumental (mp3, max 30s), voice (mp3, max 15s). */
	purpose: Exclude<Purpose, "fine-tuning">
}

/**
 * Schema for the response body of the upload file endpoint.
 */
const UploadFileResponseSchema = z.object({
	id: z.string().describe("The file identifier, which can be referenced in the API endpoints."),
	bytes: z.number().int().describe("The size of the file, in bytes."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the file was created."),
	filename: z.string().describe("The name of the file."),
	purpose: z.string().describe("The intended purpose of the file.")
})
type UploadFileResponse = z.infer<typeof UploadFileResponseSchema>

/**
 * Schema for the request body of the generate lyrics endpoint.
 */
interface GenerateLyricsInput {
	/** The prompt to generate lyrics for. */
	prompt: string
}

/**
 * Schema for the response body of the generate lyrics endpoint.
 */
const GenerateLyricsResponseSchema = z.object({
	title: z.string().describe("The title generated based on the prompt."),
	lyrics: z.string().describe("The lyrics generated based on the prompt.")
})
type GenerateLyricsResponse = z.infer<typeof GenerateLyricsResponseSchema>

/**
 * Schema for the request body of the extend lyrics endpoint.
 */
interface ExtendLyricsInput {
	/** Lyrics to be continued. */
	lyrics: string
}

/**
 * Schema for the response body of the extend lyrics endpoint.
 */
const ExtendLyricsResponseSchema = z.object({
	lyrics: z.string().describe("The lyrics extended based on the input lyrics.")
})
type ExtendLyricsResponse = z.infer<typeof ExtendLyricsResponseSchema>

/**
 * Schema for the request body of the generate song endpoint.
 */
interface GenerateSongInput {
	/** Lyrics for generated music. */
	lyrics: string
	/** The model to use. Use auto to select the latest model. You can also use a model via fine-tuning. In this case, only the prompt or reference_id control options are available. */
	model: Model
	/** Control music generation by inputting a prompt. When this option is selected, other control options (reference_id, vocal_id, melody_id) cannot be selected. */
	prompt?: string
	/** Control music generation by referencing music, generated through the files/upload API (for reference purpose). When this option is selected, other control options (prompt, melody_id) cannot be selected. */
	reference_id?: string
	/** Control music generation by any voice you like, generated through the files/upload API (for vocal purpose). When this option is selected, other control options (prompt, melody_id) cannot be selected. */
	vocal_id?: string
	/** Control music generation by melody idea, generated through the files/upload API (for melody purpose). When this option is selected, other control options (prompt, reference_id, vocal_id) cannot be selected. */
	melody_id?: string
}

/**
 * Schema for a single line of lyrics with timing information.
 */
const SongLyricsLineSchema = z.object({
	start: z.number().int().describe("The start time of the line, in milliseconds."),
	end: z.number().int().describe("The end time of the line, in milliseconds."),
	text: z.string().describe("The text in the lyrics line.")
})

/**
 * Schema for a section of lyrics (e.g. verse, chorus) containing multiple lines.
 */
const SongLyricsSectionSchema = z.object({
	section_type: z.enum(SECTION_TYPES).describe("The type of the section."),
	start: z.number().int().describe("The start time of the section, in milliseconds."),
	end: z.number().int().describe("The end time of the section, in milliseconds."),
	lines: z.array(SongLyricsLineSchema).describe("Lyrics lines contained in the section.")
})

/**
 * Schema for a generated song choice, including audio URLs and lyrics timing information.
 */
const SongChoiceSchema = z.object({
	index: z.number().int().describe("The index of the choice in the list of choices."),
	url: z.string().describe("The URL of the generated song."),
	flac_url: z.string().describe("The URL of the generated song, which is in lossless FLAC audio format."),
	duration: z.number().int().describe("The duration of the song, in milliseconds."),
	lyrics_sections: z.array(SongLyricsSectionSchema).describe("Lyrics section information, including timestamps.")
})

/**
 * Schema for the response body of the generate song endpoint.
 */
const GenerateSongResponseSchema = z.object({
	id: z.string().describe("Task ID of the asynchronous music generation task."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was created."),
	finished_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was finished."),
	model: z.string().describe("The model used for music generation."),
	status: z.enum(TASK_STATUSES).describe("The current status of the task."),
	failed_reason: z.string().optional().describe("The reason for the failure."),
	choices: z.array(SongChoiceSchema).describe("The generated songs, when the status is succeeded.")
})
type GenerateSongResponse = z.infer<typeof GenerateSongResponseSchema>

/**
 * Schema for the request params of the query song task endpoint.
 */
interface QuerySongTaskInput {
	/** The task_id of the music generation task. */
	task_id: string
}

/**
 * Schema for the response body of the query song task endpoint.
 */
const QuerySongTaskResponseSchema = z.object({
	id: z.string().describe("Task ID of the asynchronous music generation task."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was created."),
	finished_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was finished."),
	model: z.string().describe("The model used for music generation."),
	status: z.enum(TASK_STATUSES).describe("The current status of the task"),
	failed_reason: z.string().optional().describe("The reason for the failure."),
	choices: z.array(SongChoiceSchema).describe("The generated songs, when the status is succeeded.")
})
type QuerySongTaskResponse = z.infer<typeof QuerySongTaskResponseSchema>

/**
 * Schema for the request body of the stem song endpoint.
 */
interface StemSongInput {
	/** The URL of the music that needs to be split into tracks. URL in base64 format is also supported, with a maximum data size of 10 MB. */
	url: string
}

/**
 * Schema for the response body of the stem song endpoint.
 */
const StemSongResponseSchema = z.object({
	zip_url: z.string().url().describe("The URL of the ZIP file containing all the split music tracks."),
	expires_at: z.number().int().describe("The Unix timestamp (in seconds) for when the url was expired.")
})
type StemSongResponse = z.infer<typeof StemSongResponseSchema>

/**
 * Schema for the request body of the generate instrumental endpoint.
 */
interface GenerateInstrumentalInput {
	/** The model to use. Use auto to select the latest model. */
	model: Exclude<Model, "mureka-5.5">
	/** Control instrumental generation by inputting a prompt. When this option is selected, other control options (instrumental_id) cannot be selected. */
	prompt?: string
	/** Control instrumental generation by referencing music, generated through the files/upload API (for instrumental purpose). When this option is selected, other control options (prompt) cannot be selected. */
	instrumental_id?: string
}

/**
 * Schema for a generated instrumental choice, including audio URLs and duration information.
 */
const InstrumentalChoiceSchema = z.object({
	index: z.number().int().describe("The index of the choice in the list of choices."),
	url: z.string().describe("The URL of the generated instrumental"),
	flac_url: z.string().describe("The URL of the generated instrumental, which is in lossless FLAC audio format."),
	duration: z.number().int().describe("The duration of the instrumental, in milliseconds.")
})

/**
 * Schema for the response body of the generate instrumental endpoint.
 */
const GenerateInstrumentalResponseSchema = z.object({
	id: z.string().describe("Task ID of the asynchronous instrumental generation task."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was created."),
	finished_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was finished."),
	model: z.string().describe("The model used for instrumental generation."),
	status: z.enum(TASK_STATUSES).describe("The current status of the task"),
	failed_reason: z.string().optional().describe("The reason for the failure."),
	choices: z.array(InstrumentalChoiceSchema).describe("The generated instrumentals, when the status is succeeded.")
})
type GenerateInstrumentalResponse = z.infer<typeof GenerateInstrumentalResponseSchema>

/**
 * Schema for the request params of the query instrumental task endpoint.
 */
interface QueryInstrumentalTaskInput {
	/** The task_id of the instrumental generation task. */
	task_id: string
}

/**
 * Schema for the response body of the query instrumental task endpoint.
 */
const QueryInstrumentalTaskResponseSchema = z.object({
	id: z.string().describe("Task ID of the asynchronous instrumental generation task."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was created."),
	finished_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was finished."),
	model: z.string().describe("The model used for instrumental generation."),
	status: z.enum(TASK_STATUSES).describe("The current status of the task"),
	failed_reason: z.string().optional().describe("The reason for the failure."),
	choices: z.array(InstrumentalChoiceSchema).describe("The generated instrumentals, when the status is succeeded.")
})
type QueryInstrumentalTaskResponse = z.infer<typeof QueryInstrumentalTaskResponseSchema>

/**
 * Schema for the request body of the create upload endpoint.
 */
interface CreateUploadInput {
	/** Give a name for this upload, or the name of the large file to upload. */
	upload_name: string
	/** The intended purpose of this upload. */
	purpose: Extract<Purpose, "fine-tuning">
	/** The total size of this upload. If not provided, the size will not be checked at the end. */
	bytes?: number
}

/**
 * Schema for the response body of the create upload endpoint.
 */
const CreateUploadResponseSchema = z.object({
	id: z.string().describe("Task ID of the asynchronous task."),
	upload_name: z.string().describe("The name of the upload."),
	purpose: z.string().describe("The intended purpose of the upload."),
	bytes: z.number().int().describe("The total size of this upload."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was created."),
	expires_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was expired."),
	status: z.enum(UPLOAD_STATUSES).describe("The current status of the task."),
	parts: z
		.array(z.string())
		.describe("The list of parts included in this upload, which only have values when the status is completed.")
})
type CreateUploadResponse = z.infer<typeof CreateUploadResponseSchema>

/**
 * Schema for the request body of the add upload part endpoint.
 */
interface AddUploadPartInput {
	/** The File object (not file name) to be uploaded. For the following purposes: fine-tuning: Supported format (mp3). The audio duration is between 30 seconds and 270 seconds. */
	file: File
	/** The ID of the Upload object that this Part was added to. */
	upload_id: string
}

/**
 * Schema for the response body of the add upload part endpoint.
 */
const AddUploadPartResponseSchema = z.object({
	id: z.string().describe("The upload part ID, which can be referenced in API endpoints."),
	upload_id: z.string().describe("The ID of the Upload object that this Part was added to."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the part was created.")
})
type AddUploadPartResponse = z.infer<typeof AddUploadPartResponseSchema>

/**
 * Schema for the request body of the complete upload endpoint.
 */
interface CompleteUploadInput {
	/** The ID of the Upload object. */
	upload_id: string
	/** The ordered list of part IDs. If this parameter is empty, it means using all parts added by uploads/add, in the order they were added. */
	part_ids?: string[]
}

/**
 * Schema for the response body of the complete upload endpoint.
 */
const CompleteUploadResponseSchema = z.object({
	id: z.string().describe("Task ID of the asynchronous task."),
	upload_name: z.string().describe("The name of the upload."),
	purpose: z.string().describe("The intended purpose of the upload."),
	bytes: z.number().int().describe("The total size of this upload."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was created."),
	expires_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was expired."),
	status: z.enum(UPLOAD_STATUSES).describe("The current status of the task."),
	parts: z
		.array(z.string())
		.describe("The list of parts included in this upload, which only have values when the status is completed.")
})
type CompleteUploadResponse = z.infer<typeof CompleteUploadResponseSchema>

/**
 * Schema for the request body of the create fine-tuning task endpoint.
 */
interface CreateFineTuningTaskInput {
	/** The ID of the upload object with status completed. An effective fine-tuning requires uploading 100-200 songs. */
	upload_id: string
	/** A string of up to 32 characters that will be added to your fine-tuned model name. Only lowercase letters, numbers, and hyphens are allowed. */
	suffix: string
}

/**
 * Schema for the response body of the create fine-tuning task endpoint.
 */
const CreateFineTuningTaskResponseSchema = z.object({
	id: z.string().describe("Task ID of the asynchronous fine-tuning task."),
	upload_id: z.string().describe("The ID of the upload object."),
	model: z.string().describe("The base model that is being fine-tuned."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was created."),
	finished_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was finished."),
	status: z.enum(TASK_STATUSES).describe("The current status of the task."),
	failed_reason: z.string().optional().describe("The reason for the failure."),
	fine_tuned_model: z.string().describe("The name of the fine-tuned model.")
})
type CreateFineTuningTaskResponse = z.infer<typeof CreateFineTuningTaskResponseSchema>

/**
 * Schema for the request params of the query fine-tuning task endpoint.
 */
interface QueryFineTuningTaskInput {
	/** The task_id of the fine-tuning task. */
	task_id: string
}

/**
 * Schema for the response body of the query fine-tuning task endpoint.
 */
const QueryFineTuningTaskResponseSchema = z.object({
	id: z.string().describe("Task ID of the asynchronous fine-tuning task."),
	upload_id: z.string().describe("The ID of the upload object."),
	model: z.string().describe("The base model that is being fine-tuned."),
	created_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was created."),
	finished_at: z.number().int().describe("The Unix timestamp (in seconds) for when the task was finished."),
	status: z.enum(TASK_STATUSES).describe("The current status of the task."),
	failed_reason: z.string().optional().describe("The reason for the failure."),
	fine_tuned_model: z.string().describe("The name of the fine-tuned model.")
})
type QueryFineTuningTaskResponse = z.infer<typeof QueryFineTuningTaskResponseSchema>

/**
 * Schema for the request body of the generate speech endpoint.
 */
interface GenerateSpeechInput {
	/** The text to generate audio for. The maximum length is 500 characters. */
	text: string
	/** The voice to use when generating the audio. When this option is selected, other control options (voice_id) cannot be selected. */
	voice?: Voice
	/** Control audio generation by referencing voice, generated through the files/upload API (for voice purpose). When this option is selected, other control options (voice) cannot be selected. */
	voice_id?: string
}

/**
 * Schema for the response body of the generate speech endpoint.
 */
const GenerateSpeechResponseSchema = z.object({
	url: z.string().url().describe("The URL of the audio file."),
	expires_at: z.number().int().describe("The Unix timestamp (in seconds) for when the url was expired.")
})
type GenerateSpeechResponse = z.infer<typeof GenerateSpeechResponseSchema>

/**
 * Schema for a single conversation item in the podcast endpoint.
 */
interface PodcastConversationItem {
	/** The text to generate audio for. The maximum length is 400 characters. */
	text: string
	/** The voice to use. */
	voice: Voice
}

/**
 * Schema for the request body of the generate podcast endpoint.
 */
interface GeneratePodcastInput {
	/** Conversation array, The maximum length of the array is 10. */
	conversations: PodcastConversationItem[]
}

/**
 * Schema for the response body of the generate podcast endpoint.
 */
const GeneratePodcastResponseSchema = z.object({
	url: z.string().url().describe("The URL of the audio file."),
	expires_at: z.number().int().describe("The Unix timestamp (in seconds) for when the url was expired.")
})
type GeneratePodcastResponse = z.infer<typeof GeneratePodcastResponseSchema>

/**
 * Schema for the response body of the account billing endpoint.
 */
const BillingInfoResponseSchema = z.object({
	account_id: z.number().int().describe("Account ID"),
	balance: z.number().int().describe("The account balance, in cents."),
	total_recharge: z.number().int().describe("The account's total recharge amount, in cents."),
	total_spending: z.number().int().describe("The account's total spending amount, in cents."),
	concurrent_request_limit: z.number().int().describe("The account's maximum concurrent requests.")
})
type BillingInfoResponse = z.infer<typeof BillingInfoResponseSchema>

/**
 * Schema for the response body of the error endpoint.
 */
const MurekaApiErrorEnvelopeSchema = z.object({
	error: z.object({
		message: z.string()
	})
})

/**
 * Configuration for the Mureka API client.
 */
interface ClientConfig {
	apiKey: string
	apiBaseUrl?: string
}

/**
 * Mureka API client interface providing access to all API endpoints.
 * 
 * This interface defines all available methods for interacting with the Mureka AI API,
 * including music generation, lyrics creation, speech synthesis, and fine-tuning capabilities.
 * Each method is type-safe and returns a Promise that resolves to the appropriate response type.
 */
export interface Client {
	/** 
	 * Upload a file for various purposes like reference, vocal, melody, etc.
	 * @param input - Configuration for the file upload including purpose and file data
	 * @returns Promise resolving to upload response with file ID and metadata
	 */
	uploadFile: (input: UploadFileInput) => Promise<UploadFileResponse>

	/** 
	 * Generate lyrics from a prompt.
	 * @param input - Configuration including prompt text and generation parameters
	 * @returns Promise resolving to generated lyrics
	 */
	generateLyrics: (input: GenerateLyricsInput) => Promise<GenerateLyricsResponse>

	/** 
	 * Extend existing lyrics with additional content.
	 * @param input - Configuration including existing lyrics and extension parameters
	 * @returns Promise resolving to extended lyrics
	 */
	extendLyrics: (input: ExtendLyricsInput) => Promise<ExtendLyricsResponse>

	/** 
	 * Generate a song using provided lyrics.
	 * @param input - Configuration including lyrics and generation parameters
	 * @returns Promise resolving to song generation task details
	 */
	generateSong: (input: GenerateSongInput) => Promise<GenerateSongResponse>

	/** 
	 * Check the status of a song generation task.
	 * @param input - Task ID and query parameters
	 * @returns Promise resolving to current task status and results if complete
	 */
	querySongTask: (input: QuerySongTaskInput) => Promise<QuerySongTaskResponse>

	/** 
	 * Split a song into individual tracks.
	 * @param input - Configuration including song ID and stemming parameters
	 * @returns Promise resolving to separated audio tracks
	 */
	stemSong: (input: StemSongInput) => Promise<StemSongResponse>

	/** 
	 * Generate instrumental music.
	 * @param input - Configuration including generation parameters and style preferences
	 * @returns Promise resolving to instrumental generation task details
	 */
	generateInstrumental: (input: GenerateInstrumentalInput) => Promise<GenerateInstrumentalResponse>

	/** 
	 * Check the status of an instrumental generation task.
	 * @param input - Task ID and query parameters
	 * @returns Promise resolving to current task status and results if complete
	 */
	queryInstrumentalTask: (input: QueryInstrumentalTaskInput) => Promise<QueryInstrumentalTaskResponse>

	/** 
	 * Initialize a file upload for fine-tuning.
	 * @param input - Configuration for the upload including purpose and metadata
	 * @returns Promise resolving to upload initialization details
	 */
	createUpload: (input: CreateUploadInput) => Promise<CreateUploadResponse>

	/** 
	 * Add parts to an ongoing upload.
	 * @param input - Configuration including upload ID, part number, and data
	 * @returns Promise resolving to part upload confirmation
	 */
	addUploadPart: (input: AddUploadPartInput) => Promise<AddUploadPartResponse>

	/** 
	 * Finalize a multipart upload.
	 * @param input - Configuration including upload ID and completion parameters
	 * @returns Promise resolving to upload completion confirmation
	 */
	completeUpload: (input: CompleteUploadInput) => Promise<CompleteUploadResponse>

	/** 
	 * Start a fine-tuning task with uploaded files.
	 * @param input - Configuration including model parameters and training data
	 * @returns Promise resolving to fine-tuning task details
	 */
	createFineTuningTask: (input: CreateFineTuningTaskInput) => Promise<CreateFineTuningTaskResponse>

	/** 
	 * Check the status of a fine-tuning task.
	 * @param input - Task ID and query parameters
	 * @returns Promise resolving to current task status and results if complete
	 */
	queryFineTuningTask: (input: QueryFineTuningTaskInput) => Promise<QueryFineTuningTaskResponse>

	/** 
	 * Convert text to speech using specified voice.
	 * @param input - Configuration including text content and voice selection
	 * @returns Promise resolving to generated speech audio URL
	 */
	generateSpeech: (input: GenerateSpeechInput) => Promise<GenerateSpeechResponse>

	/** 
	 * Generate a podcast-style conversation.
	 * @param input - Configuration including conversation array and generation parameters
	 * @returns Promise resolving to generated podcast audio URL
	 */
	generatePodcast: (input: GeneratePodcastInput) => Promise<GeneratePodcastResponse>

	/** 
	 * Retrieve account billing information.
	 * @returns Promise resolving to account balance, spending history, and limits
	 */
	getBillingInfo: () => Promise<BillingInfoResponse>
}

/**
 * Create a Mureka API client.
 * @param apiKey - The API key to use for the client.
 * @returns A Mureka API client.
 */
export function createClient(config: ClientConfig): Client {
	const apiKey = config.apiKey
	if (apiKey == undefined) {
		throw errors.new("mureka api key required")
	}
	const apiBaseUrl = config.apiBaseUrl ?? MUREKA_API_BASE_URL

	async function request<T extends z.ZodType>(
		endpoint: string,
		options: RequestInit,
		responseSchema: T
	): Promise<z.infer<T>> {
		const fetchResult = await errors.try(
			fetch(`${apiBaseUrl}${endpoint}`, {
				...options,
				headers: {
					...options.headers,
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json"
				}
			})
		)
		if (fetchResult.error) {
			throw errors.wrap(fetchResult.error, "unable to fetch response")
		}

		const response = fetchResult.data
		if (response.ok === false) {
			const text = await errors.try(response.text())
			if (text.error != undefined) {
				throw errors.wrap(text.error, "unable to parse response body text")
			}

			const parsed = errors.trySync(() => JSON.parse(text.data))
			if (parsed.error != undefined) {
				throw errors.wrap(parsed.error, "unable to parse response body json")
			}

			const envelope = errors.trySync(() => MurekaApiErrorEnvelopeSchema.parse(parsed.data))
			if (envelope.error != undefined) {
				throw errors.wrap(envelope.error, "unable to parse error envelope")
			}

			const error = STATUS_TO_ERROR[response.status]
			if (error != undefined) {
				throw errors.wrap(error, "error response")
			}

			const message = envelope.data.error.message.toLowerCase()
			if (message.trim().length > 0) {
				throw errors.new(`(status: ${response.status}) unknown error: ${message}`)
			}

			throw errors.new(`(status: ${response.status}) unknown error`)
		}

		const successBodyParseResult = await errors.try(response.json())
		if (successBodyParseResult.error) {
			throw errors.wrap(successBodyParseResult.error, "mureka api success response parse")
		}

		const validatedSuccessResponse = responseSchema.safeParse(successBodyParseResult.data)
		if (validatedSuccessResponse.success === false) {
			throw errors.wrap(validatedSuccessResponse.error, "mureka api success response validation")
		}

		return validatedSuccessResponse.data
	}

	async function uploadFile(input: UploadFileInput): Promise<UploadFileResponse> {
		const formData = new FormData()
		formData.append("file", input.file)
		formData.append("purpose", input.purpose)

		return request(
			"/v1/files/upload",
			{
				method: "POST",
				body: formData
			},
			UploadFileResponseSchema
		)
	}

	async function generateLyrics(input: GenerateLyricsInput): Promise<GenerateLyricsResponse> {
		return request(
			"/v1/lyrics/generate",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			GenerateLyricsResponseSchema
		)
	}

	async function extendLyrics(input: ExtendLyricsInput): Promise<ExtendLyricsResponse> {
		return request(
			"/v1/lyrics/extend",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			ExtendLyricsResponseSchema
		)
	}

	async function generateSong(input: GenerateSongInput): Promise<GenerateSongResponse> {
		return request(
			"/v1/song/generate",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			GenerateSongResponseSchema
		)
	}

	async function querySongTask(input: QuerySongTaskInput): Promise<QuerySongTaskResponse> {
		return request(
			`/v1/song/query/${input.task_id}`,
			{
				method: "GET"
			},
			QuerySongTaskResponseSchema
		)
	}

	async function stemSong(input: StemSongInput): Promise<StemSongResponse> {
		return request(
			"/v1/song/stem",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			StemSongResponseSchema
		)
	}

	async function generateInstrumental(input: GenerateInstrumentalInput): Promise<GenerateInstrumentalResponse> {
		if (input.prompt == undefined && input.instrumental_id == undefined) {
			throw errors.new("exactly one of prompt or instrumental_id must be provided")
		}
		return request(
			"/v1/instrumental/generate",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			GenerateInstrumentalResponseSchema
		)
	}

	async function queryInstrumentalTask(input: QueryInstrumentalTaskInput): Promise<QueryInstrumentalTaskResponse> {
		return request(
			`/v1/instrumental/query/${input.task_id}`,
			{
				method: "GET"
			},
			QueryInstrumentalTaskResponseSchema
		)
	}

	async function createUpload(input: CreateUploadInput): Promise<CreateUploadResponse> {
		return request(
			"/v1/uploads/create",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			CreateUploadResponseSchema
		)
	}

	async function addUploadPart(input: AddUploadPartInput): Promise<AddUploadPartResponse> {
		const formData = new FormData()
		formData.append("upload_id", input.upload_id)
		formData.append("file", input.file)

		return request(
			"/v1/uploads/add",
			{
				method: "POST",
				body: formData
			},
			AddUploadPartResponseSchema
		)
	}

	async function completeUpload(input: CompleteUploadInput): Promise<CompleteUploadResponse> {
		return request(
			"/v1/uploads/complete",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			CompleteUploadResponseSchema
		)
	}

	async function createFineTuningTask(input: CreateFineTuningTaskInput): Promise<CreateFineTuningTaskResponse> {
		return request(
			"/v1/finetuning/create",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			CreateFineTuningTaskResponseSchema
		)
	}

	async function queryFineTuningTask(input: QueryFineTuningTaskInput): Promise<QueryFineTuningTaskResponse> {
		return request(
			`/v1/finetuning/query/${input.task_id}`,
			{
				method: "GET"
			},
			QueryFineTuningTaskResponseSchema
		)
	}

	async function generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechResponse> {
		return request(
			"/v1/tts/generate",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			GenerateSpeechResponseSchema
		)
	}

	async function generatePodcast(input: GeneratePodcastInput): Promise<GeneratePodcastResponse> {
		return request(
			"/v1/tts/podcast",
			{
				method: "POST",
				body: JSON.stringify(input)
			},
			GeneratePodcastResponseSchema
		)
	}

	async function getBillingInfo(): Promise<BillingInfoResponse> {
		return request(
			"/v1/account/billing",
			{
				method: "GET"
			},
			BillingInfoResponseSchema
		)
	}

	return {
		uploadFile,
		generateLyrics,
		extendLyrics,
		generateSong,
		querySongTask,
		stemSong,
		generateInstrumental,
		queryInstrumentalTask,
		createUpload,
		addUploadPart,
		completeUpload,
		createFineTuningTask,
		queryFineTuningTask,
		generateSpeech,
		generatePodcast,
		getBillingInfo
	}
}
