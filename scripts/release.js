import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const dryRun = process.argv.includes('--dry-run');
const clientDir = path.resolve(scriptDir, '..');
const serverDir = process.env.PRIVTHING_SERVER_DIR || path.resolve(clientDir, '..', 'PrivThingServer');

const clientPackage = JSON.parse(fs.readFileSync(path.join(clientDir, 'package.json'), 'utf8'));
const version = clientPackage.version;

const step = (message) => console.log('\n==> ' + message);

if (!fs.existsSync(path.join(serverDir, 'app.js')) || !fs.existsSync(path.join(serverDir, 'controllers'))) {
    console.error('Not a PrivThingServer checkout: ' + serverDir);
    console.error('Set PRIVTHING_SERVER_DIR to point at it.');
    process.exit(1);
}

step('Releasing PrivThing ' + version + (dryRun ? ' (dry run)' : ''));
console.log('client: ' + clientDir);
console.log('server: ' + serverDir);

step('Building');
if (dryRun) {
    console.log('skipped');
} else {
    execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
}

const buildDir = path.join(clientDir, 'build');
const targetDir = path.join(serverDir, 'client', 'build');

if (!fs.existsSync(buildDir)) {
    console.error('No build output at ' + buildDir);
    process.exit(1);
}

step('Copying build into ' + targetDir);
if (dryRun) {
    console.log('skipped');
} else {
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(buildDir, targetDir, { recursive: true });
}

step('Stamping the server version');
const serverPackagePath = path.join(serverDir, 'package.json');
const serverPackage = JSON.parse(fs.readFileSync(serverPackagePath, 'utf8'));
if (serverPackage.version === version) {
    console.log('already ' + version);
} else if (dryRun) {
    console.log(serverPackage.version + ' -> ' + version + ' (skipped)');
} else {
    serverPackage.version = version;
    fs.writeFileSync(serverPackagePath, JSON.stringify(serverPackage, null, 2) + '\n');
    console.log('-> ' + version);
}

step('Now commit, in this order');
console.log('  cd ' + clientDir + ' && git add -A && git commit -m "release ' + version + '"');
console.log('  cd ' + serverDir + ' && git add -A && git commit -m "client ' + version + '"');
console.log('\nThe running service is a separate copy. To deploy it:');
console.log('  cp -r models controllers routes client ' + (process.env.PRIVTHING_DEPLOY_DIR || '<deploy dir>'));
console.log('  sudo systemctl restart <your privthing service>');
