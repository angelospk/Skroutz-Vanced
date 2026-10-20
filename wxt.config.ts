import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Skroutz Vanced',
    description: 'Price history bars, store scanning and cheapest-cart planning for Skroutz.gr',
    permissions: ['storage', 'unlimitedStorage'],
    host_permissions: ['https://www.skroutz.gr/*'],
  },
});
