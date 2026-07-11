import ngrok from 'ngrok'

const token = process.env.NGROK_AUTHTOKEN
if (!token) {
  console.error('Set NGROK_AUTHTOKEN before starting the tunnel.')
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
