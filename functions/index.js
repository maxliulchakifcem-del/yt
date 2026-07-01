const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { Readable } = require("stream");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory job storage for playlist packaging
const playlistJobs = new Map();

// Clean up jobs older than 20 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const expiry = 20 * 60 * 1000; // 20 minutes
  for (const [id, job] of playlistJobs.entries()) {
    if (now - job.createdAt > expiry) {
      playlistJobs.delete(id);
      console.log(`[Job Cleanup] Removed job ${id} due to expiration.`);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Helper to extract YouTube video ID
function getYoutubeVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper to extract YouTube playlist ID
function getYoutubePlaylistId(url) {
  const regExp = /[&?]list=([^&#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Helper to scrape title from a YouTube page
async function scrapeYoutubeTitle(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    if (!res.ok) return "YouTube Music";
    const html = await res.text();
    const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].replace(" - YouTube", "").trim();
    }
  } catch (err) {
    console.error("Error scraping title:", err);
  }
  return "YouTube Music";
}

// Call Cobalt APIs with mirrors and retries
async function callCobalt(videoUrl) {
  const endpoints = [
    "https://api.cobalt.tools/api/json",
    "https://co.wuk.sh/api/json"
  ];

  let lastError = "";
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: videoUrl,
          videoQuality: "720",
          audioFormat: "mp3",
          audioQuality: "8",
          downloadMode: "audio",
          filenamePattern: "pretty"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Status ${response.status}: ${errText}`;
        continue;
      }

      const result = await response.json();
      if (result.status === "error") {
        lastError = result.text || "Cobalt error status";
        continue;
      }

      if (result.url) {
        return result.url;
      } else if (result.picker && result.picker[0] && result.picker[0].url) {
        return result.picker[0].url;
      }
      lastError = "Response missing url";
    } catch (e) {
      lastError = e.message || "Network error";
    }
  }
  throw new Error(`Failed to convert. Error detail: ${lastError}`);
}

// Background Playlist Processor
async function processPlaylistJob(jobId, playlistTitle, tracks) {
  const job = playlistJobs.get(jobId);
  if (!job) return;

  job.status = "downloading";
  playlistJobs.set(jobId, { ...job });

  const zip = new AdmZip();

  for (let i = 0; i < tracks.length; i++) {
    // Check if job was deleted in memory
    if (!playlistJobs.has(jobId)) {
      console.log(`[Job] Cancelled job ${jobId} because it was removed.`);
      return;
    }

    const track = tracks[i];
    job.currentTrack = track.title;
    job.progress = Math.round((i / tracks.length) * 100);
    playlistJobs.set(jobId, { ...job });

    try {
      // 1. Convert video to MP3 download url
      const mp3Url = await callCobalt(track.url);

      // 2. Fetch binary file from download link
      const audioRes = await fetch(mp3Url);
      if (!audioRes.ok) {
        throw new Error(`Failed to download audio from Cobalt CDN: ${audioRes.statusText}`);
      }

      const arrayBuffer = await audioRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 3. Add to ZIP archive
      let safeFilename = track.title.replace(/[\\/:*?"<>|]/g, "_");
      if (!safeFilename.endsWith(".mp3")) {
        safeFilename += ".mp3";
      }
      zip.addFile(safeFilename, buffer);

      job.tracksCompleted++;
      job.progress = Math.round((job.tracksCompleted / tracks.length) * 100);
      playlistJobs.set(jobId, { ...job });
    } catch (err) {
      console.error(`[Job ${jobId}] Failed track: ${track.title}`, err);
      // Log errors into errors.txt inside ZIP so user knows what failed
      const errorLog = `Track failed: "${track.title}" (${track.url})\nError: ${err.message || err}\n\n`;
      try {
        const existingLog = zip.getEntry("errors.txt");
        if (existingLog) {
          const content = existingLog.getData().toString("utf-8") + errorLog;
          zip.updateFile("errors.txt", Buffer.from(content, "utf-8"));
        } else {
          zip.addFile("errors.txt", Buffer.from(errorLog, "utf-8"));
        }
      } catch (zipErr) {
        // Safe skip
      }
      job.tracksCompleted++;
      job.progress = Math.round((job.tracksCompleted / tracks.length) * 100);
      playlistJobs.set(jobId, { ...job });
    }
  }

  // All tracks done! Compress ZIP
  job.status = "zipping";
  playlistJobs.set(jobId, { ...job });

  try {
    const zipBuffer = zip.toBuffer();
    const cleanTitle = playlistTitle.replace(/[\\/:*?"<>|]/g, "_") || "playlist";

    job.status = "completed";
    job.progress = 100;
    job.zipBuffer = zipBuffer;
    job.filename = `${cleanTitle}.zip`;
    playlistJobs.set(jobId, { ...job });
  } catch (err) {
    job.status = "failed";
    job.error = `Zipping failed: ${err.message || err}`;
    playlistJobs.set(jobId, { ...job });
  }
}

// API Routes

// 1. Get single video info
app.get("/api/video-info", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: "Invalid YouTube URL format" });
  }

  try {
    const title = await scrapeYoutubeTitle(url);
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    res.json({
      id: videoId,
      title,
      thumbnail,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch video information" });
  }
});

// 2. Get playlist info
app.get("/api/playlist-info", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "Playlist URL is required" });
  }

  const playlistId = getYoutubePlaylistId(url);
  if (!playlistId) {
    return res.status(400).json({ error: "Could not find a valid playlist ID in the URL" });
  }

  try {
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch playlist page: ${response.statusText}` });
    }

    const html = await response.text();
    const jsonMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!jsonMatch) {
      return res.status(400).json({ error: "Could not parse playlist page. Ensure it is public and not empty." });
    }

    const data = JSON.parse(jsonMatch[1]);
    const videos = [];

    function searchVideos(obj) {
      if (!obj || typeof obj !== "object") return;

      if (obj.playlistVideoRenderer) {
        const v = obj.playlistVideoRenderer;
        const videoId = v.videoId;
        if (!videoId) return;

        let title = "Unknown Track";
        if (v.title?.runs?.[0]?.text) {
          title = v.title.runs[0].text;
        } else if (v.title?.simpleText) {
          title = v.title.simpleText;
        }

        let duration = "0:00";
        if (v.lengthText?.runs?.[0]?.text) {
          duration = v.lengthText.runs[0].text;
        } else if (v.lengthText?.simpleText) {
          duration = v.lengthText.simpleText;
        }

        const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

        videos.push({
          id: videoId,
          title,
          duration,
          thumbnail,
          url: `https://www.youtube.com/watch?v=${videoId}`
        });
      } else if (obj.lockupViewModel) {
        const v = obj.lockupViewModel;
        const videoId = v.contentId;
        if (videoId && v.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
          const title = v.metadata?.lockupMetadataViewModel?.title?.content || "Unknown Track";
          
          let duration = "0:00";
          try {
            const overlays = v.contentImage?.thumbnailViewModel?.overlays || [];
            for (const overlay of overlays) {
              const badge = overlay.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel;
              if (badge?.text) {
                duration = badge.text;
                break;
              }
            }
          } catch (e) {
            // safe skip
          }

          const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

          videos.push({
            id: videoId,
            title,
            duration,
            thumbnail,
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
      } else {
        for (const key of Object.keys(obj)) {
          searchVideos(obj[key]);
        }
      }
    }

    searchVideos(data);

    let playlistTitle = "YouTube Playlist";
    const metaTitle = html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (metaTitle) {
      playlistTitle = metaTitle[1].replace(" - YouTube", "").trim();
    }

    res.json({
      title: playlistTitle,
      videos
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch playlist information" });
  }
});

// 3. Initiate single video conversion
app.post("/api/download-single", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const downloadUrl = await callCobalt(url);
    res.json({ downloadUrl });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to convert video to MP3" });
  }
});

