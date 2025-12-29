import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno (VITE_*)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    },
    define: {
      // Esto reemplaza literalmente process.env.API_KEY en el código por el string de la clave
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || "")
    }
  };
});