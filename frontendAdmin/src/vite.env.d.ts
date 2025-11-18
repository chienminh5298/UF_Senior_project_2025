/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly ADMIN_USERNAME: string
    readonly ADMIN_PASSWORD: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  