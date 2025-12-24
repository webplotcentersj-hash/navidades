# Plot Sound - Sintetizador de Sonidos Urbano

Aplicación web React + Vite que genera sonidos urbanos sintetizados (sirenas, bocinas, alarmas, etc.) usando Web Audio API. Funciona 100% offline, sin necesidad de archivos de audio.

## 🎵 Características

- **9 sonidos diferentes**: Policía, Bocina, Camión, Alarma Aérea, Retroceso, Taladro, Robo, Estática, Láser
- **100% Offline**: No requiere conexión a internet ni archivos de audio
- **Sintetización en tiempo real**: Usa Web Audio API para generar sonidos matemáticamente
- **Control de volumen maestro**: Ajusta el volumen de todos los sonidos
- **Interfaz moderna**: Diseño oscuro con Tailwind CSS

## 🚀 Instalación

```bash
npm install
```

## 💻 Desarrollo

```bash
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 🌐 Despliegue

El proyecto está configurado para desplegarse en múltiples plataformas:

### Vercel (Recomendado)

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio `webplotcentersj-hash/navidades`
4. Vercel detectará automáticamente la configuración de Vite
5. ¡Listo! Tu app estará desplegada

### Netlify

1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio `webplotcentersj-hash/navidades`
4. Netlify usará automáticamente el archivo `netlify.toml`
5. Build command: `npm run build`
6. Publish directory: `dist`

### GitHub Pages

1. Instala `gh-pages`: `npm install --save-dev gh-pages`
2. Agrega al `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Ejecuta: `npm run deploy`

## 🛠️ Tecnologías

- React 19
- Vite 7
- Tailwind CSS 4
- Web Audio API
- Lucide React (iconos)
