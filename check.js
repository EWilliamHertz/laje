import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173');
  
  // Wait for login screen
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'testuser');
  await page.type('input[type="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // Wait for game to load
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
