# Boadilla School

Portal estático de **Boadilla School**, una colección educativa independiente y familiar. Reúne recursos breves para niñas y niños de 7 a 11 años; no representa ni está afiliado a ningún centro escolar.

## Estructura

- `index.html`: portada y catálogo de recursos disponibles.
- `404.html`: página de error coherente con la marca.
- `styles.css`: sistema visual y estilos adaptables, sin dependencias.
- `favicon.svg`: marca local del libro abierto.

La portada no tiene proceso de compilación ni JavaScript. No hay cuentas, anuncios, analítica ni recursos remotos.

## Spelling: dirección estable

`https://boadillaschool.github.io/spelling/` reúne las listas semanales. La carpeta `spelling/` es una **copia generada de distribución**, no una segunda fuente de la aplicación.

El código, currículo, audios y pruebas se mantienen en el repositorio independiente [boadillaschool/spelling-ea-ee](https://github.com/boadillaschool/spelling-ea-ee). Para actualizar la distribución, ejecuta desde ese checkout:

```sh
node scripts/export-pages.mjs ../boadillaschool.github.io/spelling
```

Ajusta únicamente la ruta del checkout del portal. Revisa el diff, ejecuta sus pruebas, publica `main` de este portal y verifica la URL real antes de actualizar la publicación antigua. No edites los archivos generados a mano. La aplicación usa módulos JavaScript y audio locales con su propia CSP; conserva las claves de progreso por lista y no envía datos.

La URL antigua `/spelling-ea-ee/` redirige a `/spelling/`, conservando los enlaces a cada fecha. Los dos paths comparten origen, por lo que el progreso permanece disponible en el mismo navegador.

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
