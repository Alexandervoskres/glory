/*
  Рисуем меч в SVG по параметрам:
  blade — длина клинка, width — ширина, grip — рукоять, guard — гарда,
  pommel — навершие (disc / pear / wheel), kind — форма клинка.
  Острие смотрит вверх, центр меча по x = 80.
*/

const CX = 80
const GUARD_H = 8

function straightBlade(blade, w) {
  const tip = w * 1.6
  return `M${CX} 0 L${CX + w * 0.32} ${tip} L${CX + w / 2} ${blade} L${CX - w / 2} ${blade} L${CX - w * 0.32} ${tip} Z`
}

function thrustBlade(blade, w) {
  const tip = w * 3
  return `M${CX} 0 L${CX + w * 0.4} ${tip} L${CX + w / 2} ${blade} L${CX - w / 2} ${blade} L${CX - w * 0.4} ${tip} Z`
}

function falchionBlade(blade, w) {
  const spine = CX - w * 0.3
  const edge = CX + w * 0.3
  return `M${spine} ${blade} L${spine} ${w * 0.6} Q${spine} ${w * 0.1} ${spine + w * 0.1} 0 Q${CX + w} ${blade * 0.06} ${CX + w * 0.7} ${blade * 0.3} L${edge} ${blade} Z`
}

// двуручник: внизу у гарды узкая рикассо с "ушками"
function greatBlade(blade, w, wavy) {
  const tip = w * 1.8
  const ricasso = blade - 60
  const right = []

  if (wavy) {
    // волнистое лезвие фламберга
    for (let y = tip; y < ricasso; y += 5) {
      const progress = (y - tip) / (ricasso - tip)
      const half = w * 0.33 + (w * 0.5 - w * 0.33) * progress + Math.sin(y / 13) * w * 0.13
      right.push([CX + half, y])
    }
  } else {
    right.push([CX + w * 0.35, tip])
  }

  right.push([CX + w / 2, ricasso])
  right.push([CX + w * 0.95, ricasso - 7]) // ушко
  right.push([CX + w * 0.42, ricasso + 9])
  right.push([CX + w * 0.3, blade])

  // левая сторона — зеркало правой
  const left = right.map(([x, y]) => [CX - (x - CX), y]).reverse()

  const points = [[CX, 0], ...right, ...left]
  return 'M' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + ' Z'
}

function Sword({ id, blade, width, grip, guard, pommel = 'disc', kind = 'straight', gripColor = '#211814' }) {
  const pommelH = pommel === 'pear' ? 26 : 22
  const total = blade + GUARD_H + grip + pommelH
  const gripTop = blade + GUARD_H
  const pommelY = gripTop + grip + pommelH / 2

  let bladePath
  if (kind === 'falchion') bladePath = falchionBlade(blade, width)
  else if (kind === 'thrust') bladePath = thrustBlade(blade, width)
  else if (kind === 'great') bladePath = greatBlade(blade, width, false)
  else if (kind === 'wavy') bladePath = greatBlade(blade, width, true)
  else bladePath = straightBlade(blade, width)

  // обмотка рукояти
  const wraps = []
  for (let y = gripTop + 4; y < gripTop + grip - 4; y += 7) {
    wraps.push(y)
  }

  const hasFuller = kind === 'straight' || kind === 'great'
  const fullerEnd = kind === 'great' ? blade - 70 : blade - 6

  return (
    <svg
      className="sword"
      viewBox={`0 0 160 ${total}`}
      style={{ height: `calc(${total} * var(--sword-unit))` }}
      aria-hidden="true"
    >
      <defs>
        {/* сталь: светлая середина, тёмные края */}
        <linearGradient id={`steel-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3a3c40" />
          <stop offset="0.46" stopColor="#ebe8e1" />
          <stop offset="0.54" stopColor="#8d8f93" />
          <stop offset="1" stopColor="#2c2e31" />
        </linearGradient>

        {/* бегущий блик */}
        <linearGradient id={`shine-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.58" stopColor="#fff" stopOpacity="0" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            values="0 -1; 0 1"
            dur="5s"
            repeatCount="indefinite"
          />
        </linearGradient>

        <linearGradient id={`iron-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#9b9790" />
          <stop offset="0.5" stopColor="#3d3b38" />
          <stop offset="1" stopColor="#1c1b1a" />
        </linearGradient>
      </defs>

      {/* клинок */}
      <path d={bladePath} fill={`url(#steel-${id})`} />

      {hasFuller && (
        <path
          d={`M${CX} ${blade * 0.28} L${CX} ${fullerEnd}`}
          stroke="rgba(15, 15, 18, 0.55)"
          strokeWidth={width * 0.16}
          strokeLinecap="round"
        />
      )}
      {kind === 'thrust' && (
        <path d={`M${CX} ${width * 3} L${CX} ${blade}`} stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
      )}

      <path d={bladePath} fill={`url(#shine-${id})`} />

      {/* гарда */}
      <rect
        x={CX - guard / 2}
        y={blade}
        width={guard}
        height={GUARD_H}
        rx={GUARD_H / 2}
        fill={`url(#iron-${id})`}
      />
      <circle cx={CX - guard / 2 + 3} cy={blade + GUARD_H / 2} r="5" fill={`url(#iron-${id})`} />
      <circle cx={CX + guard / 2 - 3} cy={blade + GUARD_H / 2} r="5" fill={`url(#iron-${id})`} />

      {/* рукоять */}
      <rect x={CX - 6} y={gripTop} width="12" height={grip} rx="4" fill={gripColor} />
      {wraps.map((y) => (
        <path key={y} d={`M${CX - 6} ${y} L${CX + 6} ${y + 4}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      ))}

      {/* навершие */}
      {pommel === 'pear' && (
        <>
          <ellipse cx={CX} cy={pommelY} rx="9" ry="12" fill={`url(#iron-${id})`} />
          <circle cx={CX} cy={pommelY + 12} r="2.5" fill="#55524d" />
        </>
      )}
      {pommel === 'disc' && (
        <>
          <circle cx={CX} cy={pommelY} r="11" fill={`url(#iron-${id})`} />
          <circle cx={CX} cy={pommelY} r="5" fill="none" stroke="rgba(255,255,255,0.25)" />
        </>
      )}
      {pommel === 'wheel' && (
        <>
          <circle cx={CX} cy={pommelY} r="11" fill={`url(#iron-${id})`} />
          <circle cx={CX} cy={pommelY} r="7" fill="none" stroke="#c8102e" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}

export default Sword
