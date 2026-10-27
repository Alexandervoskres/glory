import { useEffect, useState } from 'react'
import Reveal from './Reveal'
import { gallery, orders } from '../data'

function Gallery() {
  const [selected, setSelected] = useState(null)

  // закрытие по Esc
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <section className="section container" id="gallery">
      <div className="gallery__head">
        <Reveal>
          <h2>Галерея</h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="big-text">
            Две розы, две клятвы. Алая и белая — в руках из чёрной стали.
          </p>
          <p className="label gallery__orders">Также: {orders.join(' · ')}</p>
        </Reveal>
      </div>

      <div className="gallery__grid">
        {gallery.map((item, index) => (
          <Reveal key={item.id} delay={index * 150} className="card">
            <p className="label card__meta">
              {item.number} · {item.tag}
            </p>
            <h3 className="card__title">{item.title}</h3>

            <button className="card__image" onClick={() => setSelected(item)}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <span className="card__open label">Открыть</span>
            </button>

            <p className="card__quote">«{item.quote}»</p>
            <p className="card__text">{item.text}</p>
          </Reveal>
        ))}
      </div>

      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <button className="lightbox__close label">Закрыть ✕</button>
          <img src={selected.image} alt={selected.title} onClick={(e) => e.stopPropagation()} />
          <p className="lightbox__caption">
            <span className="label">{selected.number}</span> {selected.title}
          </p>
        </div>
      )}
    </section>
  )
}

export default Gallery
