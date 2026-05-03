<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/marcogll/mg_data_storage/b1b4035928e086f9394baf9988f80f4b0075ae20/soul23/logo/s23_logo_wh.png">
    <img src="https://raw.githubusercontent.com/marcogll/mg_data_storage/b1b4035928e086f9394baf9988f80f4b0075ae20/soul23/logo/s23_logo_blk.png" alt="Soul23" width="110">
  </picture>
</p>

<h1 align="center">sol23_placeholder.git</h1>

<p align="center">
  Este proyecto ahora funciona como sitio 100% estático: solo HTML, CSS y JavaScript.
</p>

<p align="center">
  [![Docker](https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/marcogll)
  [![Node.js](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://github.com/marcogll)
  [![OpenAI](https://img.shields.io/badge/openai-412991?style=for-the-badge&logo=openai&logoColor=white)](https://github.com/marcogll)
  [![Python](https://img.shields.io/badge/python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://github.com/marcogll)
</p>


## Incluye

- Landing page "Próximamente"
- Contador regresivo en JavaScript nativo
- Formulario que envía datos por `fetch` a webhook
- Página de redirección para Telegram en `/telegram/`

## Estructura mínima para publicar

```txt
/
├── index.html
├── css/
├── js/
├── img/
└── telegram/
    └── index.html
```

## Deploy en Hostinger

1. Comprime estos elementos en un `.zip`: `index.html`, carpetas `css`, `js`, `img` y `telegram`.
2. En Hostinger abre `public_html`.
3. Sube y descomprime el `.zip` dentro de `public_html`.
4. Verifica:
   - `https://tudominio.com/`
   - `https://tudominio.com/telegram/`

## Notas

- No requiere Node.js ni backend para funcionar.
- El formulario depende del webhook externo configurado en `js/form_submission.js`.
