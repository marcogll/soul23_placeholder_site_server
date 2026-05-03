<div align="center">

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/marcogll/mg_data_storage/b1b4035928e086f9394baf9988f80f4b0075ae20/soul23/logo/s23_logo_wh.png">
    <img src="https://raw.githubusercontent.com/marcogll/mg_data_storage/b1b4035928e086f9394baf9988f80f4b0075ae20/soul23/logo/s23_logo_blk.png" alt="Soul23" width="110">
</picture>

# Soul23 Placeholder

Python-based application for business operations ⚙️

<p>
    <img src="https://img.shields.io/badge/Docker-111111?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Node.js-111111?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Python-111111?style=flat-square&logo=python&logoColor=white" alt="Python">

</p>

</div>

---

<h1 align="center">sol23_placeholder.git</h1>




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

