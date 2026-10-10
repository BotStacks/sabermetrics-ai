/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOTSTACKS_BOT_ID?: string;
  readonly VITE_BOTSTACKS_API_ORIGIN?: string;
  readonly VITE_GITHUB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
