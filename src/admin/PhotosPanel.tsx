import { useState } from 'react'
import PhotoPicker from '../components/PhotoPicker'

export default function PhotosPanel() {
  const [selected, setSelected] = useState<number[]>([])
  return (
    <section>
      <h2>Photo library</h2>
      <p className="panel-hint">
        Upload images once here, then pick them for gallery pieces and articles.
      </p>
      <PhotoPicker
        selectedIds={selected}
        onToggle={(id) =>
          setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          )
        }
      />
    </section>
  )
}