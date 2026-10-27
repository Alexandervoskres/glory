import Reveal from './Reveal'
import { virtues } from '../data'

function Codex() {
  return (
    <section className="section container codex" id="codex">
      <div className="codex__intro">
        <Reveal>
          <h2>Кодекс</h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="big-text">
            Каждый рыцарь начинается с вопроса: <em>ради чего ты держишь меч?</em> Всё остальное — следствие.
          </p>
          <p className="muted-text">
            Пять добродетелей, которые нельзя выковать в кузне. Их носят под доспехом.
          </p>
        </Reveal>
      </div>

      <ul className="virtues">
        {virtues.map((virtue, index) => (
          <li key={virtue.name}>
            <Reveal delay={index * 100} className="virtue">
              <span className="virtue__num">0{index + 1}</span>
              <h3 className="virtue__name">{virtue.name}</h3>
              <p className="virtue__text">{virtue.text}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Codex
