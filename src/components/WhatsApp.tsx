import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Copy, MessageCircle, TriangleAlert, X } from 'lucide-react'
import { isWhatsAppConfigured, whatsappUrl } from '../lib/whatsapp'

type DemoCtx = { showDemoNotice: (message: string) => void }
const DemoContext = createContext<DemoCtx>({ showDemoNotice: () => {} })

/** Muestra un aviso cuando el número de WhatsApp todavía no está configurado. */
export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const textRef = useRef<HTMLPreElement>(null)

  const showDemoNotice = useCallback((msg: string) => {
    setCopied(false)
    setMessage(msg)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (message !== null && !dialog.open) dialog.showModal()
  }, [message])

  const copy = async () => {
    if (!message) return
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
    } catch {
      const node = textRef.current
      if (node) {
        const range = document.createRange()
        range.selectNodeContents(node)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }
  }

  return (
    <DemoContext.Provider value={{ showDemoNotice }}>
      {children}
      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="demo-title"
        onClose={() => setMessage(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close()
        }}
      >
        <div className="modal__body">
          <button className="icon-btn modal__close" onClick={() => dialogRef.current?.close()} aria-label="Cerrar">
            <X size={20} />
          </button>
          <div className="modal__icon">
            <TriangleAlert size={22} />
          </div>
          <h2 id="demo-title" className="modal__title">WhatsApp aún no está configurado</h2>
          <p className="modal__text">
            Esta es una web de demostración. Antes de publicarla, agrega el número real del negocio en{' '}
            <code>src/config.ts</code> (campo <code>whatsappNumber</code>). Este es el mensaje que se enviaría:
          </p>
          <pre ref={textRef} className="modal__message">{message}</pre>
          <div className="modal__actions">
            <button className="btn btn--ghost-dark" onClick={copy}>
              <Copy size={18} />
              {copied ? 'Mensaje copiado' : 'Copiar mensaje'}
            </button>
            <button className="btn btn--primary" onClick={() => dialogRef.current?.close()}>
              Entendido
            </button>
          </div>
        </div>
      </dialog>
    </DemoContext.Provider>
  )
}

type ButtonProps = {
  message: string
  children: ReactNode
  className?: string
  icon?: boolean
  ariaLabel?: string
}

/** Botón de WhatsApp: abre el chat con mensaje prellenado o, en la demo, el aviso de configuración. */
export function WhatsAppButton({ message, children, className = 'btn btn--wa', icon = true, ariaLabel }: ButtonProps) {
  const { showDemoNotice } = useContext(DemoContext)
  const content = (
    <>
      {icon && <MessageCircle size={18} aria-hidden="true" />}
      {children}
    </>
  )
  if (isWhatsAppConfigured) {
    return (
      <a className={className} href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        {content}
      </a>
    )
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => showDemoNotice(message)}
      aria-label={ariaLabel}
      title="Demo: falta configurar el número de WhatsApp"
    >
      {content}
    </button>
  )
}

