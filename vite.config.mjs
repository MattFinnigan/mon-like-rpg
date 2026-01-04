export default {
  build: {
    rollupOptions: {
      input: 'src/main.js',
      output: {
        entryFileNames: 'main.bundle.js'
      }
    }
  }
}