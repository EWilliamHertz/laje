const token = process.env.NGROK_AUTHTOKEN
if (!token) {
  console.error('Set NGROK_AUTHTOKEN before starting the tunnel.')
  process.exit(1)
}

let ngrok
try {
  ;({ default: ngrok } = await import('@ngrok/ngrok'))
} catch {
  console.error('The @ngrok/ngrok dependency is not installed. Run `npm install -g @ngrok/ngrok`.')
  process.exit(1)
}

try {
  const listener = await ngrok.forward({ addr: 5173, authtoken: token })
  console.log(`Public Laje URL: ${listener.url()}`)
  console.log('Keep this process running while you play. Press Ctrl+C to close the tunnel.')
  setInterval(() => {}, 1000 * 60 * 60)
} catch (error) {
  console.error('Could not start ngrok:', error.message)
  process.exit(1)
}
