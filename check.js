import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173');
  
  // Login with correct credentials (we can create one first)
  // Register:
  await page.waitForSelector('input[type="text"]');
  await page.fill('input[type="text"]', 'bot_' + Date.now());
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button:has-text("Register")');
  
  await page.waitForTimeout(2000);
  
  // Select character
  const classSelectors = await page.$$('div.class-card');
  if (classSelectors.length > 0) {
     await classSelectors[0].click();
     await page.click('button:has-text("Enter World")');
  }
  
  await page.waitForTimeout(10000); // wait longer to see if it crashes
  await browser.close();
})();
