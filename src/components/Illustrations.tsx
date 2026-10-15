/**
 * Ilustraciones vectoriales provisionales.
 * Sustitúyelas por fotografías reales de trabajos del negocio antes de publicar.
 */

const C = {
  navy: '#10243A',
  navy2: '#1B3552',
  blue: '#1677FF',
  cyan: '#32C5E8',
  wall: '#E8EFF6',
  wall2: '#DCE6F0',
  floor: '#C9D6E3',
  white: '#FFFFFF',
  line: '#B8C7D6',
  wood: '#C8A57E',
  wood2: '#A9845C',
  green: '#4E9A7A',
  green2: '#3C7F63',
  sun: '#FFD9A0',
  sky: '#FFF1DA',
}

/** Unidad interior de minisplit. */
function MiniSplit({ x, y, w = 220, temp = '24°' }: { x: number; y: number; w?: number; temp?: string }) {
  const h = w * 0.3
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="4" y="6" width={w} height={h} rx={h * 0.28} fill={C.navy} opacity="0.12" />
      <rect width={w} height={h} rx={h * 0.28} fill={C.white} stroke={C.line} strokeWidth="1.5" />
      <rect x={w * 0.04} y={h * 0.72} width={w * 0.92} height={h * 0.12} rx={h * 0.06} fill={C.wall2} />
      <rect x={w * 0.06} y={h * 0.76} width={w * 0.88} height={h * 0.04} rx="2" fill={C.navy2} opacity="0.55" />
      <rect x={w * 0.72} y={h * 0.2} width={w * 0.18} height={h * 0.32} rx="4" fill={C.navy} />
      <text
        x={w * 0.81}
        y={h * 0.45}
        textAnchor="middle"
        fontFamily="IBM Plex Mono, monospace"
        fontSize={h * 0.24}
        fill={C.cyan}
        fontWeight="600"
      >
        {temp}
      </text>
      <circle cx={w * 0.66} cy={h * 0.36} r={h * 0.04} fill={C.cyan} />
    </g>
  )
}

/** Líneas de flujo de aire animadas. */
function Airflow({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={C.cyan} strokeWidth="3" strokeLinecap="round" className="airflow">
      <path d={`M ${w * 0.1} 0 C ${w * 0.15} 40, ${w * 0.05} 70, ${w * 0.12} 110`} opacity="0.75" />
      <path d={`M ${w * 0.35} 0 C ${w * 0.42} 45, ${w * 0.3} 80, ${w * 0.4} 125`} opacity="0.6" />
      <path d={`M ${w * 0.6} 0 C ${w * 0.68} 40, ${w * 0.56} 75, ${w * 0.66} 115`} opacity="0.75" />
      <path d={`M ${w * 0.85} 0 C ${w * 0.92} 35, ${w * 0.82} 70, ${w * 0.9} 100`} opacity="0.5" />
    </g>
  )
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C -30 -40 -18 -90 4 -110 C 8 -80 14 -40 0 0Z" fill={C.green} />
      <path d="M2 0 C 28 -30 40 -80 26 -104 C 10 -80 0 -40 2 0Z" fill={C.green2} />
      <path d="M0 0 C -40 -20 -56 -50 -50 -70 C -30 -56 -10 -30 0 0Z" fill={C.green2} />
      <path d="M-22 0 h44 l-6 46 h-32z" fill={C.white} stroke={C.line} strokeWidth="1.5" />
    </g>
  )
}

