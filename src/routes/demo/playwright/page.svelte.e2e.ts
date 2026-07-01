import { expect, test } from '@playwright/test';

test('run audio playback and check for console errors', async ({ page }) => {
	page.on('console', (msg) => {
		console.log(`[BROWSER LOG] [${msg.type()}]: ${msg.text()}`);
	});
	page.on('pageerror', (err) => {
		console.error(`[BROWSER EXCEPTION]: ${err.message}\n${err.stack}`);
	});

	await page.goto('/');
	await page.waitForTimeout(1000);

	const playButton = page.locator('.sun-button');
	await expect(playButton).toBeVisible();

	console.log('Clicking play button in browser...');
	await playButton.click();

	// Wait 5 seconds to let the audio engine load and play
	await page.waitForTimeout(5000);
});
