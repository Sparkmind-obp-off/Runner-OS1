export function renderShell(): string {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Runner OS — ruang pribadi untuk jadwal, aktivitas, event, dan persiapan lari.">
  <title>Runner OS</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div id="app" class="app-shell">
    <section class="loading-state" aria-live="polite">Menyiapkan Runner OS…</section>
  </div>
  <noscript>Runner OS memerlukan JavaScript untuk digunakan.</noscript>
  <script type="module" src="/static/app.js"></script>
</body>
</html>`
}
