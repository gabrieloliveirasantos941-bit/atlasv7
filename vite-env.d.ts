/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    FIREBASE_CONFIG: any;
  }
}