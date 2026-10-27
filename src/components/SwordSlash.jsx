import { useEffect, useRef } from 'react'

/*
  Главная фишка сайта — "Удар мечом".
  Все элементы с атрибутом data-slice рисуются на canvas как полированная сталь.
  Если резко махнуть мышкой (или пальцем) сквозь слово — оно разрубается
  по линии взмаха: куски разлетаются, срез раскаляется, летят искры.
  Через пару секунд сталь сама "сваривается" обратно.
*/

const MAX_PIECES = 30 // больше кусков не режем, чтобы не тормозило
const SWING_SPEED = 0.9 // скорость мыши (px в мс), с которой движение считается взмахом

function lerp(a, b, t) {
  return a + (b - a) * t
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function rotate(v, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos }
}

// с какой стороны от прямой ab лежит точка p (> 0 с одной, < 0 с другой)
function side(a, b, p) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
}

// точка пересечения отрезков ab и cd (или null)
function intersect(a, b, c, d) {
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x)
  if (den === 0) return null
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

// режем выпуклый многоугольник прямой ab на две части
function splitPolygon(poly, a, b) {
  const left = []
  const right = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const sp = side(a, b, p)
    const sq = side(a, b, q)
    if (sp >= 0) left.push(p)
    if (sp <= 0) right.push(p)
    if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) {
      const t = sp / (sp - sq)
      const point = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }
      left.push(point)
      right.push(point)
    }
  }
  return [left, right]
}

function area(poly) {
  let sum = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    sum += p.x * q.y - q.x * p.y
  }
  return Math.abs(sum / 2)
}

function center(poly) {
  let x = 0
  let y = 0
  poly.forEach((p) => {
    x += p.x
    y += p.y
  })
  return { x: x / poly.length, y: y / poly.length }
}

