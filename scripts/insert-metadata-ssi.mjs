import { readFile, writeFile } from 'node:fs/promises'

const file = new URL('../dist/index.html', import.meta.url)
const html = await readFile(file, 'utf8')
const metadata = /<meta\s+name="description"[\s\S]*?<\/title>/
if (!metadata.test(html)) {
  throw new Error('Could not locate the default metadata in dist/index.html')
}

await writeFile(file, html.replace(metadata, (tags) => [
  '<!--# block name="default_metadata" -->',
  tags,
  '<!--# endblock -->',
  '<!--# include virtual="/_piece-meta$metadata_route" stub="default_metadata" -->',
].join('\n')))
