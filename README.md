# Squid Casino Spin Minigame

A Squid Game inspired casino spin-to-win minigame built with vanilla HTML, CSS, and JavaScript.

## Features

- Three themed arenas with different background and mascot art.
- Casino-styled prize wheel with Squid Game shape markers.
- Weighted prize selection and animated spin behavior.
- Token balance, winnings, recent winners, and skip-animation preference stored in `localStorage`.
- Responsive layout for desktop and mobile screens.

## Run Locally

This project uses browser ES modules, so serve it over HTTP instead of opening `index.html` directly.

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/
```

You can also use any static server, such as VS Code Live Server.

## Validate JavaScript

```bash
npm run check:js
```

## Project Structure

```text
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── icons.js
│   ├── storage.js
│   └── wheel.js
└── assets/
```

## GitHub Pages

This is a static site and can be published directly with GitHub Pages.

1. Push the repository to GitHub.
2. Open the repository settings.
3. Go to **Pages**.
4. Set the source to the main branch and root folder.
5. Save and wait for GitHub Pages to deploy.

## Notes

- The game is a front-end prototype and does not include a backend, real wallet, or payment integration.
- Prize results and balances are stored locally in the browser only.
- The project loads Google Fonts from the public CDN.
