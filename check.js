import puppeteer from 'puppeteer'

async function check() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', err => console.error('PAGE ERROR:', err))
  
  console.log('Navigating to http://localhost:5173')
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
  
  // Try to login to trigger the game
  try {
    await page.waitForSelector('button')
    console.log('Found buttons, simulating click...')
    // We can't easily script the whole login without specific selectors, but we can see initial errors.
  } catch (e) {}

  await browser.close()
}
check()
