# Built-in courses

Put course `.json` files in this directory. Sahel reads and validates every
top-level JSON file automatically when the app loads, then makes valid courses
available through the same IndexedDB-backed learning flow as imported courses.

- Refresh the browser after adding, changing, or removing a file.
- File names do not matter; the course `id` inside each JSON file must be unique.
- A data-file course is authoritative when an imported course uses the same `id`.
- Removing a data file also removes that course's local progress and review cards.
- Invalid files are skipped and reported in the app.
- Run with `npm run dev` or `npm start` so the server can read this directory.
