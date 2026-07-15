/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_BASE_PATH?: string
	readonly VITE_CONTENT_BASE_URL?: string
	readonly VITE_REMOTE_INDEX_URL?: string
	readonly VITE_PREFER_GZIP?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
