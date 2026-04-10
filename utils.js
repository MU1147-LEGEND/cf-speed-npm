import { performance } from "node:perf_hooks";
import gradient from "gradient-string";

// ---------------- LATENCY ----------------
export async function measureLatency(url, attempts = 5) {
    const times = [];

    for (let i = 0; i < attempts; i++) {
        const start = performance.now();
        await fetch(url, { method: "HEAD" });
        const end = performance.now();

        times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    const jitter =
        times.reduce((a, b) => a + Math.abs(b - avg), 0) / times.length;

    return { latency: avg, jitter };
}

// ---------------- DOWNLOAD ----------------
export async function downloadTest(url, connections) {
    const start = performance.now();

    const results = await Promise.all(
        Array.from({ length: connections }, async () => {
            const res = await fetch(url);
            let bytes = 0;

            for await (const chunk of res.body) {
                bytes += chunk.length;
            }

            return bytes;
        }),
    );

    const end = performance.now();

    const totalBytes = results.reduce((a, b) => a + b, 0);
    const duration = (end - start) / 1000;

    return (totalBytes * 8) / (duration * 1024 * 1024);
}

// ---------------- UPLOAD ----------------
export async function uploadTest(url, sizeMB, connections) {
    const data = new Uint8Array(sizeMB * 1024 * 1024);

    const start = performance.now();

    await Promise.all(
        Array.from({ length: connections }, () =>
            fetch(url, { method: "POST", body: data }),
        ),
    );

    const end = performance.now();

    const totalBytes = data.length * connections;
    const duration = (end - start) / 1000;

    return (totalBytes * 8) / (duration * 1024 * 1024);
}

// ---------------- ANIMATION (FIXED) ----------------
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