/** Hero: sala moderna con minisplit instalado. */
export function HeroIllustration() {
  return (
    <svg viewBox="0 0 560 440" role="img" aria-labelledby="hero-ill-title" className="illustration">
      <title id="hero-ill-title">Ilustración de una sala moderna con un minisplit instalado en la pared</title>
      <rect width="560" height="440" fill={C.wall} />
      <rect y="330" width="560" height="110" fill={C.floor} />
      <rect y="326" width="560" height="6" fill={C.white} />
      {/* ventana */}
      <g transform="translate(350 70)">
        <rect width="170" height="200" rx="6" fill={C.white} />
        <rect x="10" y="10" width="150" height="180" rx="3" fill={C.sky} />
        <circle cx="112" cy="58" r="24" fill={C.sun} />
        <path d="M10 150 C 50 118 80 128 104 140 C 124 128 146 124 160 132 V190 H10Z" fill="#E9C9A0" />
        <path d="M10 170 C 60 150 110 160 160 152 V190 H10Z" fill="#DDB487" />
        <rect x="83" y="10" width="4" height="180" fill={C.white} />
      </g>
      {/* minisplit + flujo */}
      <MiniSplit x={50} y={86} w={240} />
      <Airflow x={60} y={170} w={220} />
      {/* sofá */}
      <g transform="translate(40 250)">
        <rect x="0" y="20" width="280" height="70" rx="16" fill={C.navy2} />
        <rect x="16" y="0" width="120" height="56" rx="14" fill={C.navy} />
        <rect x="144" y="0" width="120" height="56" rx="14" fill={C.navy} />
        <rect x="-8" y="30" width="28" height="64" rx="12" fill={C.navy} />
        <rect x="260" y="30" width="28" height="64" rx="12" fill={C.navy} />
        <rect x="20" y="90" width="8" height="18" fill={C.wood2} />
        <rect x="252" y="90" width="8" height="18" fill={C.wood2} />
        <rect x="200" y="8" width="40" height="34" rx="8" fill={C.cyan} opacity="0.85" />
      </g>
      {/* mesa lateral y control */}
      <g transform="translate(360 300)">
        <rect x="0" y="0" width="90" height="10" rx="4" fill={C.wood} />
        <rect x="40" y="10" width="10" height="56" fill={C.wood2} />
        <rect x="20" y="-14" width="16" height="14" rx="3" fill={C.white} stroke={C.line} />
        <rect x="24" y="-11" width="8" height="4" rx="1" fill={C.cyan} />
      </g>
      <Plant x={500} y={340} s={0.95} />
      {/* termómetro de referencia */}
      <g transform="translate(300 200)">
        <rect width="34" height="48" rx="6" fill={C.white} stroke={C.line} />
        <circle cx="17" cy="20" r="9" fill="none" stroke={C.blue} strokeWidth="3" />
        <rect x="9" y="34" width="16" height="4" rx="2" fill={C.wall2} />
      </g>
    </svg>
  )
}

/** Galería 1: minisplit en recámara moderna. */
export function BedroomIllustration() {
  return (
    <svg viewBox="0 0 480 360" role="img" aria-labelledby="bed-title" className="illustration">
      <title id="bed-title">Ilustración de un minisplit sobre la cabecera de una recámara moderna</title>
      <rect width="480" height="360" fill="#EEF2F6" />
      <rect y="268" width="480" height="92" fill="#D5DEE8" />
      <rect x="120" y="148" width="240" height="70" rx="10" fill={C.wood} />
      <MiniSplit x={150} y={52} w={180} temp="23°" />
      <Airflow x={160} y={110} w={160} />
      <g transform="translate(90 200)">
        <rect x="0" y="20" width="300" height="70" rx="12" fill={C.white} stroke={C.line} />
        <rect x="0" y="54" width="300" height="40" rx="10" fill="#9FB4CC" />
        <rect x="30" y="0" width="90" height="40" rx="12" fill={C.white} stroke={C.line} />
        <rect x="180" y="0" width="90" height="40" rx="12" fill={C.white} stroke={C.line} />
        <rect x="10" y="94" width="10" height="16" fill={C.wood2} />
        <rect x="280" y="94" width="10" height="16" fill={C.wood2} />
      </g>
      <g transform="translate(410 190)">
        <rect x="-26" y="40" width="52" height="58" rx="6" fill={C.wood} />
        <rect x="-3" y="0" width="6" height="40" fill={C.navy2} />
        <path d="M-22 -2 h44 l-10 -30 h-24z" fill={C.sun} />
      </g>
      <Plant x={40} y={300} s={0.8} />
    </svg>
  )
}

