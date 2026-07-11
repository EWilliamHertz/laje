import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const binary = path.join(root, 'ngrok')
const token = process.env.NGROK_AUTHTOKEN

if (!fs.existsSync(binary)) {
  console.error('ngrok binary not found. Install ngrok or place it at ./ngrok.')
  process.exit(1)
}
if (!token) {
  console.error('Set NGROK_AUTHTOKEN before starting the tunnel.')
  process.exit(1)
}

const configure = spawn(binary, ['config', 'add-authtoken', token], { stdio: 'inherit' })
configure.on('exit', (code) => {
  if (code !== 0) process.exit(code || 1)
  console.log('Starting public tunnel for the Vite app on port 5173…')
  const tunnel = spawn(binary, ['http', '5173'], { stdio: 'inherit' })
  tunnel.on('exit', (exitCode) => process.exit(exitCode || 0))
})
