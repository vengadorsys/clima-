import { useState, type FormEvent } from 'react'
import { CircleCheck, MessageCircle, Phone, TriangleAlert } from 'lucide-react'
import { business, services } from '../config'
import { isWhatsAppConfigured, whatsappUrl } from '../lib/whatsapp'
import { WhatsAppButton } from './WhatsApp'

type Fields = {
  name: string
  service: string
  property: string
  zone: string
  equipment: string
  description: string
  phone: string
}

const empty: Fields = { name: '', service: '', property: '', zone: '', equipment: '', description: '', phone: '' }

const equipmentTypes = ['Minisplit convencional', 'Minisplit inverter', 'Equipo de ventana', 'Cassette / comercial', 'No lo sé']

function validate(f: Fields): Partial<Record<keyof Fields, string>> {
  const e: Partial<Record<keyof Fields, string>> = {}
  if (f.name.trim().length < 2) e.name = 'Escribe tu nombre.'
  if (!f.service) e.service = 'Elige el servicio que necesitas.'
  if (!f.property) e.property = 'Indica si es residencial o comercial.'
  if (f.zone.trim().length < 3) e.zone = 'Escribe tu colonia o zona.'
  if (f.description.trim().length < 10) e.description = 'Describe brevemente lo que necesitas (mínimo 10 caracteres).'
  const digits = f.phone.replace(/\D/g, '')
  if (f.phone.trim() && digits.length !== 10) e.phone = 'El teléfono debe tener 10 dígitos, o déjalo vacío.'
  return e
}

function buildMessage(f: Fields): string {
  const lines = [
    `Hola, ${business.name}. Quiero solicitar una cotización.`,
    '',
    `Nombre: ${f.name.trim()}`,
    `Servicio: ${f.service}`,
    `Inmueble: ${f.property}`,
    `Colonia o zona: ${f.zone.trim()}`,
  ]
  if (f.equipment) lines.push(`Equipo: ${f.equipment}`)
  lines.push(`Detalle: ${f.description.trim()}`)
  if (f.phone.trim()) lines.push(`Teléfono: ${f.phone.trim()}`)
  return lines.join('\n')
}

export function QuoteForm() {
  const [fields, setFields] = useState<Fields>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [result, setResult] = useState<string | null>(null)

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validate(fields)
    setErrors(found)
    const firstKey = Object.keys(found)[0]
    if (firstKey) {
      document.getElementById(`q-${firstKey}`)?.focus()
      setResult(null)
      return
    }
    const msg = buildMessage(fields)
    setResult(msg)
    if (isWhatsAppConfigured) window.open(whatsappUrl(msg), '_blank', 'noopener,noreferrer')
  }

  const err = (k: keyof Fields) =>
    errors[k] ? (
      <p id={`q-${k}-err`} className="field__error">
        {errors[k]}
      </p>
    ) : null

  const aria = (k: keyof Fields) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `q-${k}-err` : undefined,
  })

  return (
    <section id="contacto" className="section section--tint">
      <div className="wrap contact">
        <div className="contact__intro">
          <p className="eyebrow">Cotización</p>
          <h2>Cuéntanos qué necesitas</h2>
          <p className="lead">
            Completa el formulario y se preparará un mensaje de WhatsApp con tus datos. Ningún dato se guarda en esta página.
          </p>
          <div className="contact__card">
            <p className="spec__label mono">Contacto directo</p>
            <p className="contact__line">
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp:{' '}
              {isWhatsAppConfigured ? (
                <span className="mono">+{business.whatsappNumber}</span>
              ) : (
                <span className="pending">Pendiente de configurar</span>
              )}
            </p>
            <p className="contact__line">
              <Phone size={18} aria-hidden="true" />
              Teléfono:{' '}
              {business.phoneDisplay ? <span className="mono">{business.phoneDisplay}</span> : <span className="pending">Pendiente de configurar</span>}
            </p>
            <WhatsAppButton message={`Hola, ${business.name}. Quisiera más información sobre sus servicios.`} className="btn btn--wa">
              Escribir por WhatsApp
            </WhatsAppButton>
          </div>
        </div>

        <form className="form" noValidate onSubmit={submit}>
          <div className="field">
            <label htmlFor="q-name">Nombre *</label>
            <input id="q-name" autoComplete="name" value={fields.name} onChange={set('name')} {...aria('name')} />
            {err('name')}
          </div>
          <div className="field">
            <label htmlFor="q-service">Tipo de servicio *</label>
            <select id="q-service" value={fields.service} onChange={set('service')} {...aria('service')}>
              <option value="">Selecciona un servicio</option>
              {services.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
            {err('service')}
          </div>
          <fieldset className="field" aria-describedby={errors.property ? 'q-property-err' : undefined}>
            <legend>Tipo de inmueble *</legend>
            <div className="radios">
              {['Residencial', 'Comercial'].map((p, i) => (
                <label key={p} className="radio">
                  <input
                    type="radio"
                    name="property"
                    id={i === 0 ? 'q-property' : `q-property-${i}`}
                    value={p}
                    checked={fields.property === p}
                    onChange={set('property')}
                  />
                  {p}
                </label>
              ))}
            </div>
            {err('property')}
          </fieldset>
          <div className="field">
            <label htmlFor="q-zone">Colonia o zona *</label>
            <input id="q-zone" value={fields.zone} onChange={set('zone')} placeholder={`Ej. tu colonia en ${business.city}`} {...aria('zone')} />
            {err('zone')}
          </div>
          <div className="field">
            <label htmlFor="q-equipment">Tipo de equipo (si lo conoces)</label>
            <select id="q-equipment" value={fields.equipment} onChange={set('equipment')}>
              <option value="">Sin especificar</option>
              {equipmentTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field field--full">
            <label htmlFor="q-description">Descripción breve *</label>
            <textarea
              id="q-description"
              rows={4}
              value={fields.description}
              onChange={set('description')}
              placeholder="Ej. Minisplit de 1.5 ton que gotea agua por dentro."
              {...aria('description')}
            />
            {err('description')}
          </div>
          <div className="field field--full">
            <label htmlFor="q-phone">Teléfono de contacto (opcional)</label>
            <input id="q-phone" type="tel" inputMode="tel" autoComplete="tel" value={fields.phone} onChange={set('phone')} placeholder="10 dígitos" {...aria('phone')} />
            {err('phone')}
          </div>
          <div className="field--full form__footer">
            <button type="submit" className="btn btn--primary btn--lg">
              <MessageCircle size={18} aria-hidden="true" />
              Preparar mensaje de WhatsApp
            </button>
            <p className="fineprint">* Campos obligatorios.</p>
          </div>

          {result && (
            <div className={`form__result field--full ${isWhatsAppConfigured ? '' : 'form__result--warn'}`} role="status">
              {isWhatsAppConfigured ? (
                <>
                  <p className="form__result-title">
                    <CircleCheck size={18} aria-hidden="true" /> Mensaje listo
                  </p>
                  <p>Si WhatsApp no se abrió automáticamente, usa este enlace:</p>
                  <a className="btn btn--wa" href={whatsappUrl(result)} target="_blank" rel="noopener noreferrer">
                    Abrir WhatsApp
                  </a>
                </>
              ) : (
                <>
                  <p className="form__result-title">
                    <TriangleAlert size={18} aria-hidden="true" /> Demo: WhatsApp sin configurar
                  </p>
                  <p>El formulario es válido. Este es el mensaje que se enviaría al configurar el número del negocio:</p>
                </>
              )}
              <pre className="modal__message">{result}</pre>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
