import { useEffect, useRef, useState } from 'react'

function Hero() {
  const [cuts, setCuts] = useState(0)
  const knightRef = useRef(null)

  // рыцарь на фоне медленно уезжает при скролле (параллакс)
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > window.innerHeight * 1.5) return
      knightRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // SwordSlash сообщает о каждом ударе
  useEffect(() => {
    function handleCut() {
      setCuts((count) => count + 1)
    }
    window.addEventListener('sword-cut', handleCut)
    return () => window.removeEventListener('sword-cut', handleCut)
  }, [])

  return (
    <section className="hero container" id="top">
      {/* силуэт рыцаря на фоне */}
      <div className="hero__knight">
        <img src="/img/knight-sword.webp" alt="" ref={knightRef} />
      </div>

      <p className="label hero__label">Честь. Сталь. Верность.</p>

      {/* data-slice — это слово рисует и разрубает SwordSlash */}
      <h1 className="hero__title" data-slice>
        GLORY
      </h1>

      <div className="hero__row">
        <p className="hero__text">
          Тысяча лет тишины под забралом. Сталь, которая помнит клятву, и роза, ради которой её носили.
        </p>

        <div className="hero__hint">
          <span className="hero__hint-slash" />
          <p className="label">
            Взмахни мечом
            <br />
            сквозь слово
          </p>
        </div>
      </div>

      <div className="hero__bottom">
        <span className="label">
          Ударов: <b className="hero__cuts">{String(cuts).padStart(2, '0')}</b>
        </span>
        <a href="#codex" className="scroll-hint">
          <span className="label">Листай</span>
          <span className="scroll-hint__line" />
        </a>
      </div>
    </section>
  )
}

export default Hero
