import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
  ArrowRight,
  Brush,
  Building2,
  Camera,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Hammer,
  Handshake,
  House,
  MapPin,
  MessagesSquare,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  Wrench,
  X,
  ZoomIn,
  type LucideProps,
} from 'lucide-react'
import { business, services, type ServiceId } from '../config'
import { messages } from '../lib/whatsapp'
import { WhatsAppButton } from './WhatsApp'
import heroImg from '../assets/photos/hero.jpg'
import bedroomImg from '../assets/photos/recamara.jpg'
import outdoorImg from '../assets/photos/exterior.jpg'
import maintenanceImg from '../assets/photos/mantenimiento.jpg'
import commercialImg from '../assets/photos/comercial.jpg'

const AI_NOTE = 'Imagen de referencia generada con IA'

function SectionHead({ eyebrow, title, intro, light }: { eyebrow: string; title: string; intro?: ReactNode; light?: boolean }) {
  return (
    <div className={`section-head ${light ? 'section-head--light' : ''}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {intro && <p className="lead">{intro}</p>}
    </div>
  )
}

/* ---------- Hero ---------- */

export function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <p className="tag">
            <span className="tag__dot" aria-hidden="true" />
            Servicio residencial y comercial
            {business.isDemo && <span className="tag__demo">Demo</span>}
          </p>
          <h1>
            Instalación y mantenimiento de aire acondicionado en <span className="accent">{business.city}</span>
          </h1>
          <p className="hero__text">
            Soluciones de climatización para tu hogar o negocio, con atención directa y presupuestos claros.
          </p>
          <div className="hero__actions">
            <WhatsAppButton message={messages.general} className="btn btn--primary btn--lg">
              Solicitar cotización
            </WhatsAppButton>
            <a href="#servicios" className="btn btn--ghost btn--lg">
              Ver nuestros servicios
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
        <figure className="hero__visual">
          <img
            className="photo"
            src={heroImg}
            width={600}
            height={448}
            alt="Técnico con uniforme azul marino instalando un minisplit en una sala moderna"
          />
          <figcaption className="hero__caption">
            <span className="mono">{AI_NOTE}</span> · se sustituye por fotos reales del negocio
          </figcaption>
        </figure>
      </div>
      <div className="attributes">
        <ul className="wrap attributes__list">
          <li>
            <MessagesSquare size={18} aria-hidden="true" /> Atención directa
          </li>
          <li>
            <House size={18} aria-hidden="true" /> Soluciones para hogar y negocio
          </li>
          <li>
            <FileText size={18} aria-hidden="true" /> Cotización personalizada
          </li>
        </ul>
      </div>
    </section>
  )
}

/* ---------- Servicios ---------- */

const serviceIcons: Record<ServiceId, ComponentType<LucideProps>> = {
  instalacion: Hammer,
  mantenimiento: Wrench,
  limpieza: Sparkles,
  reparacion: Stethoscope,
  reubicacion: Truck,
  comercial: Building2,
}

export function Services() {
  return (
    <section id="servicios" className="section">
      <div className="wrap">
        <SectionHead
          eyebrow="Servicios"
          title="Todo lo que necesitas para mantener tu espacio fresco"
          intro="Servicio de climatización adaptado a las necesidades de cada instalación."
        />
        <div className="services">
          {services.map((s) => {
            const Icon = serviceIcons[s.id]
            return (
              <article key={s.id} className="service">
                <span className="service__icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <WhatsAppButton
                  message={messages.service(s.name)}
                  className="link-btn"
                  ariaLabel={`Cotizar ${s.name} por WhatsApp`}
                >
                  Cotizar este servicio
                </WhatsAppButton>
              </article>
            )
          })}
        </div>
        <p className="fineprint">
          La disponibilidad de cada servicio depende del tipo de equipo, la instalación y la confirmación del negocio.
        </p>
      </div>
    </section>
  )
}

/* ---------- Galería ---------- */

const gallery = [
  {
    id: 'recamara',
    title: 'Minisplit en recámara',
    note: 'Ubicación sobre cabecera, flujo hacia el área de descanso.',
    src: bedroomImg,
    alt: 'Minisplit blanco instalado sobre la cabecera de una recámara moderna',
  },
  {
    id: 'exterior',
    title: 'Unidad exterior en muro',
    note: 'Soportes nivelados y tubería protegida con canaleta.',
    src: outdoorImg,
    alt: 'Unidad exterior de aire acondicionado montada en muro con soportes y canaleta',
  },
  {
    id: 'mantenimiento',
    title: 'Mantenimiento con manómetros',
    note: 'Revisión de presiones, limpieza de serpentín y filtros.',
    src: maintenanceImg,
    alt: 'Técnico con guantes limpiando el serpentín de un minisplit con manómetros conectados',
  },
  {
    id: 'comercial',
    title: 'Espacio comercial',
    note: 'Equipos tipo cassette en plafón para oficina.',
    src: commercialImg,
    alt: 'Oficina con equipos de aire acondicionado tipo cassette en el plafón',
  },
]

export function Gallery() {
  const [active, setActive] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (active !== null && d && !d.open) d.showModal()
  }, [active])

  const item = active !== null ? gallery[active] : null

  return (
    <section id="trabajos" className="section section--tint">
      <div className="wrap">
        <SectionHead
          eyebrow="Ejemplos visuales de instalaciones"
          title="El detalle está en la instalación"
          intro="Imágenes de referencia generadas con IA. Esta galería se reemplazará con fotografías de trabajos reales del negocio."
        />
        <div className="gallery">
          {gallery.map((g, i) => (
            <figure key={g.id} className={`gallery__item gallery__item--${i}`}>
              <button className="gallery__btn" onClick={() => setActive(i)} aria-label={`Ampliar: ${g.title}`}>
                <img className="photo" src={g.src} width={600} height={448} alt={g.alt} loading="lazy" />
                <span className="gallery__zoom" aria-hidden="true">
                  <ZoomIn size={18} />
                </span>
              </button>
              <figcaption>
                <strong>{g.title}</strong>
                <span>{g.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <dialog
        ref={dialogRef}
        className="modal modal--wide"
        aria-label={item?.title}
        onClose={() => setActive(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close()
        }}
      >
        {item && (
          <div className="modal__body">
            <button className="icon-btn modal__close" onClick={() => dialogRef.current?.close()} aria-label="Cerrar">
              <X size={20} />
            </button>
            <img className="photo" src={item.src} width={600} height={448} alt={item.alt} />
            <p className="modal__text">
              <strong>{item.title}.</strong> {item.note} <span className="mono">({AI_NOTE})</span>
            </p>
          </div>
        )}
      </dialog>
    </section>
  )
}

/* ---------- Diferenciadores ---------- */

const differentiators = [
  { Icon: FileText, title: 'Presupuesto claro antes de comenzar', text: 'Sabes qué incluye el trabajo antes de confirmar la visita.' },
  { Icon: MessageSquareText, title: 'Comunicación directa durante el servicio', text: 'Hablas con quien coordina tu servicio, sin intermediarios.' },
  { Icon: ShieldCheck, title: 'Cuidado del espacio y los acabados', text: 'Se protege el área de trabajo y se deja limpia al terminar.' },
  { Icon: ClipboardCheck, title: 'Explicación del trabajo realizado', text: 'Al final te contamos qué se hizo y qué conviene vigilar.' },
]

export function Differentiators() {
  return (
    <section className="section">
      <div className="wrap split">
        <SectionHead
          eyebrow="Forma de trabajo"
          title="Un servicio bien hecho se nota en los detalles"
          intro="Compromisos de atención propuestos para la demo. El negocio debe confirmarlos antes de publicar."
        />
        <ul className="diffs">
          {differentiators.map(({ Icon, title, text }) => (
            <li key={title} className="diff">
              <Icon size={22} className="diff__icon" aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ---------- Proceso ---------- */

const steps = [
  { Icon: MessagesSquare, title: 'Cuéntanos qué necesitas', text: 'Instalación, mantenimiento, limpieza o una falla en tu equipo.' },
  { Icon: Camera, title: 'Comparte fotos, si las tienes', text: 'Del equipo, la etiqueta de datos o el espacio donde irá instalado.' },
  { Icon: FileText, title: 'Recibe tu cotización', text: 'Con la cotización coordinamos el día y la hora de la visita.' },
  { Icon: Handshake, title: 'Confirma el servicio', text: 'Acordamos los detalles del trabajo antes de comenzar.' },
]

export function Process() {
  return (
    <section id="proceso" className="section section--navy">
      <div className="wrap">
        <SectionHead light eyebrow="Proceso" title="Solicitar tu servicio es sencillo" />
        <ol className="steps">
          {steps.map(({ Icon, title, text }, i) => (
            <li key={title} className="step">
              <span className="step__num mono">Paso {i + 1}</span>
              <Icon size={26} className="step__icon" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <div className="center">
          <WhatsAppButton message={messages.general} className="btn btn--primary btn--lg">
            Empezar por WhatsApp
          </WhatsAppButton>
        </div>
      </div>
    </section>
  )
}

/* ---------- Marcas y equipos ---------- */

const brands = ['Mirage', 'Midea', 'LG', 'Samsung', 'Carrier']
const capacities = [
  { ton: '1 ton', btu: '12,000 BTU' },
  { ton: '1.5 ton', btu: '18,000 BTU' },
  { ton: '2 ton', btu: '24,000 BTU' },
]

export function Brands() {
  return (
    <section className="section section--tint">
      <div className="wrap">
        <SectionHead
          eyebrow="Equipos"
          title="Soluciones para distintos equipos de climatización"
          intro="Marcas que podrían atenderse, mostradas solo como ejemplo. La compatibilidad y disponibilidad dependen del negocio y del servicio."
        />
        <ul className="brands" aria-label="Ejemplos de marcas">
          {brands.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <div className="specs">
          <div className="spec">
            <p className="spec__label mono">Tipos de equipo</p>
            <p>Minisplit convencional e inverter · Frío o frío/calor · Ventana · Cassette</p>
          </div>
          <div className="spec">
            <p className="spec__label mono">Capacidades comunes</p>
            <ul className="spec__caps">
              {capacities.map((c) => (
                <li key={c.ton}>
                  <strong>{c.ton}</strong>
                  <span className="mono">{c.btu}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="spec">
            <p className="spec__label mono">Tip</p>
            <p>La capacidad y el voltaje vienen en la etiqueta de datos del equipo. Una foto de esa etiqueta agiliza la cotización.</p>
          </div>
        </div>
        <p className="fineprint">
          Las marcas mencionadas pertenecen a sus respectivos dueños. {business.name} no se presenta como distribuidor ni
          centro de servicio autorizado.
        </p>
      </div>
    </section>
  )
}

/* ---------- Cobertura ---------- */

export function Coverage() {
  return (
    <section className="section">
      <div className="wrap coverage">
        <div className="coverage__copy">
          <SectionHead
            eyebrow="Zona de cobertura"
            title={`Servicio en ${business.mainArea} y alrededores`}
            intro="Consulta la disponibilidad para tu colonia y el tipo de servicio que necesitas."
          />
          <WhatsAppButton message={messages.coverage} className="btn btn--wa">
            Consultar disponibilidad
          </WhatsAppButton>
        </div>
        <div className="areas">
          <div className="area area--main">
            <MapPin size={22} aria-hidden="true" />
            <div>
              <p className="area__name">{business.mainArea}</p>
              <p className="area__note">Zona principal de servicio</p>
            </div>
          </div>
          {business.potentialAreas.map((a) => (
            <div key={a} className="area">
              <MapPin size={22} aria-hidden="true" />
              <div>
                <p className="area__name">{a}</p>
                <p className="area__note">Sujeto a confirmación</p>
              </div>
            </div>
          ))}
          <p className="fineprint">La cobertura exacta depende de la colonia, el tipo de servicio y la agenda disponible.</p>
        </div>
      </div>
    </section>
  )
}

/* ---------- Reseñas ---------- */

export function Reviews() {
  const { reviews } = business
  return (
    <section className="section section--tint">
      <div className="wrap">
        <SectionHead eyebrow="Opiniones" title="Lo que dicen nuestros clientes" />
        {reviews.length > 0 ? (
          <div className="reviews">
            {reviews.map((r) => (
              <blockquote key={r.author + r.text} className="review">
                <p>{r.text}</p>
                <footer>
                  {r.author} · <span className="mono">{r.source}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Brush size={22} aria-hidden="true" />
            <div>
              <p className="empty__title">Espacio reservado para reseñas verificadas</p>
              <p>
                Aquí se mostrarán opiniones reales de clientes (por ejemplo, de Google o Facebook) cuando el negocio las
                comparta. Mientras tanto, revisa cómo trabajamos y pregunta lo que necesites.
              </p>
            </div>
            <a href="#proceso" className="btn btn--ghost-dark">
              Ver el proceso
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- Preguntas frecuentes ---------- */

const faqs = [
  {
    q: '¿Qué información necesito para solicitar una cotización?',
    a: 'Indica el servicio que necesitas, tu colonia, el tipo de inmueble y, si lo sabes, la marca y capacidad del equipo. Con eso se puede preparar una cotización inicial.',
  },
  {
    q: '¿Puedo enviar fotos del equipo por WhatsApp?',
    a: 'Sí. Las fotos del equipo, de su etiqueta de datos y del lugar de instalación ayudan a entender mejor el trabajo antes de la visita.',
  },
  {
    q: '¿Realizan instalaciones y mantenimiento?',
    a: 'La demo contempla instalación, mantenimiento, limpieza, diagnóstico y reubicación. Los servicios exactos deben confirmarse con el negocio.',
  },
  {
    q: '¿Atienden hogares y negocios?',
    a: 'Se contemplan servicios residenciales y para oficinas o pequeños negocios. El alcance para proyectos comerciales depende de las capacidades del proveedor.',
  },
  {
    q: '¿Cómo puedo consultar la disponibilidad?',
    a: 'Escribe por WhatsApp con tu colonia y el servicio que necesitas. Se te confirmará si hay cobertura y qué fechas hay disponibles.',
  },
  {
    q: '¿El servicio incluye materiales?',
    a: 'Depende del servicio y del tipo de instalación. Los materiales incluidos se detallan en cada cotización.',
  },
  {
    q: '¿Qué garantía tiene el trabajo?',
    a: 'Las condiciones de garantía las define el negocio y deben consultarse al solicitar la cotización. Esta demo no establece ninguna garantía.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="preguntas" className="section">
      <div className="wrap split">
        <SectionHead eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas antes de cotizar" />
        <div className="faq">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    id={`faq-btn-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    {f.q}
                    <ChevronDown size={20} aria-hidden="true" />
                  </button>
                </h3>
                <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} hidden={!isOpen}>
                  <p>{f.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- CTA final ---------- */

export function FinalCta() {
  return (
    <section className="final">
      <div className="wrap final__inner">
        <h2>¿Necesitas instalar o dar mantenimiento a tu aire acondicionado?</h2>
        <p>Cuéntanos qué necesitas y solicita una cotización personalizada.</p>
        <WhatsAppButton message={messages.final} className="btn btn--primary btn--lg">
          Hablar por WhatsApp
        </WhatsAppButton>
      </div>
    </section>
  )
}
