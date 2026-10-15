import { business, navLinks, services } from '../config'
import { isWhatsAppConfigured } from '../lib/whatsapp'
import { Logo } from './Header'

const year = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__brand">
          <Logo light />
          <p>{business.tagline} en {business.city}, {business.state}.</p>
        </div>
        <nav aria-label="Secciones">
          <p className="footer__title">Secciones</p>
          <ul>
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="footer__title">Servicios</p>
          <ul>
            {services.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="footer__title">Cobertura y contacto</p>
          <ul>
            <li>{business.mainArea}, {business.state}</li>
            <li>{business.potentialAreas.join(' y ')} (sujeto a confirmación)</li>
            <li>WhatsApp: {isWhatsAppConfigured ? `+${business.whatsappNumber}` : 'pendiente de configurar'}</li>
            <li>Correo: {business.email || 'pendiente de configurar'}</li>
          </ul>
        </div>
      </div>
      <div className="wrap footer__bottom">
        <p>© {year} {business.name}. Todos los derechos reservados.</p>
        <p>Aviso de privacidad: el negocio debe publicar el suyo antes de recibir datos de clientes.</p>
        {business.isDemo && <p className="footer__demo">Sitio de demostración. Los datos comerciales están pendientes de validación.</p>}
      </div>
    </footer>
  )
}
