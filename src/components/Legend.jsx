import { useEffect, useRef } from 'react'
import Reveal from './Reveal'
import Sword from './Sword'

// большая цитата и огромный меч с параллаксом
function Legend() {
  const swordRef = useRef(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    function handleScroll() {
      const rect = sectionRef.current.getBoundingClientRect()
      const offset = rect.top * -0.25
      swordRef.current.style.transform = `translateY(${offset}px) rotate(8deg)`
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="legend" ref={sectionRef}>
      {/* меч и свечение в одном слое, который плавно тает сверху и снизу */}
      <div className="legend__bg">
        <div className="legend__glow" />
        <div className="legend__sword" ref={swordRef}>
          <Sword id="legend" blade={291} width={14} grip={66} guard={76} pommel="wheel" gripColor="#4a0f17" />
        </div>
      </div>

      <div className="container legend__content">
        <Reveal>
          <p className="label">Вне времени</p>
          <blockquote>
            Не тот рыцарь, кто носит доспех, а тот, кто держит <em>слово</em>.
          </blockquote>
          <p className="label legend__cite">— Кодекс рыцаря</p>
        </Reveal>
      </div>
    </section>
  )
}

export default Legend
