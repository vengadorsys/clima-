import { business } from './config'
import { isWhatsAppConfigured, messages } from './lib/whatsapp'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { QuoteForm } from './components/QuoteForm'
import { WhatsAppButton, WhatsAppProvider } from './components/WhatsApp'
import {
  Brands,
  Coverage,
  Differentiators,
  Faq,
  FinalCta,
  Gallery,
  Hero,
  Process,
  Reviews,
  Services,
} from './components/Sections'

export default function App() {
  return (
    <WhatsAppProvider>
      <a href="#main" className="skip">Saltar al contenido</a>
      {business.isDemo && !isWhatsAppConfigured && (
        <p className="demo-bar">
          Demo comercial · Falta configurar el número de WhatsApp y validar los datos del negocio
        </p>
      )}
      <Header />
      <main id="main">
        <Hero />
        <Services />
        <Gallery />
        <Differentiators />
        <Process />
        <Brands />
        <Coverage />
        <Reviews />
        <Faq />
        <QuoteForm />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppButton message={messages.general} className="wa-float" ariaLabel="Cotizar por WhatsApp">
        <span className="wa-float__label">Cotizar</span>
      </WhatsAppButton>
    </WhatsAppProvider>
  )
}
