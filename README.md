# 🚀 cf-speed-test

A fast, lightweight CLI tool to test your internet speed directly from the terminal.

Includes:

* ⚡ Download speed
* ⬆ Upload speed
* 📡 Latency (Ping)
* 📊 Jitter
* 🔁 Multiple test rounds
* 🎯 Parallel connections

---

## 📦 Installation

### Run instantly (no install)

```bash
npx @mu1147-legend/cf-speed-test
```

---

### Install globally

```bash
npm install -g @mu1147-legend/cf-speed-test
```

Then run:

```bash
netspeed
```

---

## ⚙️ Usage

```bash
netspeed
```

---

## 🛠️ Options

You can customize the test using CLI flags:

```bash
netspeed --connections=4 --download=50 --upload=20 --rounds=2
```

### Available Options

| Flag            | Description                       | Default |
| --------------- | --------------------------------- | ------- |
| `--connections` | Number of parallel connections    | `4`     |
| `--download`    | Download size per connection (MB) | `50`    |
| `--upload`      | Upload size per connection (MB)   | `20`    |
| `--rounds`      | Number of test rounds             | `2`     |
| `--json`        | Output result as JSON             | `false` |

---

## 📊 Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Legendary Speed Test

Round 1

⬇ Testing download...
[████████████████████] 100%  240 Mbps
✔ Download: 238 Mbps

⬆ Testing upload...
[████████████████████] 100%  230 Mbps
✔ Upload: 225 Mbps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connections: 4
Latency: 22 ms
Jitter: 3 ms

⬇ Download: 235 Mbps
⬆ Upload:   220 Mbps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🌍 How it works

* Uses parallel HTTP requests to measure bandwidth
* Streams data in chunks for real-time speed calculation
* Measures latency using lightweight HEAD requests
* Calculates jitter based on multiple ping attempts

---

## ⚠️ Notes

* Results may vary depending on your ISP and routing
* CDN-based testing (Cloudflare) may show higher peak speeds
* For best results:

  * Use stable connection
  * Avoid background downloads
  * Run multiple rounds

---

## 🧪 Advanced Usage

### JSON Output (for scripting)

```bash
netspeed --json
```

---

### High Accuracy Mode

```bash
netspeed --connections=6 --download=100 --rounds=3
```

---

## 📄 License

MIT License
