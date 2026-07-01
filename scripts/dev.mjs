import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const env = {};

for (const [key, value] of Object.entries(process.env)) {
	const existing = Object.keys(env).find((name) => name.toLowerCase() === key.toLowerCase());
	if (!existing) env[key === 'PATH' ? 'Path' : key] = value;
}

const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const child = spawn(
	process.execPath,
	[vite, 'dev', '--host', '127.0.0.1', ...process.argv.slice(2)],
	{
		cwd: root,
		env,
		stdio: 'inherit',
		windowsHide: true
	}
);

child.on('exit', (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	process.exit(code ?? 0);
});