// 4. Stream and proxy audio file to set friendly header name
app.get("/api/stream-audio", async (req, res) => {
  const { url, filename } = req.query;
  if (!url || !filename) {
    return res.status(400).send("URL and filename parameters are required");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch media file from CDN: ${response.statusText}`);
    }

    // Set download attachment headers
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "no-cache"
    });

    if (response.body) {
      // Stream directly
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.status(500).send("No readable stream received from media host");
    }
  } catch (err) {
    console.error("Audio streaming proxy error:", err);
    res.status(500).send("Error streaming audio through download proxy");
  }
});

// 5. Create background playlist packaging job
app.post("/api/create-playlist-job", (req, res) => {
  const { title, tracks } = req.body;
  if (!title || !tracks || !Array.isArray(tracks)) {
    return res.status(400).json({ error: "Title and tracks array are required" });
  }

  const jobId = Math.random().toString(36).substring(2, 15);
  const newJob = {
    id: jobId,
    status: "pending",
    progress: 0,
    currentTrack: "",
    tracksTotal: tracks.length,
    tracksCompleted: 0,
    createdAt: Date.now()
  };

  playlistJobs.set(jobId, newJob);

  // Trigger non-blocking async background download and zipping
  processPlaylistJob(jobId, title, tracks);

  res.json({ jobId });
});

// 6. SSE endpoint for real-time playlist download progress updates
app.get("/api/playlist-progress", (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId) {
    return res.status(400).send("jobId is required");
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  // Immediate update
  const job = playlistJobs.get(jobId);
  if (!job) {
    res.write(`data: ${JSON.stringify({ status: "failed", error: "Job not found" })}\n\n`);
    res.end();
    return;
  }

  res.write(`data: ${JSON.stringify({
    status: job.status,
    progress: job.progress,
    currentTrack: job.currentTrack,
    tracksCompleted: job.tracksCompleted,
    tracksTotal: job.tracksTotal,
    error: job.error
  })}\n\n`);

  // Interval polling
  const intervalId = setInterval(() => {
    const currentJob = playlistJobs.get(jobId);
    if (!currentJob) {
      res.write(`data: ${JSON.stringify({ status: "failed", error: "Job cancelled or expired" })}\n\n`);
      clearInterval(intervalId);
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify({
      status: currentJob.status,
      progress: currentJob.progress,
      currentTrack: currentJob.currentTrack,
      tracksCompleted: currentJob.tracksCompleted,
      tracksTotal: currentJob.tracksTotal,
      error: currentJob.error
    })}\n\n`);

    if (currentJob.status === "completed" || currentJob.status === "failed") {
      clearInterval(intervalId);
      res.end();
    }
  }, 1000);

  req.on("close", () => {
    clearInterval(intervalId);
  });
});

// 7. Retrieve finished ZIP file
app.get("/api/retrieve-zip", (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId) {
    return res.status(400).send("jobId is required");
  }

  const job = playlistJobs.get(jobId);
  if (!job) {
    return res.status(404).send("Download link has expired or job is invalid.");
  }

  if (job.status !== "completed" || !job.zipBuffer) {
    return res.status(400).send(`Job is in state: ${job.status}. Cannot download zip yet.`);
  }

  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(job.filename || "playlist.zip")}"`,
    "Content-Length": job.zipBuffer.length
  });

  res.end(job.zipBuffer);

  // Keep job metadata but remove buffer to free up memory immediately
  job.zipBuffer = undefined;
  playlistJobs.set(jobId, job);
});

// Export as Firebase HTTP Function
exports.api = functions.https.onRequest(app);
