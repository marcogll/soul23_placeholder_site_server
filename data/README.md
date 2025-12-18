# Data Files

This directory contains various data files used by the application.

## Organization

*   `quotes.json`: Stores a collection of phrases for the `/day-quote` endpoint.
*   Other `.json` files: Should contain structured data for specific application features.
*   Avoid storing large binary files directly in this directory; consider external storage solutions or dedicated asset folders for those.

## Best Practices

*   Ensure all data files are in a structured, easily parsable format (e.g., JSON, YAML).
*   Provide a clear description for each data file, either in comments within the file (if the format supports it) or in this README.
*   Do not store sensitive information in plaintext here. Use environment variables or a secure configuration management system for secrets.