import { business } from '../config'

/** El número es válido si solo tiene dígitos (10 a 15) en formato internacional. */
export const isWhatsAppConfigured = /^\d{10,15}$/.test(business.whatsappNumber)

export function whatsappUrl(message: string): string {
  return `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export const messages = {
  general: `Hola, ${business.name}. Me gustaría solicitar una cotización de servicio de aire acondicionado.`,
  service: (serviceName: string) =>
    `Hola, ${business.name}. Me interesa el servicio de "${serviceName}". ¿Me pueden dar una cotización?`,
  coverage: `Hola, ${business.name}. Quiero consultar si dan servicio en mi colonia. Mi zona es: `,
  final: `Hola, ${business.name}. Necesito instalar o dar mantenimiento a mi aire acondicionado y quisiera una cotización.`,
}
