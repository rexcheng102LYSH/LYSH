const fs = require("fs");
const path = require("path");

const root = process.cwd();
const timelinePath = path.join(root, ".vscode", "codex-timeline.log");
const heartbeatPath = path.join(root, ".vscode", "codex-heartbeat.txt");

const message = process.argv.slice(2).join(" ").trim() || "Codex file update";
const now = new Date();
const line = `[${now.toISOString()}] ${message}\n`;

fs.mkdirSync(path.dirname(timelinePath), { recursive: true });
if (fs.existsSync(timelinePath)) {
  const tail = fs.readFileSync(timelinePath, "utf8");
  if (tail.length > 0 && !tail.endsWith("\n")) {
    fs.appendFileSync(timelinePath, "\n", "utf8");
  }
}
fs.appendFileSync(timelinePath, line, "utf8");
fs.writeFileSync(
  heartbeatPath,
  `last_update=${now.toISOString()}\nmessage=${message}\n`,
  "utf8"
);

console.log("stamp written:", line.trim());
