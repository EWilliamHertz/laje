const token = process.env.NGROK_AUTHTOKEN
if (!token) {
  console.error('Set NGROK_AUTHTOKEN before starting the tunnel.')
  process.exit(1)
}

let ngrok
try {
  ;({ default: ngrok } = await import('ngrok'))
} catch {
  console.error('The ngrok dependency is not installed. Run `npm install` in the Laje folder, then retry `npm run tunnel`.')
  process.exit(1)
}

try {
  const url = await ngrok.connect({ addr: 5173, proto: 'http', authtoken: token })
  console.log(`Public Laje URL: ${url}`)
  console.log('Keep this process running while you play. Press Ctrl+C to close the tunnel.')
  await new Promise(() => {})
} catch (error) {
  console.error('Could not start ngrok:', error.message)
  process.exit(1)
}
