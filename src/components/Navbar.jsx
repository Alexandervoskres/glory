import { useEffect, useState } from 'react'
import { navLinks } from '../data'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40)

      // ищем секцию, которая сейчас на экране
      let current = ''
      navLinks.forEach((link) => {
        const section = document.getElementById(link.id)
        if (section && section.getBoundingClientRect().top < window.innerHeight * 0.4) {
          current = link.id
        }
      })
      setActive(current)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <a href="#top" className="logo" onClick={() => setMenuOpen(false)}>
        Glory<span className="red-dot">.</span>
      </a>

      <nav className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
        {navLinks.map((link) => (
          <a
            key={link.id}
            href={'#' + link.id}
            className={active === link.id ? 'active' : ''}
            onClick={() => setMenuOpen(false)}
          >
            {link.title}
          </a>
        ))}
      </nav>

      <span className="nav-lang">RU</span>

      <button
        className={`burger ${menuOpen ? 'burger--open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Меню"
      >
        <span />
        <span />
      </button>
    </header>
  )
}

export default Navbar