function SwordSlash() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    let targets = []
    let sparks = []
    let trail = []
    let flashes = []
    let history = []
    let shake = 0
    let swingId = 0
    let swingCounted = false
    let demo = null
    let animationId
    let demoTimer

    const pointer = { x: -9999, y: -9999, time: 0, speed: 0 }

    // ---------- куски слова ----------

    // точка экрана -> координаты внутри куска
    function toLocal(piece, point, origin) {
      const v = rotate(
        {
          x: point.x - origin.left - piece.x - piece.cx,
          y: point.y - origin.top - piece.y - piece.cy,
        },
        -piece.rot
      )
      return { x: v.x + piece.cx, y: v.y + piece.cy }
    }

    // координаты внутри куска -> точка экрана
    function toWorld(piece, point, origin) {
      const v = rotate({ x: point.x - piece.cx, y: point.y - piece.cy }, piece.rot)
      return {
        x: v.x + piece.cx + piece.x + origin.left,
        y: v.y + piece.cy + piece.y + origin.top,
      }
    }

    function makePiece(poly) {
      const c = center(poly)
      return { poly, cx: c.x, cy: c.y, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, cuts: [], swing: -1 }
    }

    // новый кусок из старого: центр вращения меняется, поэтому пересчитываем сдвиг
    function makeChild(parent, poly) {
      const child = makePiece(poly)
      const shift = rotate({ x: child.cx - parent.cx, y: child.cy - parent.cy }, parent.rot)
      child.x = parent.x + shift.x + parent.cx - child.cx
      child.y = parent.y + shift.y + parent.cy - child.cy
      child.vx = parent.vx
      child.vy = parent.vy
      child.rot = parent.rot
      child.vr = parent.vr
      child.cuts = [...parent.cuts]
      return child
    }

    // рисуем слово сталью на отдельном canvas
    function buildTarget(el) {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      const word = el.textContent
      const pad = 60
      const w = rect.width
      const h = rect.height

      const textCanvas = document.createElement('canvas')
      textCanvas.width = Math.ceil((w + pad * 2) * dpr)
      textCanvas.height = Math.ceil((h + pad * 2) * dpr)
      const tctx = textCanvas.getContext('2d')
      tctx.scale(dpr, dpr)
      tctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      if ('letterSpacing' in tctx && style.letterSpacing !== 'normal') {
        tctx.letterSpacing = style.letterSpacing
      }

      const m = tctx.measureText(word)
      // базовая линия как у браузера
      let baseline
      if (m.fontBoundingBoxAscent) {
        const fontHeight = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent
        baseline = (h - fontHeight) / 2 + m.fontBoundingBoxAscent
      } else {
        baseline = h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
      }

      let startX = 0
      if (style.textAlign === 'center') startX = (w - m.width) / 2

      const inkTop = baseline - m.actualBoundingBoxAscent
      const inkBottom = baseline + m.actualBoundingBoxDescent
      const inkLeft = startX - m.actualBoundingBoxLeft
      const inkRight = startX + m.actualBoundingBoxRight

      // "полированная сталь": светлый верх, тёмная линия горизонта, снова светлый низ
      const grad = tctx.createLinearGradient(0, pad + inkTop, 0, pad + inkBottom)
      grad.addColorStop(0, '#fbf7ef')
      grad.addColorStop(0.42, '#c9c3b8')
      grad.addColorStop(0.5, '#6e6a64')
      grad.addColorStop(0.56, '#e4ded3')
      grad.addColorStop(1, '#8f8a82')
      tctx.fillStyle = grad
      tctx.fillText(word, pad + startX, pad + baseline)

      // тонкая светлая кромка сверху букв
      tctx.globalCompositeOperation = 'source-atop'
      tctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      tctx.fillText(word, pad + startX, pad + baseline - 1.5)

      // прямоугольник вокруг букв — его и режем
      const poly = [
        { x: inkLeft - 14, y: inkTop - 14 },
        { x: inkRight + 14, y: inkTop - 14 },
        { x: inkRight + 14, y: inkBottom + 14 },
        { x: inkLeft - 14, y: inkBottom + 14 },
      ]

      return {
        el,
        canvas: textCanvas,
        w,
        h,
        pad,
        poly,
        ink: { left: inkLeft, right: inkRight, top: inkTop, bottom: inkBottom },
        pieces: [makePiece(poly)],
        lastCut: 0,
        weldTime: 0,
        sheen: -300,
      }
    }

    function buildAll() {
      const elements = document.querySelectorAll('[data-slice]')
      targets = Array.from(elements).map(buildTarget)
    }

    // ---------- искры ----------

    function spawnSparks(p1, p2, dir, count, slow) {
      const baseAngle = Math.atan2(dir.y, dir.x)
      for (let i = 0; i < count; i++) {
        const t = Math.random()
        const speed = slow ? 0.5 + Math.random() * 2 : 2 + Math.random() * 8
        const angle = baseAngle + (Math.random() - 0.5) * (slow ? 6 : 1.7)
        sparks.push({
          x: lerp(p1.x, p2.x, t),
          y: lerp(p1.y, p2.y, t),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 2,
          life: 0,
          maxLife: 25 + Math.random() * 40,
        })
      }
    }

    // ---------- удар ----------

    function trySlice(a, b, power, silent) {
      const length = Math.hypot(b.x - a.x, b.y - a.y)
      if (length < 20) return

      const dir = { x: (b.x - a.x) / length, y: (b.y - a.y) / length }
      const normal = { x: -dir.y, y: dir.x }
      const now = performance.now()
      let cutSomething = false

      targets.forEach((target) => {
        const origin = target.el.getBoundingClientRect()
        const newPieces = []
        let cutThisTarget = false

        target.pieces.forEach((piece) => {
          if (piece.swing === swingId || target.pieces.length >= MAX_PIECES) {
            newPieces.push(piece)
            return
          }

          const la = toLocal(piece, a, origin)
          const lb = toLocal(piece, b, origin)

          // взмах должен пройти кусок насквозь — два пересечения с краями
          const hits = []
          for (let i = 0; i < piece.poly.length; i++) {
            const hit = intersect(la, lb, piece.poly[i], piece.poly[(i + 1) % piece.poly.length])
            if (hit) hits.push(hit)
          }
          if (hits.length < 2) {
            newPieces.push(piece)
            return
          }

          const [left, right] = splitPolygon(piece.poly, la, lb)
          if (area(left) < 250 || area(right) < 250) {
            newPieces.push(piece)
            return
          }

          const cut = { a: hits[0], b: hits[1], time: now }
          const force = 2 + Math.random() * 1.5

          // одна половинка уходит в одну сторону, вторая в другую
          const halves = [
            { poly: left, sign: 1 },
            { poly: right, sign: -1 },
          ]
          halves.forEach((half) => {
            const child = makeChild(piece, half.poly)
            child.cuts.push(cut)
            child.vx += normal.x * force * half.sign + dir.x * power
            child.vy += normal.y * force * half.sign + dir.y * power
            child.vr += half.sign * (0.002 + Math.random() * 0.004)
            child.swing = swingId
            newPieces.push(child)
          })

          spawnSparks(toWorld(piece, hits[0], origin), toWorld(piece, hits[1], origin), dir, 28, false)
          cutThisTarget = true
        })

        target.pieces = newPieces
        if (cutThisTarget) {
          target.lastCut = now
          target.weldTime = 0
          cutSomething = true
        }
      })

      if (cutSomething) {
        shake = 9
        flashes.push({
          a: { x: a.x - dir.x * 80, y: a.y - dir.y * 80 },
          b: { x: b.x + dir.x * 80, y: b.y + dir.y * 80 },
          time: now,
        })
        // считаем удары (один взмах = один удар)
        if (!silent && !swingCounted) {
          swingCounted = true
          window.dispatchEvent(new Event('sword-cut'))
        }
      }
    }

    // ---------- мышь и пальцы ----------

    function handleMove(x, y) {
      const now = performance.now()
      const dt = Math.max(now - pointer.time, 1)
      const dist = Math.hypot(x - pointer.x, y - pointer.y)
      pointer.speed = pointer.time ? lerp(pointer.speed, dist / dt, 0.6) : 0
      pointer.x = x
      pointer.y = y
      pointer.time = now

      history.push({ x, y, time: now })
      while (history.length && now - history[0].time > 220) history.shift()

      if (pointer.speed > SWING_SPEED && dist > 2) {
        trail.push({ x, y, time: now })
        trySlice(history[0], { x, y }, Math.min(pointer.speed * 1.2, 5))
      } else if (pointer.speed < 0.3) {
        // взмах закончился
        swingId++
        swingCounted = false
      }
    }

    function onMouseMove(e) {
      handleMove(e.clientX, e.clientY)
    }

    function onTouchStart(e) {
      const touch = e.touches[0]
      pointer.x = touch.clientX
      pointer.y = touch.clientY
      pointer.time = performance.now()
      pointer.speed = 0
      history = []
      swingId++
      swingCounted = false
    }

    function onTouchMove(e) {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    // ---------- размеры ----------

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      buildAll()
    }

    let resizeTimer
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resize, 150)
    }

    // ---------- отрисовка ----------

    function drawTarget(target, now) {
      const origin = target.el.getBoundingClientRect()
      if (origin.bottom < -200 || origin.top > height + 200) return

      // физика кусков
      const sinceCut = now - target.lastCut
      // пока слово целое — оно стоит на месте, падают только разрубленные куски
      const isCut = target.pieces.length > 1
      const healing = isCut && sinceCut > 1600
      let maxOffset = 0

      target.pieces.forEach((p) => {
        if (!isCut) {
          p.x = 0
          p.y = 0
          p.rot = 0
          p.vx = 0
          p.vy = 0
          p.vr = 0
          return
        }

        if (healing) {
          // пружина тянет кусок на место
          p.vx += -p.x * 0.014
          p.vy += -p.y * 0.014
          p.vr += -p.rot * 0.014
          p.vx *= 0.85
          p.vy *= 0.85
          p.vr *= 0.85
        } else {
          p.vy += 0.06 // после разреза куски проседают вниз
          p.vx *= 0.93
          p.vy *= 0.93
          p.vr *= 0.93
        }
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        maxOffset = Math.max(maxOffset, Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.rot) * 300)
      })

      // все куски вернулись — свариваем швы
      if (healing && maxOffset < 1.5 && !target.weldTime) {
        target.weldTime = now
        target.pieces.forEach((p) => {
          p.cuts.forEach((cut) => {
            spawnSparks(toWorld(p, cut.a, origin), toWorld(p, cut.b, origin), { x: 0, y: -1 }, 4, true)
          })
        })
      }
      if (target.weldTime && now - target.weldTime > 900) {
        target.pieces = [makePiece(target.poly)]
        target.weldTime = 0
      }

      // блик бежит по стали: за мышкой, если она рядом, иначе сам по себе
      const mouseNear =
        now - pointer.time < 2000 && pointer.y > origin.top - 150 && pointer.y < origin.bottom + 150
      const sheenGoal = mouseNear
        ? pointer.x - origin.left
        : ((now / 1000) % 6) / 6 * (target.w + 900) - 450
      target.sheen = mouseNear ? lerp(target.sheen, sheenGoal, 0.12) : sheenGoal

      const weldGlow = target.weldTime ? 1 - (now - target.weldTime) / 900 : 0

      target.pieces.forEach((p) => {
        ctx.save()
        ctx.translate(origin.left + p.x + p.cx, origin.top + p.y + p.cy)
        ctx.rotate(p.rot)
        ctx.translate(-p.cx, -p.cy)

        ctx.beginPath()
        p.poly.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        })
        ctx.closePath()
        ctx.clip()

        ctx.drawImage(target.canvas, -target.pad, -target.pad, target.w + target.pad * 2, target.h + target.pad * 2)

        // блик рисуется только поверх букв
        ctx.globalCompositeOperation = 'source-atop'
        const sx = target.sheen
        const sheen = ctx.createLinearGradient(sx - 180, 0, sx + 180, target.h)
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0)')
        sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)')
        sheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = sheen
        ctx.fillRect(-target.pad, -target.pad, target.w + target.pad * 2, target.h + target.pad * 2)

        // раскалённые срезы
        ctx.globalCompositeOperation = 'lighter'
        ctx.lineCap = 'round'
        p.cuts.forEach((cut) => {
          const glow = Math.max(1 - (now - cut.time) / 1800, weldGlow)
          if (glow <= 0) return
          ctx.strokeStyle = `rgba(255, 70, 30, ${glow * 0.7})`
          ctx.lineWidth = 8
          ctx.beginPath()
          ctx.moveTo(cut.a.x, cut.a.y)
          ctx.lineTo(cut.b.x, cut.b.y)
          ctx.stroke()
          ctx.strokeStyle = `rgba(255, 235, 190, ${glow})`
          ctx.lineWidth = 2
          ctx.stroke()
        })

        ctx.restore()
      })
    }

    function drawTrail(now) {
      const life = 170
      trail = trail.filter((p) => now - p.time < life)
      if (trail.length < 2) return

      ctx.lineCap = 'round'
      // сначала красное свечение, потом белое ядро
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 1; i < trail.length; i++) {
          const t = 1 - (now - trail[i].time) / life
          ctx.beginPath()
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
          ctx.lineTo(trail[i].x, trail[i].y)
          if (pass === 0) {
            ctx.strokeStyle = `rgba(200, 16, 46, ${t * 0.45})`
            ctx.lineWidth = 16 * t
          } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${t * 0.95})`
            ctx.lineWidth = 3 * t + 0.5
          }
          ctx.stroke()
        }
      }
    }

    function drawFlashes(now) {
      flashes = flashes.filter((f) => now - f.time < 260)
      flashes.forEach((f) => {
        const t = 1 - (now - f.time) / 260
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(f.a.x, f.a.y)
        ctx.lineTo(f.b.x, f.b.y)
        ctx.strokeStyle = `rgba(255, 60, 60, ${t * 0.3})`
        ctx.lineWidth = 14 * t
        ctx.stroke()
        ctx.strokeStyle = `rgba(255, 255, 255, ${t})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      })
    }

    function drawSparks() {
      sparks = sparks.filter((s) => s.life < s.maxLife)
      ctx.lineCap = 'round'
      sparks.forEach((s) => {
        s.vy += 0.18
        s.vx *= 0.97
        s.vy *= 0.97
        s.x += s.vx
        s.y += s.vy
        s.life++

        // от белого к оранжевому и красному
        const r = s.life / s.maxLife
        const hue = 50 - 45 * r
        const light = 92 - 42 * r
        ctx.strokeStyle = `hsla(${hue}, 100%, ${light}%, ${1 - r})`
        ctx.lineWidth = 1.8 * (1 - r) + 0.4
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5)
        ctx.stroke()
      })
    }

    // показательный удар после загрузки, чтобы было понятно что можно делать
    function updateDemo(now) {
      if (!demo) return
      const t = (now - demo.start) / 200
      const ease = 1 - Math.pow(1 - Math.min(t, 1), 3)
      trail.push({ x: lerp(demo.a.x, demo.b.x, ease), y: lerp(demo.a.y, demo.b.y, ease), time: now })
      if (t >= 1) {
        swingId++
        trySlice(demo.a, demo.b, 4, true)
        swingId++
        demo = null
      }
    }

    function startDemo() {
      const target = targets[0]
      if (!target) return
      const origin = target.el.getBoundingClientRect()
      if (origin.bottom < 0) return // уже ушли со страницы
      demo = {
        start: performance.now(),
        a: { x: origin.left + target.ink.left - 90, y: origin.top + target.ink.bottom + 10 },
        b: { x: origin.left + target.ink.right + 90, y: origin.top + target.ink.top - 5 },
      }
    }

    function animate() {
      const now = performance.now()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      // тряска после удара
      if (shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
        shake *= 0.85
      }

      updateDemo(now)
      targets.forEach((target) => drawTarget(target, now))

      ctx.globalCompositeOperation = 'lighter'
      drawFlashes(now)
      drawTrail(now)
      drawSparks()
      ctx.globalCompositeOperation = 'source-over'

      animationId = requestAnimationFrame(animate)
    }

    resize()
    document.fonts.ready.then(() => {
      buildAll()
      demoTimer = setTimeout(startDemo, 900)
    })

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      clearTimeout(resizeTimer)
      clearTimeout(demoTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="slash-canvas" />
}

export default SwordSlash
