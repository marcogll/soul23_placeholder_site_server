<div align="center">

<a href="https://soul23.mx">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/marcogll/mg_data_storage/refs/heads/main/soul23/logo/soul23_logo_wh.png">
  <img src="https://raw.githubusercontent.com/marcogll/mg_data_storage/refs/heads/main/soul23/logo/soul23_logo_blk.png" alt="Soul23" width="110">
</picture>
</a>

</div>

# Soul23 Placeholder

Proyecto de software para operaciones empresariales ⚙️

<p>
  <img src="https://img.shields.io/badge/español-111111?style=flat-square&logo=googletranslate&logoColor=white" alt="Español">
</p>

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


