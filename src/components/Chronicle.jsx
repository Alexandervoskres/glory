import Reveal from './Reveal'
import { chronicle } from '../data'

function Chronicle() {
  return (
    <section className="section container chronicle" id="chronicle">
      <div className="chronicle__side">
        <Reveal>
          <h2>Хроника</h2>
          <p className="muted-text">
            Пять дат, между которыми рыцарство родилось, расцвело и стало легендой.
          </p>
        </Reveal>
      </div>

      <div className="chronicle__list">
        {chronicle.map((item) => (
          <Reveal key={item.year} className="event">
            <span className="event__year">{item.year}</span>
            <div>
              <h3 className="event__title">{item.title}</h3>
              <p className="event__text">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default Chronicle
