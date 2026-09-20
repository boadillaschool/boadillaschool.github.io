# Boadilla School

Portal estático de **Boadilla School**, una colección educativa independiente y familiar. Reúne recursos breves para niñas y niños de 7 a 11 años; no representa ni está afiliado a ningún centro escolar.

## Estructura

- `index.html`: portada y catálogo de recursos disponibles.
- `404.html`: página de error coherente con la marca.
- `styles.css`: sistema visual y estilos adaptables, sin dependencias.
- `favicon.svg`: marca local del libro abierto.

No hay proceso de compilación, JavaScript, cuentas, anuncios, analítica ni recursos remotos.

## Vista local

Desde la raíz del repositorio:

```sh
python3 -m http.server 4173
```

Después, abre `http://localhost:4173/`.

## Añadir un recurso

1. Confirma que el recurso está terminado y disponible en una ruta estable como `/nombre-del-recurso/`.
2. Añade su materia al índice lateral solo si todavía no existe.
3. Copia la estructura de `article.resource-card` en `index.html` e indica materia, nivel, duración, descripción y enlace reales.
4. No publiques tarjetas de recursos futuros, enlaces vacíos ni datos personales.
5. Mantén la política de privacidad: sin cuentas, anuncios, analítica ni envío de respuestas.

Antes de confirmar cambios:

```sh
npx --yes html-validate index.html 404.html
npx --yes csstree-validator styles.css
git diff --check
```
