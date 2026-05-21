# Static deployment

## Build output

```sh
npm ci
npm run demo:build
```

Serve the resulting `web-dist` directory with a static server. The generated index uses relative module and stylesheet paths, so it can live under a site subdirectory. Keep the entire dist subtree together.

`npm run demo:serve` previews on 127.0.0.1:4173. It is a local preview helper. For a public site, configure the hosting service to serve JavaScript as JavaScript and enable HTTPS so microphone capture is available.

There is no backend database, API key or server-side audio processing. Regenerate web-dist after changing source. Do not publish node_modules, local recordings or development credentials with the static site.
