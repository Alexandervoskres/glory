import { marqueeWords } from '../data'

function Marquee() {
  // дублируем слова, чтобы лента крутилась без разрыва
  const words = [...marqueeWords, ...marqueeWords]

  return (
    <div className="marquee">
      <div className="marquee__track">
        {words.map((word, index) => (
          <span key={index} className="marquee__item">
            {word}
            <span className="marquee__star">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default Marquee
