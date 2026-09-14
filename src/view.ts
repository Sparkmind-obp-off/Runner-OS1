export function renderShell(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Runner OS — a calm operating system for active commitments.">
  <title>Runner OS</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <div id="app" class="app-shell">
    <section class="loading-state" aria-live="polite">Loading Runner OS…</section>
  </div>
  <noscript>Runner OS requires JavaScript to operate.</noscript>
  <script type="module" src="/static/app.js"></script>
</body>
</html>`
}
