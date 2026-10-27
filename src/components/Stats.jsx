import { useEffect, useRef, useState } from 'react'
import { stats } from '../data'

function Counter({ value, suffix, label }) {
  const ref = useRef(null)
  const [number, setNumber] = useState(0)

  useEffect(() => {
    let frame
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return
      observer.disconnect()

      const start = performance.now()
      const duration = 1800

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // замедление в конце
        setNumber(Math.round(value * eased))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })

    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  return (
    <div className="stat" ref={ref}>
      <div className="stat__value">
        {number}
        <span>{suffix}</span>
      </div>
      <p className="label">{label}</p>
    </div>
  )
}

function Stats() {
  return (
    <section className="stats container">
      {stats.map((item) => (
        <Counter key={item.label} {...item} />
      ))}
    </section>
  )
}

export default Stats
