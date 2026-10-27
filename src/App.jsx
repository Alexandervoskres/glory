import { useEffect, useState } from 'react'
import Preloader from './components/Preloader'
import SwordSlash from './components/SwordSlash'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Codex from './components/Codex'
import Marquee from './components/Marquee'
import Arsenal from './components/Arsenal'
import Armor from './components/Armor'
import Gallery from './components/Gallery'
import Stats from './components/Stats'
import Chronicle from './components/Chronicle'
import Legend from './components/Legend'
import Footer from './components/Footer'

function App() {
  const [loading, setLoading] = useState(true)

  // пока идёт загрузка — страницу не скроллим
  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : ''
  }, [loading])

  return (
    <>
      {loading && <Preloader onFinish={() => setLoading(false)} />}

      {/* фишка запускается после прелоадера, чтобы был виден показательный удар */}
      {!loading && <SwordSlash />}

      <div className="grain" />
      <div className="vignette" />

      <Navbar />

      <main>
        <Hero />
        <Codex />
        <Marquee />
        <Arsenal />
        <Armor />
        <Gallery />
        <Stats />
        <Chronicle />
        <Legend />
      </main>

      <Footer />
    </>
  )
}

export default App
