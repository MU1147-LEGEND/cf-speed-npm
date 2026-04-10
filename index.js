#!/usr/bin/env node

import chalk from "chalk";
import { downloadTest, measureLatency, uploadTest } from "./utils.js";

const controller = new AbortController();

process.on("SIGINT", () => {
    console.log("\n⚠️ Test aborted");
    controller.abort();
    process.exit(1);
});

// args
const args = process.argv.slice(2);

const getArg = (name, def) => {
    const found = args.find((a) => a.startsWith(name));
    return found ? parseInt(found.split("=")[1]) : def;
};

const isJSON = args.includes("--json");

const CONNECTIONS = getArg("--connections", 2);
const DOWNLOAD_MB = getArg("--download", 20);
const UPLOAD_MB = getArg("--upload", 20);
const ROUNDS = getArg("--rounds", 2);

const DOWNLOAD_URL = `https://speed.cloudflare.com/__down?bytes=${DOWNLOAD_MB * 1024 * 1024}`;
const UPLOAD_URL = `https://speed.cloudflare.com/__up`;

async function run() {
    console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.green("🚀 Legendary Speed Test\n"));

    // latency
    const { latency, jitter } = await measureLatency(DOWNLOAD_URL);

    let dlArr = [];
    let ulArr = [];

    for (let i = 0; i < ROUNDS; i++) {
        console.log(chalk.gray(`\nRound ${i + 1}\n`));

        // 🔥 download with glowing animation
        const dl = await downloadTest(
            DOWNLOAD_URL,
            CONNECTIONS,
            controller.signal,
        );

        console.log("");
        console.log(chalk.blue(`✔ Download: ${dl.toFixed(2)} Mbps`));
        console.log("");

        // 🔥 upload with glowing animation
        const ul = await uploadTest(
            UPLOAD_URL,
            UPLOAD_MB,
            CONNECTIONS,
            controller.signal,
        );
        console.log("");
        console.log(chalk.magenta(`✔ Upload:   ${ul.toFixed(2)} Mbps`));
        console.log("");

        dlArr.push(dl);
        ulArr.push(ul);
    }

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const result = {
        download: avg(dlArr),
        upload: avg(ulArr),
        latency,
        jitter,
        connections: CONNECTIONS,
    };

    if (isJSON) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    // final output
    console.log(chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.cyan(`Connections: ${CONNECTIONS}`));
    console.log(chalk.yellow(`Latency: ${latency.toFixed(2)} ms`));
    console.log(chalk.yellow(`Jitter:  ${jitter.toFixed(2)} ms\n`));

    console.log(
        chalk.blueBright(`⬇ Download: ${result.download.toFixed(2)} Mbps`),
    );
    console.log(
        chalk.magentaBright(`⬆ Upload:   ${result.upload.toFixed(2)} Mbps`),
    );
    console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
}

run();
