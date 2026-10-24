import { defineConfig, devices } from '@playwright/test';
const baseURL=`http://127.0.0.1:${process.env.E2E_PORT||'3100'}`;
export default defineConfig({
 testDir:'./tests/e2e', fullyParallel:false, workers:1,
 use:{baseURL,launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']},...devices['iPhone 13'],defaultBrowserType:'chromium'},
 webServer:{command:`npm run start -- --port ${process.env.E2E_PORT||'3100'}`,url:baseURL,reuseExistingServer:!process.env.CI,timeout:60000},
 reporter:'list',
});
