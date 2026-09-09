import { renderMarkdown } from './markdownUtils'
// eslint-disable-next-line react/only-export-components
export { renderMarkdown }

export default function Markdown({ source }: { source: string }) {
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />
}