import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Markdown, { renderMarkdown } from './Markdown'

describe('Markdown', () => {
  it('renders headings, lists, and paragraphs', () => {
    const md = '# Hello\n\n## Section\n\n- one\n- two\n\nPlain paragraph.'
    const { container } = render(<Markdown source={md} />)
    expect(container.querySelector('h1')?.textContent).toBe('Hello')
    expect(container.querySelector('h2')?.textContent).toBe('Section')
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(container.querySelectorAll('p')).toHaveLength(1)
    expect(container).toHaveTextContent('Plain paragraph.')
  })

  it('renders bold, emphasis, and links', () => {
    const { container } = render(<Markdown source={'**bold** *em* [link](https://x.io)'} />)
    expect(container.querySelector('strong')?.textContent).toBe('bold')
    expect(container.querySelector('em')?.textContent).toBe('em')
    const a = container.querySelector('a')
    expect(a?.textContent).toBe('link')
    expect(a?.getAttribute('href')).toBe('https://x.io')
  })

  it('escapes raw HTML and preserves the literal text', () => {
    const { container } = render(<Markdown source={'<script>alert(1)</script>'} />)
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
  })

  it('neutralizes dangerous link schemes', () => {
    const { container } = render(<Markdown source="[bad](javascript:alert(1))" />)
    const a = container.querySelector('a')
    expect(a?.getAttribute('href')).toBe('#')
  })

  it('escapes double quotes in link hrefs (no attribute breakout)', () => {
    const { container } = render(<Markdown source='[q](https://x.io"onmouseover="alert(1))' />)
    const a = container.querySelector('a')
    expect(a?.getAttribute('href')).toBe('https://x.io"onmouseover="alert(1')
    expect(a?.getAttribute('onmouseover')).toBeNull()
  })

  it('allows http, https, mailto, and relative links', () => {
    const { container } = render(
      <Markdown source="[a](https://x.io) [r](/about) [m](mailto:a@b.c)" />,
    )
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['https://x.io', '/about', 'mailto:a@b.c'])
  })

  it('closes a list before a heading or paragraph', () => {
    const { container } = render(<Markdown source={'- item\n\nParagraph\n\n- next'} />)
    expect(container.querySelectorAll('ul')).toHaveLength(2)
    expect(container.querySelectorAll('li')).toHaveLength(2)
  })

  it('renderMarkdown produces expected prose output', () => {
    expect(renderMarkdown('## Title')).toBe('<h2>Title</h2>')
    expect(renderMarkdown('')).toBe('')
  })
})