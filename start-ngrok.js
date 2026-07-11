import ngrok from 'ngrok';
import fs from 'fs';

(async function() {
  try {
    const url = await ngrok.connect(5173);
    console.log(`Ngrok tunnel opened at: ${url}`);
    
    // Read or create .env
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    // Update or append VITE_API_URL
    if (envContent.includes('VITE_API_URL=')) {
      envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL=${url}`);
    } else {
      envContent += `\nVITE_API_URL=${url}\n`;
    }
    
    fs.writeFileSync('.env', envContent);
    console.log('Successfully added to .env');
    
    // Keep process alive
    console.log('Press Ctrl+C to close the tunnel.');
  } catch (err) {
    console.error('Error starting ngrok:', err);
    process.exit(1);
  }
})();
