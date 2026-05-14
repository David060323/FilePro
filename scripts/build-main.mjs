import { build } from 'esbuild'
import { resolve } from 'path'

const root = resolve(import.meta.dirname, '..')
const src = (p) => resolve(root, 'src', p)
const out = (p) => resolve(root, 'dist', p)

// Build main process
await build({
  entryPoints: [src('main/index.ts')],
  outfile: out('main/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['electron', 'sharp', 'pdf-lib'],
  sourcemap: false,
  minify: false
})
console.log('Main built: dist/main/index.js')

// Build preload
await build({
  entryPoints: [src('preload/index.ts')],
  outfile: out('preload/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['electron'],
  sourcemap: false,
  minify: false
})
console.log('Preload built: dist/preload/index.js')
