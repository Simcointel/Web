import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:5174/Web/')
        await asyncio.sleep(2)
        await page.screenshot(path='/home/jules/verification/ui_command.png')

        # Go to Corporate Suite
        await page.click('text=Suite')
        await asyncio.sleep(2)
        await page.screenshot(path='/home/jules/verification/ui_suite.png')

        # Go to OPS
        await page.click('text=OPS')
        await asyncio.sleep(1)
        await page.screenshot(path='/home/jules/verification/ui_ops.png')

        # Go to Flow
        await page.goto('http://localhost:5174/Web/flow')
        await asyncio.sleep(2)
        await page.screenshot(path='/home/jules/verification/ui_flow.png')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
