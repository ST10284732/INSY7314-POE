import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    https: (() => {
      try {
        const keyPath = path.resolve(__dirname, 'ssl', 'key.pem');
        const certPath = path.resolve(__dirname, 'ssl', 'cert.pem');
        
        // Check if SSL certificates exist
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          console.log('✓ SSL certificates found - Starting HTTPS server');
          return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
          };
        } else {
          console.log('⚠ SSL certificates not found - Run "node generate-ssl.js" to create them');
          console.log('  Starting HTTP server instead...');
          return false;
        }
      } catch (error) {
        console.error('Error loading SSL certificates:', error.message);
        console.log('  Starting HTTP server instead...');
        return false;
      }
    })()
  },
})
