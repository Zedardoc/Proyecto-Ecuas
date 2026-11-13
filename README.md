# Panel Interactivo: Modelo de Desgaste de Motores e Inventario

Aplicación web estática lista para desplegar en **GitHub Pages** que simula el sistema de ecuaciones diferenciales del ejercicio de aplicación:

- $\frac{dE}{dt} = -kE + m(1 - E)$
- $\frac{dI}{dt} = P_{\text{máx}}E(t) - D$

## Archivos incluidos
- `index.html`: Estructura del panel, controles deslizantes, tarjetas de KPIs, alertas de mantenimiento y contenedores de gráficas.
- `styles.css`: Estilos responsivos en tema oscuro.
- `app.js`: Solución analítica/numérica en tiempo real, cálculo de $m_{\text{mín}}$, $E^*$, $t^*$, alertas preventivas y renderizado de gráficas con Chart.js.

## Cómo subirlo a GitHub Pages
1. Crea un nuevo repositorio en GitHub (por ejemplo, `simulacion-ed-motores`).
2. Sube los archivos `index.html`, `styles.css` y `app.js` a la raíz (`main`) del repositorio.
3. Ve a **Settings > Pages**.
4. En **Build and deployment > Source**, selecciona **Deploy from a branch**, elige la rama `main` y la carpeta `/ (root)`, y haz clic en **Save**.
5. En un minuto tendrás la URL pública lista para abrir desde cualquier navegador.