/** Galería 2: condensadora exterior bien instalada. */
export function OutdoorIllustration() {
  return (
    <svg viewBox="0 0 480 360" role="img" aria-labelledby="out-title" className="illustration">
      <title id="out-title">Ilustración de una unidad exterior montada en muro con soportes y tubería protegida</title>
      <rect width="480" height="360" fill="#F3E7D7" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x="0" y={i * 45} width="480" height="1.5" fill="#E2D1BB" />
      ))}
      <rect y="300" width="480" height="60" fill="#CDBBA3" />
      {/* canaleta de tubería */}
      <rect x="330" y="0" width="22" height="150" rx="3" fill={C.white} stroke={C.line} />
      <path d="M341 150 V176 H300" fill="none" stroke={C.white} strokeWidth="22" strokeLinejoin="round" />
      <path d="M341 150 V176 H300" fill="none" stroke={C.line} strokeWidth="1" />
      {/* condensadora */}
      <g transform="translate(110 140)">
        <rect x="6" y="8" width="200" height="130" rx="8" fill={C.navy} opacity="0.12" />
        <rect width="200" height="130" rx="8" fill={C.white} stroke={C.line} strokeWidth="1.5" />
        <circle cx="76" cy="65" r="48" fill="#E7EDF3" stroke={C.line} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx="76" cy="65" r={44 - i * 8} fill="none" stroke={C.navy2} strokeWidth="1.5" opacity="0.5" />
        ))}
        <g className="fan">
          <path d="M76 65 L76 30 A10 10 0 0 1 90 40Z M76 65 L110 66 A10 10 0 0 1 100 80Z M76 65 L58 94 A10 10 0 0 1 50 80Z M76 65 L46 46 A10 10 0 0 1 60 36Z" fill={C.navy2} opacity="0.6" />
        </g>
        <circle cx="76" cy="65" r="6" fill={C.navy} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x="140" y={20 + i * 14} width="46" height="4" rx="2" fill={C.wall2} />
        ))}
        <rect x="180" y="96" width="20" height="24" rx="3" fill={C.wall2} />
      </g>
      {/* soportes */}
      <path d="M120 284 L120 300 M300 284 L300 300" stroke={C.navy2} strokeWidth="6" />
      <path d="M100 280 H320" stroke={C.navy2} strokeWidth="8" strokeLinecap="round" />
      <path d="M110 280 L110 310 L150 280 M310 280 L310 310 L270 280" stroke={C.navy2} strokeWidth="5" fill="none" />
      <rect x="40" y="40" width="70" height="44" rx="4" fill={C.white} opacity="0.8" />
      <rect x="48" y="48" width="54" height="28" rx="2" fill={C.sky} />
    </svg>
  )
}

