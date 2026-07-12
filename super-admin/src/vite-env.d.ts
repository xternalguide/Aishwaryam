/// <reference types="vite/client" />

interface Window {
  fetchWithCache: (url: string, options?: any) => Promise<any>;
}
