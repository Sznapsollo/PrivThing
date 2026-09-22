// Serves the built client and the real PrivThingServer actions against a throwaway
// folder, so the browser tests never touch a configured folder of the real config.
const Module = require('module');
const path = require('path');
const fs = require('fs');

const [buildDir, serverDir, notesDir] = process.argv.slice(2);

const configPath = path.join(notesDir, '..', 'config.json');
fs.writeFileSync(configPath, JSON.stringify({
    port: 0,
    filesFolders: [notesDir + path.sep],
    extensions: ['.txt', '.prvthng', '.md']
}));

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
    if (request === '../config.json') {
        return configPath
    }
    return originalResolve.call(this, request, ...args)
};

const express = require(path.join(serverDir, 'node_modules', 'express'));
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(buildDir));
app.use('/actions', require(path.join(serverDir, 'routes', 'actions')));
app.get('*', (req, res) => res.sendFile(path.join(buildDir, 'index.html')));

const listener = app.listen(0, '127.0.0.1', () => {
    process.stdout.write('PORT ' + listener.address().port + '\n');
});
