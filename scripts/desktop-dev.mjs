import {spawn} from "node:child_process";
import net from "node:net";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const packageBin = (packageName, relativePath) => path.join(path.dirname(require.resolve(`${packageName}/package.json`)), relativePath);
const viteCli = packageBin("vite", "bin/vite.js");
const forgeCli = packageBin("@electron-forge/cli", "dist/electron-forge.js");

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : undefined;
      server.close(() => port ? resolve(port) : reject(new Error("Impossible de réserver un port local.")));
    });
  });
}

async function waitForRenderer(url, vite) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (vite.exitCode !== null) throw new Error("Vite s’est arrêté avant le démarrage d’Electron.");
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Le serveur démarre encore.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Le renderer Vite n’a pas répondu dans le délai prévu.");
}

const port = await availablePort();
const rendererUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.execPath, [viteCli, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
  cwd: root,
  stdio: "inherit"
});

let electron;
const stop = () => {
  electron?.kill("SIGTERM");
  vite.kill("SIGTERM");
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  await waitForRenderer(rendererUrl, vite);
  electron = spawn(process.execPath, [forgeCli, "start"], {
    cwd: root,
    env: {...process.env, VITE_DEV_SERVER_URL: rendererUrl},
    stdio: "inherit"
  });
  const exitCode = await new Promise(resolve => electron.once("exit", code => resolve(code ?? 1)));
  stop();
  process.exitCode = exitCode;
} catch (error) {
  stop();
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
