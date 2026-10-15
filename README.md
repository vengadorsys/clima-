# NORTE CLIMA · Landing de climatización (demo)

Landing page para un negocio de instalación y mantenimiento de aire acondicionado en Torreón, orientada a cotizar por WhatsApp. Hecha con Vite + React + TypeScript e iconos de Lucide.

## Ejecutar

```bash
npm install
npm run dev           # desarrollo
npm run build         # producción en dist/
npm run build:single  # un solo HTML autocontenido en dist-single/
```

## Antes de publicar

Todos los datos del negocio están en `src/config.ts`:

- `whatsappNumber`: número real en formato internacional, solo dígitos (p. ej. 52 + 10 dígitos). Mientras esté vacío, los botones muestran un aviso de demo en lugar de abrir WhatsApp.
- `phoneDisplay`, `email`: datos de contacto visibles.
- `reviews`: reseñas reales y verificables. Mientras esté vacío se muestra un espacio reservado.
- `isDemo`: cámbialo a `false` para quitar los avisos de demostración.

Además:

- Sustituye las ilustraciones de `src/components/Illustrations.tsx` por fotos reales de trabajos del negocio.
- Confirma servicios, zonas de cobertura (Gómez Palacio y Lerdo figuran como "sujeto a confirmación"), materiales y condiciones de garantía.
- Publica un aviso de privacidad antes de recibir datos de clientes.
