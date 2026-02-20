# efoWeb Donation Campaign Site

Stack:

- GitHub Pages (static hosting)
- Static HTML/CSS/JS
- Google Apps Script (form API)
- Google Sheets (submission storage)
- Google Drive (receipt links + historical docs)

## Structure

- `index.html` - poster-centric landing + right panel form/history
- `assets/css/styles.css` - styling
- `assets/js/config.js` - Apps Script URL config
- `assets/js/app.js` - form submit + progress/history rendering
- `data/progress.json` - manual progress values
- `data/historical.json` - historical transparency links
- `apps-script/Code.gs` - Apps Script server logic
- `apps-script/README.md` - Apps Script setup guide

## Local Preview

Run from this folder:

```bash
python3 -m http.server 8080
```

Open:

`http://localhost:8080`

## Deploy to GitHub Pages

1. Push this folder to GitHub repository.
2. GitHub repo -> Settings -> Pages.
3. Deploy from `main` branch, root `/`.
4. Site will be available on GitHub Pages URL.

## Manual Progress Update

Edit `data/progress.json` and commit changes.

Only values from this file are displayed in progress overlay.

## Historical Links Update

Edit `data/historical.json` and commit changes.

## Form API

Set Apps Script URL in `assets/js/config.js`.

Without that URL, form will not submit and will show setup warning in UI.
