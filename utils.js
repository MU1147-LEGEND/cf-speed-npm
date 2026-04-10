import { performance } from "node:perf_hooks";
import gradient from "gradient-string";

// ---------------- SAFE FETCH ----------------
async function safeFetch(url, options = {}, timeout = 8000, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const res = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(id);
            return res;
        } catch (err) {
            clearTimeout(id);

            if (attempt === retries) {
                throw err;
            }

            // small delay before retry
            await new Promise((r) => setTimeout(r, 800));
        }
    }
}

// ---------------- LATENCY ----------------
export async function measureLatency(url, attempts = 5) {
    const times = [];

    for (let i = 0; i < attempts; i++) {
        const start = performance.now();
        await safeFetch(url, { method: "HEAD", cache: "no-store" });
        const end = performance.now();

        times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    const jitter =
        times.reduce((a, b) => a + Math.abs(b - avg), 0) / times.length;

    return { latency: avg, jitter };
}

// ---------------- PROGRESS ----------------
function renderProgress(percent, speed) {
    const width = 20;
    const safePercent = Math.max(0, Math.min(100, percent));

    const filled = Math.round((safePercent / 100) * width);
    const bar = "█".repeat(filled) + "░".repeat(width - filled);

    process.stdout.write(
        `\r[${bar}] ${safePercent.toFixed(0)}%  ${speed.toFixed(2)} Mbps`,
    );
}

// ---------------- DOWNLOAD (FIXED) ----------------
export async function downloadTest(url, connections, signal) {
    const sizeMatch = url.match(/bytes=(\d+)/);
    const fileSize = sizeMatch ? parseInt(sizeMatch[1]) : 0;

    const totalBytes = fileSize * connections;

    const progressArr = new Array(connections).fill(0);

    const start = performance.now();

    const streams = await Promise.all(
        Array.from({ length: connections }, async (_, i) => {
            // 🔥 random delay per connection
            const randomDelay = Math.random() * 2000;
            await new Promise((r) => setTimeout(r, randomDelay));

            const res = await safeFetch(url, {
                method: "GET", // ✅ MUST
                cache: "no-store",
                signal,
            });

            if (!res.body) return null;

            return { stream: res.body, index: i };
        }),
    );

    await Promise.all(
        streams.map(async (item) => {
            if (!item) return;

            const { stream, index } = item;

            try {
                for await (const chunk of stream) {
                    if (signal?.aborted) return;

                    progressArr[index] += chunk.length;

                    const receivedBytes = progressArr.reduce(
                        (a, b) => a + b,
                        0,
                    );

                    const elapsed = (performance.now() - start) / 1000;
                    if (elapsed <= 0) continue;

                    const speed = (receivedBytes * 8) / (elapsed * 1024 * 1024);

                    const percent = totalBytes
                        ? (receivedBytes / totalBytes) * 100
                        : 0;

                    renderProgress(percent, speed);
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("\nDownload error:", err.message);
                }
            }
        }),
    );

    process.stdout.write("\n");

    const duration = (performance.now() - start) / 1000;
    const finalBytes = progressArr.reduce((a, b) => a + b, 0);

    if (duration <= 0) return 0;

    return (finalBytes * 8) / (duration * 1024 * 1024);
}

// ---------------- UPLOAD ----------------
export async function uploadTest(url, sizeMB, connections, signal) {
    const totalBytes = sizeMB * 1024 * 1024 * connections;

    let uploadedBytes = 0;

    const start = performance.now();

    function renderProgress(percent, speed) {
        const width = 20;
        const filled = Math.round((percent / 100) * width);
        const bar = "█".repeat(filled) + "░".repeat(width - filled);

        process.stdout.write(
            `\r[${bar}] ${percent.toFixed(0)}%  ${speed.toFixed(2)} Mbps`,
        );
    }

    const uploadOne = async () => {
        const chunkSize = 256 * 1024; // 256KB
        const totalChunks = (sizeMB * 1024 * 1024) / chunkSize;

        const stream = new ReadableStream({
            async pull(controller) {
                if (signal?.aborted) {
                    controller.close();
                    return;
                }

                if (uploadedBytes >= totalBytes) {
                    controller.close();
                    return;
                }

                const chunk = new Uint8Array(chunkSize);
                controller.enqueue(chunk);

                uploadedBytes += chunk.length;

                const elapsed = (performance.now() - start) / 1000;
                if (elapsed <= 0) return;

                const speed = (uploadedBytes * 8) / (elapsed * 1024 * 1024);

                const percent = (uploadedBytes / totalBytes) * 100;

                renderProgress(percent, speed);
            },
        });

        await safeFetch(url, {
            method: "POST",
            body: stream,
            duplex: "half", // 🔥 required for Node streaming upload
            signal,
        });
    };

    // parallel uploads
    await Promise.all(Array.from({ length: connections }, () => uploadOne()));

    process.stdout.write("\n");

    const duration = (performance.now() - start) / 1000;

    if (duration <= 0) return 0;

    return (uploadedBytes * 8) / (duration * 1024 * 1024);
}

// ---------------- ANIMATION ----------------
export function animateLoop(text) {
    let i = 0;
    let running = true;

    const clamp = (v) => Math.max(0, Math.min(1, v));

    const loop = () => {
        if (!running) return;

        const shift = (i % 20) / 20;

        const colored = gradient([
            { color: "#555555", pos: 0 },
            { color: "#aaaaaa", pos: clamp(shift) },
            { color: "#ffffff", pos: clamp(shift + 0.1) },
            { color: "#aaaaaa", pos: clamp(shift + 0.2) },
            { color: "#555555", pos: 1 },
        ])(text);

        process.stdout.write("\r" + colored);

        i++;
        setTimeout(loop, 50);
    };

    loop();

    return () => {
        running = false;
        process.stdout.write("\r");
    };
}
