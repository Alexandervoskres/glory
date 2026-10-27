import { useEffect, useState } from 'react'

function Preloader({ onFinish }) {
  const [count, setCount] = useState(0)
  const [hide, setHide] = useState(false)

  useEffect(() => {
    let current = 0
    const timer = setInterval(() => {
      current += Math.ceil(Math.random() * 7)
      if (current >= 100) {
        current = 100
        clearInterval(timer)
        setTimeout(() => setHide(true), 300)
        setTimeout(onFinish, 1200)
      }
      setCount(current)
    }, 40)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`preloader ${hide ? 'preloader--hide' : ''}`}>
      <div className="preloader__name">
        Glory<span className="red-dot">.</span>
      </div>
      <div className="preloader__line">
        <div className="preloader__fill" style={{ width: count + '%' }} />
      </div>
      <div className="preloader__count">{String(count).padStart(3, '0')}</div>
    </div>
  )
}

export default Preloader
