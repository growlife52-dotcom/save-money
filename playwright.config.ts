import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e', fullyParallel:false, workers:1,
 use:{baseURL:'http://127.0.0.1:3000',launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']},...devices['iPhone 13'],defaultBrowserType:'chromium'},
 webServer:{command:'npm run start',url:'http://127.0.0.1:3000',reuseExistingServer:!process.env.CI,timeout:60000},
 reporter:'list',
});
