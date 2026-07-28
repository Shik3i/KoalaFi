import { expect, test } from '@playwright/test';
import type { AudioQualityMetrics } from '$lib/audio/audioQuality';
import path from 'node:path';

const axePath = path.resolve('node_modules/axe-core/axe.min.js');

type AxeResult = {
	violations: Array<{
		id: string;
		help: string;
		nodes: Array<{ target: string[]; failureSummary?: string }>;
	}>;
};

async function getAccessibilityViolations(page: import('@playwright/test').Page) {
	return page.evaluate(async () => {
		const axe = (
			window as typeof window & {
				axe: { run(root: Document): Promise<AxeResult> };
			}
		).axe;
		return axe.run(document);
	});
}

test('run audio playback and check for console errors', async ({ page }) => {
	const runtimeErrors: string[] = [];

	page.on('console', (msg) => {
		if (msg.type() === 'error') runtimeErrors.push(msg.text());
	});
	page.on('pageerror', (err) => {
		runtimeErrors.push(err.message);
	});

	await page.goto('/');

	const playButton = page.locator('.sun-button');
	await expect(playButton).toBeVisible();
	await playButton.click();
	await expect(playButton).toHaveAttribute('aria-label', 'Pause KoalaFi');
	await expect(page.getByText('Playing', { exact: true })).toBeVisible();

	// Presets intentionally store a paused state. Applying one must not desynchronize
	// the actual transport from the global play control.
	await page.getByRole('button', { name: 'Open controls' }).click();
	await page.getByRole('menuitem', { name: 'Vibes' }).click();
	await page.getByRole('button', { name: 'Rainy Coding focus' }).click();
	await expect(playButton).toHaveAttribute('aria-label', 'Pause KoalaFi');
	await expect(page.getByText('Playing', { exact: true })).toBeVisible();

	await playButton.click();
	await expect(playButton).toHaveAttribute('aria-label', 'Play KoalaFi');
	await expect(page.getByText('Paused', { exact: true })).toBeVisible();
	expect(runtimeErrors).toEqual([]);
});

test('offline melody render stays within the audio quality gate', async ({ page }) => {
	await page.goto('/demo/playwright');
	await page.getByRole('button', { name: 'Run offline melody audit' }).click();

	const output = page.getByTestId('audio-metrics');
	await expect(output).toBeVisible();
	const metrics = JSON.parse((await output.textContent()) ?? '') as AudioQualityMetrics;

	expect(metrics.peak).toBeGreaterThanOrEqual(0.01);
	expect(metrics.peak).toBeLessThan(0.999);
	expect(metrics.rms).toBeGreaterThanOrEqual(0.001);
	expect(metrics.rms).toBeLessThan(0.4);
	expect(metrics.dcOffset).toBeLessThan(0.01);
	expect(metrics.clippedSampleRatio).toBe(0);
	expect(metrics.crestFactorDb).toBeGreaterThanOrEqual(2);
});

test('main view and modal surfaces pass axe and restore focus', async ({ page }) => {
	await page.addInitScript({ path: axePath });
	await page.goto('/');

	let results = await getAccessibilityViolations(page);
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

	const settingsButton = page.getByRole('button', { name: 'Open settings' });
	await settingsButton.click();
	const settingsDialog = page.getByRole('dialog', { name: 'System Settings' });
	await expect(settingsDialog).toBeVisible();
	await expect(page.getByRole('button', { name: 'Close settings' })).toBeFocused();
	results = await getAccessibilityViolations(page);
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
	await page.keyboard.press('Escape');
	await expect(settingsDialog).toBeHidden();
	await expect(settingsButton).toBeFocused();

	const controlsButton = page.getByRole('button', { name: 'Open controls' });
	await controlsButton.click();
	await page.getByRole('menuitem', { name: 'Share' }).click();
	const shareDialog = page.getByRole('dialog', { name: 'Share Vibe' });
	await expect(shareDialog).toBeVisible();
	await expect(page.getByRole('button', { name: 'Close share dialog' })).toBeFocused();
	results = await getAccessibilityViolations(page);
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
	await page.keyboard.press('Escape');
	await expect(shareDialog).toBeHidden();
	await expect(controlsButton).toBeFocused();
});

test('prerendered page ships a hash-based script CSP', async ({ page }) => {
	await page.goto('/');
	const content = await page
		.locator('meta[http-equiv="content-security-policy" i]')
		.getAttribute('content');

	expect(content).toBeTruthy();
	const scriptPolicy = content?.match(/script-src ([^;]+)/)?.[1] ?? '';
	expect(scriptPolicy).toContain("'self'");
	expect(scriptPolicy).toContain("'sha256-");
	expect(scriptPolicy).not.toContain("'unsafe-inline'");
	expect(scriptPolicy).not.toContain("'wasm-unsafe-eval'");
});
