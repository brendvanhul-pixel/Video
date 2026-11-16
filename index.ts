import { config, higgsfield, HiggsfieldError, TimeoutError } from "@higgsfield/client/v2";

const MODEL = "bytedance/seedance-2.5/text-to-video";

const credentials = process.env.HF_CREDENTIALS;
if (!credentials || !credentials.includes(":")) {
  console.error("HF_CREDENTIALS is missing or not in key-id:key-secret format. Set it in .env.local.");
  process.exit(1);
}

// Video generation can exceed the SDK's 5-minute default polling ceiling.
config({ credentials, pollInterval: 5_000, maxPollTime: 15 * 60_000 });

async function main(): Promise<number> {
  try {
    const result = await higgsfield.subscribe(MODEL, {
      input: {
        prompt: "A cinematic scene at sunset",
        duration: 5,
        resolution: "720p",
        aspect_ratio: "16:9",
      },
      withPolling: true,
    });

    // Compare as string: the API may return statuses (e.g. "canceled") the SDK type doesn't list.
    const status = result.status as string;
    console.log(`Request ${result.request_id} finished with status: ${status}`);

    if (status === "completed" && result.video?.url) {
      console.log(`Video URL: ${result.video.url}`);
      return 0;
    }
    if (status === "completed") {
      console.error("Status is completed but no video URL was returned.");
    } else if (status === "nsfw") {
      console.error("Request was blocked by content moderation.");
    } else if (status === "failed") {
      console.error("Generation failed.");
    } else if (status === "canceled" || status === "cancelled") {
      console.error("Request was canceled.");
    } else {
      console.error(`Unexpected terminal status: ${status}`);
    }
    return 1;
  } catch (err) {
    if (err instanceof TimeoutError) {
      console.error("Polling timed out before the request reached a terminal state (it may have been canceled).");
    } else if (err instanceof HiggsfieldError) {
      // SDK errors carry messages and API detail, never the credential values.
      console.error(`${err.name}: ${err.message}`);
    } else {
      console.error("Unexpected error:", err instanceof Error ? err.message : err);
    }
    return 1;
  }
}

process.exit(await main());
