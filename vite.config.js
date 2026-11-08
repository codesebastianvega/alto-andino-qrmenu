import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-manifest-dev',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/manifest')) {
            try {
              const url = new URL(req.url, 'http://localhost:5173');
              const slug = url.searchParams.get('slug') || url.searchParams.get('brand') || '';
              const isBoku = slug === 'boku-bento';
              const manifest = {
                name: isBoku ? 'BOKU BENTO' : (slug ? `${slug.toUpperCase()}` : 'Aluna | Menús Digitales'),
                short_name: isBoku ? 'BOKU' : (slug || 'Aluna'),
                start_url: slug ? `/${slug}/` : '/',
                scope: '/',
                display: 'standalone',
                orientation: 'any',
                background_color: isBoku ? '#bc0e0e' : '#0A0A0A',
                theme_color: isBoku ? '#bc0e0e' : '#0A0A0A',
                icons: [
                  { src: isBoku ? '/boku-icon-192.png' : '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                  { src: isBoku ? '/boku-icon-512.png' : '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                  { src: isBoku ? '/boku-icon-512.png' : '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
              };
              res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
              res.end(JSON.stringify(manifest));
            } catch {
              next();
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('framer-motion')) return 'framer';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('lucide-react')) return 'icons';
            return 'vendor';
          }
        }
      }
    }
  }
});
