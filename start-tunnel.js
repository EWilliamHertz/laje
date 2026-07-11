import localtunnel from 'localtunnel';
import fs from 'fs';

(async () => {
  const tunnel = await localtunnel({ port: 5173 });
  console.log(`Tunnel URL: ${tunnel.url}`);

  let envContent = '';
  if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
  }
  
  if (envContent.includes('VITE_API_URL=')) {
    envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL=${tunnel.url}`);
  } else {
    envContent += `\nVITE_API_URL=${tunnel.url}\n`;
  }
  
  fs.writeFileSync('.env', envContent);
  console.log('Added to .env');

  tunnel.on('close', () => {
    console.log('Tunnel closed');
  });
})();
