// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'functions/lib/*'],
  },
  {
    // React Compiler'ın yeni kuralı: efekt başında yükleme durumunu sıfırlayan
    // hook'larımız bilinçli olarak böyle yazıldı (abonelik/aralık başlarken
    // state'i temizler). Davranışı değiştirmeden uyarı olarak izliyoruz.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
]);