/** Galería 3: técnico en mantenimiento con manómetros. */
export function MaintenanceIllustration() {
  return (
    <svg viewBox="0 0 480 360" role="img" aria-labelledby="mnt-title" className="illustration">
      <title id="mnt-title">Ilustración de mantenimiento: equipo abierto, filtro retirado y juego de manómetros</title>
      <rect width="480" height="360" fill="#E6EEF7" />
      <rect y="290" width="480" height="70" fill="#CBD8E5" />
      {/* equipo abierto */}
      <g transform="translate(60 50)">
        <rect width="260" height="78" rx="20" fill={C.white} stroke={C.line} strokeWidth="1.5" />
        <rect x="14" y="14" width="232" height="40" rx="6" fill="#D7E1EB" />
        {Array.from({ length: 22 }).map((_, i) => (
          <rect key={i} x={20 + i * 10.4} y="18" width="3" height="32" fill={C.line} />
        ))}
        <path d="M0 40 L-10 -20 L250 -20 L260 40" fill={C.white} stroke={C.line} strokeWidth="1.5" opacity="0.95" />
      </g>
      {/* filtro retirado */}
      <g transform="translate(340 60) rotate(8)">
        <rect width="100" height="64" rx="6" fill={C.white} stroke={C.line} />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="8" y={8 + i * 6.4} width="84" height="2" fill="#9FB4CC" />
        ))}
      </g>
      {/* manómetros */}
      <g transform="translate(150 190)">
        <rect x="-8" y="40" width="196" height="40" rx="10" fill={C.navy2} />
        <circle cx="40" cy="30" r="38" fill={C.white} stroke={C.blue} strokeWidth="7" />
        <circle cx="140" cy="30" r="38" fill={C.white} stroke="#E5484D" strokeWidth="7" />
        <path d="M40 30 L58 12" stroke={C.navy} strokeWidth="3" strokeLinecap="round" />
        <path d="M140 30 L124 10" stroke={C.navy} strokeWidth="3" strokeLinecap="round" />
        {[-60, -30, 0, 30, 60].map((a) => (
          <g key={a}>
            <line x1="40" y1="0" x2="40" y2="-6" stroke={C.navy} strokeWidth="2" transform={`rotate(${a} 40 30)`} />
            <line x1="140" y1="0" x2="140" y2="-6" stroke={C.navy} strokeWidth="2" transform={`rotate(${a} 140 30)`} />
          </g>
        ))}
        <path d="M20 80 C 0 130 -60 120 -80 100" fill="none" stroke={C.blue} strokeWidth="6" strokeLinecap="round" />
        <path d="M90 80 C 90 130 100 150 100 160" fill="none" stroke="#F2C94C" strokeWidth="6" strokeLinecap="round" />
        <path d="M160 80 C 190 130 250 120 270 96" fill="none" stroke="#E5484D" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* guantes / herramienta */}
      <g transform="translate(40 250) rotate(-20)">
        <rect width="80" height="14" rx="7" fill={C.cyan} />
        <rect x="76" y="2" width="30" height="10" rx="3" fill="#8A9BB0" />
      </g>
    </svg>
  )
}

/** Galería 4: espacio comercial con equipo tipo cassette. */
export function CommercialIllustration() {
  return (
    <svg viewBox="0 0 480 360" role="img" aria-labelledby="com-title" className="illustration">
      <title id="com-title">Ilustración de una oficina con equipos de aire acondicionado tipo cassette en el plafón</title>
      <rect width="480" height="360" fill="#EDF1F5" />
      <rect width="480" height="70" fill="#F8FAFC" />
      <rect y="68" width="480" height="3" fill={C.line} />
      {[60, 280].map((x) => (
        <g key={x} transform={`translate(${x} 70)`}>
          <rect width="140" height="18" fill={C.white} stroke={C.line} />
          <rect x="20" y="4" width="100" height="10" rx="2" fill={C.wall2} />
          <rect x="24" y="6" width="92" height="2" fill={C.navy2} opacity="0.5" />
          <path d="M30 22 C 20 50 26 70 18 96 M110 22 C 120 50 114 70 122 96" stroke={C.cyan} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" className="airflow" />
        </g>
      ))}
      <rect y="270" width="480" height="90" fill="#D3DCE6" />
      {/* escritorios */}
      {[40, 260].map((x) => (
        <g key={x} transform={`translate(${x} 200)`}>
          <rect width="180" height="10" rx="3" fill={C.wood} />
          <rect x="10" y="10" width="8" height="70" fill={C.navy2} />
          <rect x="162" y="10" width="8" height="70" fill={C.navy2} />
          <rect x="40" y="-48" width="76" height="46" rx="4" fill={C.navy} />
          <rect x="45" y="-43" width="66" height="34" rx="2" fill={C.blue} opacity="0.35" />
          <rect x="74" y="-2" width="8" height="4" fill={C.navy2} />
          <rect x="130" y="-18" width="22" height="18" rx="3" fill={C.white} stroke={C.line} />
        </g>
      ))}
      <g transform="translate(220 150)">
        <rect width="40" height="120" rx="4" fill={C.white} stroke={C.line} />
        <rect x="6" y="10" width="28" height="30" rx="2" fill={C.wall2} />
      </g>
    </svg>
  )
}
