import { useEffect, useRef, useState } from 'react'
import Sword from './Sword'
import { swords } from '../data'

// секция, которая при вертикальном скролле едет вбок
function Arsenal() {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const barRef = useRef(null)
  const [height, setHeight] = useState('400vh')
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    function calcHeight() {
      // высота секции = сколько нужно проехать вбок + один экран
      const distance = trackRef.current.scrollWidth - window.innerWidth
      setHeight(distance + window.innerHeight + 'px')
    }

    function handleScroll() {
      const section = sectionRef.current
      const rect = section.getBoundingClientRect()
      const maxScroll = section.offsetHeight - window.innerHeight
      const progress = Math.min(Math.max(-rect.top / maxScroll, 0), 1)
      const distance = trackRef.current.scrollWidth - window.innerWidth

      trackRef.current.style.transform = `translateX(${-progress * distance}px)`
      barRef.current.style.transform = `scaleX(${progress})`
      setCurrent(Math.round(progress * (swords.length - 1)))
    }

    function handleResize() {
      calcHeight()
      handleScroll()
    }

    handleResize()
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <section className="arsenal" id="arsenal" ref={sectionRef} style={{ height }}>
      <div className="arsenal__sticky">
        <div className="arsenal__top">
          <span className="label">Арсенал · все клинки в одном масштабе</span>
          <span className="label arsenal__counter">
            <b>{String(current + 1).padStart(2, '0')}</b> / {String(swords.length).padStart(2, '0')}
          </span>
        </div>

        <div className="arsenal__track" ref={trackRef}>
          <div className="arsenal__intro">
            <h2>Арсенал</h2>
            <p className="big-text">
              Семь клинков — от короткого рыцарского меча до двуручного гиганта. Листай, и они пройдут перед тобой
              как на смотре.
            </p>
          </div>

          {swords.map((sword) => (
            <article className="blade-card" key={sword.id}>
              <div className="blade-card__sword">
                <Sword id={sword.id} {...sword.shape} />
              </div>
              <div className="blade-card__info">
                <p className="label">{sword.era}</p>
                <h3>{sword.name}</h3>
                <p className="blade-card__specs">
                  <span>{sword.length}</span>
                  <span>{sword.weight}</span>
                </p>
                <p className="blade-card__text">{sword.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="arsenal__progress">
          <div className="arsenal__bar" ref={barRef} />
        </div>
      </div>
    </section>
  )
}

export default Arsenal
