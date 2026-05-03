<div align="center">

<img src="https://soul23.mx/logo/soul23_logo.svg" width="90" alt="Soul23">

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

