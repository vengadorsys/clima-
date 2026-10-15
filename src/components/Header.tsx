import { useEffect, useState } from 'react'
import { Menu, Snowflake, X } from 'lucide-react'
import { business, navLinks } from '../config'
import { messages } from '../lib/whatsapp'
import { WhatsAppButton } from './WhatsApp'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#inicio" className={`logo ${light ? 'logo--light' : ''}`} aria-label={`${business.name}, ir al inicio`}>
      <span className="logo__mark" aria-hidden="true">
        <Snowflake size={20} strokeWidth={2.2} />
      </span>
      <span className="logo__word">
        NORTE<span>CLIMA</span>
      </span>
    </a>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="header">
      <div className="header__inner wrap">
        <Logo />
        <nav className="nav" aria-label="Principal">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="header__cta">
          <WhatsAppButton message={messages.general} className="btn btn--wa btn--sm">
            Cotizar por WhatsApp
          </WhatsAppButton>
          <button
            className="icon-btn menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <nav id="mobile-menu" className="mobile-menu" hidden={!open} aria-label="Menú móvil">
        <div className="wrap mobile-menu__inner">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <WhatsAppButton message={messages.general} className="btn btn--wa">
            Cotizar por WhatsApp
          </WhatsAppButton>
        </div>
      </nav>
    </header>
  )
}
