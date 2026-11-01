import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'feedback-api',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              if (req.url === '/api/feedback' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  try {
                    const { message, screenshot } = JSON.parse(body);
                    const feedbackDir = path.resolve(__dirname, 'feedback');
                    if (!fs.existsSync(feedbackDir)) {
                      fs.mkdirSync(feedbackDir, { recursive: true });
                    }
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    
                    // Save metadata
                    fs.writeFileSync(
                      path.join(feedbackDir, `feedback-${timestamp}.json`),
                      JSON.stringify({ timestamp, message }, null, 2)
                    );
                    
                    // Save screenshot
                    if (screenshot && screenshot.startsWith('data:image/png;base64,')) {
                      const base64Data = screenshot.replace(/^data:image\/png;base64,/, "");
                      fs.writeFileSync(
                        path.join(feedbackDir, `feedback-${timestamp}.png`),
                        base64Data,
                        'base64'
                      );
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Feedback saved' }));
                  } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: String(err) }));
                  }
                });
              } else {
                next();
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
