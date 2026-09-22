import { ChildProcess, spawn as spawnProcess } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(here, '..', '..');
const serverDir = process.env.PRIVTHING_SERVER_DIR || path.resolve(clientDir, '..', 'PrivThingServer');

export interface ChromeProcess {
    url: string,
    notesDir: string,
    stop: () => void
}

export async function spawn(files: Record<string, string>): Promise<ChromeProcess> {
    const buildDir = path.join(clientDir, 'build');
    if (!fs.existsSync(path.join(buildDir, 'index.html'))) {
        throw new Error('No build at ' + buildDir + ' — run npm run build first');
    }
    if (!fs.existsSync(path.join(serverDir, 'routes', 'actions.js'))) {
        throw new Error('PrivThingServer not found at ' + serverDir + ' — set PRIVTHING_SERVER_DIR');
    }

    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'privthing-e2e-'));
    const notesDir = path.join(sandbox, 'notes');
    fs.mkdirSync(notesDir);
    for (const name of Object.keys(files)) {
        fs.writeFileSync(path.join(notesDir, name), files[name]);
    }

    const child: ChildProcess = spawnProcess(process.execPath, [path.join(here, 'server.cjs'), buildDir, serverDir, notesDir], { stdio: ['ignore', 'pipe', 'inherit'] });
    const port = await new Promise<number>((resolve, reject) => {
        let output = '';
        child.stdout?.on('data', (chunk) => {
            output += String(chunk);
            const match = output.match(/PORT (\d+)/);
            if (match) {
                resolve(parseInt(match[1]));
            }
        });
        child.on('exit', (code) => reject(new Error('sandbox server exited with ' + code)));
    });

    return {
        url: 'http://127.0.0.1:' + port + '/',
        notesDir: notesDir,
        stop: () => {
            child.kill();
            fs.rmSync(sandbox, { recursive: true, force: true });
        }
    }
}
