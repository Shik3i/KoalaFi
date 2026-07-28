import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) =>
	readFileSync(new URL(`../../${path}`, import.meta.url), { encoding: 'utf8' });

describe('delivery security configuration', () => {
	it('uses hash-based script CSP without script eval or inline execution', () => {
		const svelteConfig = projectFile('svelte.config.js');
		const caddyConfig = projectFile('Caddyfile.example');

		expect(svelteConfig).toContain("mode: 'hash'");
		expect(svelteConfig).toContain("'script-src': ['self']");
		expect(caddyConfig).not.toContain('wasm-unsafe-eval');
		expect(caddyConfig).not.toContain("script-src 'self' 'unsafe-inline'");
	});

	it('pins every GitHub Action to a full commit SHA', () => {
		const workflows = `${projectFile('.github/workflows/ci.yml')}\n${projectFile(
			'.github/workflows/release.yml'
		)}`;
		const actionReferences = [...workflows.matchAll(/uses:\s+\S+@(\S+)/g)].map((match) => match[1]);

		expect(actionReferences.length).toBeGreaterThan(0);
		for (const reference of actionReferences) {
			expect(reference).toMatch(/^[a-f0-9]{40}$/);
		}
	});
});
