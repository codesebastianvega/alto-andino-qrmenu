# 🚀 Guía de Producción: Aluna SaaS

Este documento sirve como hoja de ruta para finalizar el despliegue del MVP y solucionar los errores detectados en la versión en vivo.

## 🛠 1. Errores Técnicos (Prioridad Alta)

### A. Arreglar Errores 404 en Sub-rutas (SPA)
**Problema:** Al recargar la página en `/admin` o `/sedes`, Vercel da error 404.
**Solución:** Crear un archivo `vercel.json` en la raíz del proyecto.
**Contenido:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### B. Corregir el Demo del Teléfono
**Problema:** El componente `InteractivePhone.jsx` busca `/alto-andino/` y muestra un 404 dentro del celular.
**Ubicación:** `src/components/aluna/InteractivePhone.jsx`.
**Acción:** Cambiar el `src` del iframe para que apunte a `/` o a una ruta de menú válida.

### C. Favicon Faltante
**Problema:** Error 404 al buscar `/favicon.ico`.
**Acción:** 
1. Asegurarse de que el archivo esté en `public/favicon.ico`.
2. Verificar el enlace en `index.html`: `<link rel="icon" href="/favicon.ico" />`.

---

## 🎨 2. Branding y Identidad (Aluna)

### A. Cambiar URL en Vercel
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard).
2. Entra al proyecto `alto-andino-qrmenu`.
3. Ve a **Settings > General**.
4. En **Project Name**, cámbialo a `aluna-qrmenu`.
5. Dale a **Save**. Vercel generará automáticamente la nueva URL.

### B. Reemplazo de Textos en Código
Se detectaron menciones de "Alto Andino" en:
- `index.html` (Meta tags y descripción).
- `src/pages/AdminWebContent.jsx`.
- `src/components/QrPoster.jsx`.

---

## 🔐 3. Configuración de Base de Datos

### Variables de Envono en Vercel
Si la aplicación no carga datos o da error de conexión:
1. Ve a **Settings > Environment Variables** en Vercel.
2. Agrega las siguientes (copia los valores de tu `.env` local):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 🚀 4. Flujo de Trabajo para Actualizar
Cada vez que hagamos un cambio y quieras verlo en línea:
1. Guarda los cambios.
2. En la terminal: `git add .`
3. `git commit -m "Ajustes de branding y routing"`
4. `git push origin main`
5. ¡Espera 2 minutos y refresca el navegador!
