# HTML Templates

This directory contains HTML files that serve as templates or specific pages for the application, not meant to be served as static assets from the root.

## Organization

*   `telegram.html`: A specific HTML page used for Telegram redirection logic.
*   Other `.html` files: Should be specific templates or special pages.

## Best Practices

*   HTML files in this directory are typically served dynamically by the Express server for specific routes.
*   Keep the HTML semantic and clean.
*   Avoid placing general static HTML assets here; those should reside in the project root if they are meant to be served as part of the primary static content.