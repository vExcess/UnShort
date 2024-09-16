build:
	npx esbuild --minify --loader=ts < ./scripts/unshort.ts > ./scripts/unshort.js