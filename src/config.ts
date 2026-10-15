/**
 * Datos del negocio centralizados.
 * IMPORTANTE: esta web es una DEMO. Sustituye estos valores por los datos
 * reales y validados del negocio antes de publicarla.
 */

export type Review = {
  author: string
  text: string
  source: string // p. ej. "Google", "Facebook"
}

export const business = {
  name: 'NORTE CLIMA',
  tagline: 'Instalación, mantenimiento y servicio de aire acondicionado',
  city: 'Torreón',
  state: 'Coahuila',

  /**
   * Número de WhatsApp en formato internacional, solo dígitos, sin "+" ni espacios.
   * Ejemplo de formato para México: 52 + 10 dígitos.
   * Vacío = demo sin configurar: los botones muestran un aviso en lugar de abrir WhatsApp.
   */
  whatsappNumber: '',

  /** Datos de contacto visibles. Vacío = se muestra "Pendiente de configurar". */
  phoneDisplay: '',
  email: '',

  /** Zona principal y zonas potenciales (sujetas a confirmación). */
  mainArea: 'Torreón',
  potentialAreas: ['Gómez Palacio', 'Lerdo'],

  /** Mientras sea true se muestran avisos de demostración. */
  isDemo: true,

  /**
   * Reseñas reales y verificables del negocio. Déjalo vacío hasta tenerlas.
   * No agregues testimonios inventados.
   */
  reviews: [] as Review[],
}

export const services = [
  {
    id: 'instalacion',
    name: 'Instalación de minisplits',
    description:
      'Instalación y montaje de equipos, con atención a la ubicación y los acabados.',
  },
  {
    id: 'mantenimiento',
    name: 'Mantenimiento preventivo',
    description:
      'Revisión y limpieza para ayudar a conservar el funcionamiento del equipo.',
  },
  {
    id: 'limpieza',
    name: 'Limpieza profunda',
    description:
      'Limpieza de los componentes que corresponda según el tipo de equipo y servicio contratado.',
  },
  {
    id: 'reparacion',
    name: 'Diagnóstico y reparación',
    description:
      'Evaluación de fallas y propuesta de reparación según el estado del sistema.',
  },
  {
    id: 'reubicacion',
    name: 'Desinstalación y reubicación',
    description:
      'Retiro y traslado de equipos cuando las condiciones técnicas lo permitan.',
  },
  {
    id: 'comercial',
    name: 'Servicio comercial',
    description:
      'Soluciones para oficinas y pequeños negocios, según las capacidades reales del proveedor.',
  },
] as const

export type ServiceId = (typeof services)[number]['id']

export const navLinks = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#trabajos', label: 'Trabajos' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#preguntas', label: 'Preguntas' },
  { href: '#contacto', label: 'Contacto' },
]
