import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Go to the local dev server
        await page.goto('http://localhost:5175/Web/')

        # Click the Corporate Suite icon or link (it's the first button in the top left nav in the screenshot)
        # In our code, it's usually the main landing page or reachable via nav.
        # Based on the screenshot, we are already on COMMAND view.

        # Fill the ID and click Connect
        await page.fill('input[placeholder="Company ID (e.g. 1664165)"]', '1664165')
        await page.click('button:has-text("CONNECT")')

        # Wait for the profile to appear
        await page.wait_for_selector('text=COMPANY PROFILE', timeout=5000)

        # Wait a bit for images/data to settle
        await asyncio.sleep(2)

        # Take screenshot of the top area
        await page.screenshot(path='/home/jules/verification/connected_profile.png', clip={'x': 0, 'y': 0, 'width': 1200, 'height': 800})

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
