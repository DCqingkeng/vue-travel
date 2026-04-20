import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-vue';
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        port: 53496,
    }
})
