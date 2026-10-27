import { useState } from 'react'
import Reveal from './Reveal'
import Helmet from './Helmet'
import { armorParts, helmets } from '../data'

function Armor() {
  const [active, setActive] = useState(0)

  return (
    <section className="section container" id="armor">
      <div className="armor">
        <Reveal className="armor__figure">
          <div className="armor__image">
            <img src="/img/knight-rose.png" alt="Рыцарь в латах с розой" />

            {armorParts.map((part, index) => (
              <button
                key={part.name}
                className={`hotspot ${active === index ? 'hotspot--active' : ''}`}
                style={{ left: part.x + '%', top: part.y + '%' }}
                onMouseEnter={() => setActive(index)}
                onClick={() => setActive(index)}
                aria-label={part.name}
              >
                <span className="hotspot__dot" />
                <span className="hotspot__label label">{part.name}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="armor__info">
          <Reveal>
            <h2>Доспех</h2>
            <p className="big-text">
              Около <em>двадцати пяти килограммов</em> стали, разложенных по всему телу. В хорошем доспехе рыцарь мог
              бежать, подниматься с земли и вскакивать в седло.
            </p>
          </Reveal>

          <ul className="parts">
            {armorParts.map((part, index) => (
              <li
                key={part.name}
                className={`part ${active === index ? 'part--active' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => setActive(index)}
              >
                <span className="part__num">0{index + 1}</span>
                <div>
                  <h3 className="part__name">{part.name}</h3>
                  <p className="part__text">{part.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="helmets">
        <Reveal>
          <p className="label section-label">Шлемы · три века эволюции</p>
        </Reveal>
        <div className="helmets__grid">
          {helmets.map((helmet, index) => (
            <Reveal key={helmet.type} delay={index * 120} className="helmet">
              <Helmet type={helmet.type} />
              <p className="label">{helmet.century}</p>
              <h3>{helmet.name}</h3>
              <p className="helmet__text">{helmet.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Armor
