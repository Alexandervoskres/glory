function Footer() {
  return (
    <footer className="footer">
      {/* его тоже можно разрубить */}
      <div className="container">
        <div className="footer__big" data-slice>
          GLORY
        </div>
      </div>

      <div className="container footer__row">
        <span className="label">© MMXXVI Glory</span>
        <span className="label footer__middle">Сделано с честью</span>
        <a href="#top" className="label footer__up">
          Наверх ↑
        </a>
      </div>
    </footer>
  )
}

export default Footer
