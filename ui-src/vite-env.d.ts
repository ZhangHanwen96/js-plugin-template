/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    VITE_PLUGIN_ENV: 'testing' | 'production' | 'stage' | 'loreal'
  }
}
