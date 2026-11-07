# Paper Bros website

A static website (no server needed) for selling O Level topical past papers and notes.
It works on GitHub Pages, Netlify, or any web host.

```
index.html          Storefront: catalog, cart, checkout, contact form
admin.html          Admin panel: products, subjects, settings, order tracker
assets/css/         Styles
assets/js/data.js   ALL products, prices and settings (the admin page generates this)
assets/js/app.js    Storefront logic
assets/js/admin.js  Admin logic
assets/covers/      Cover-page images shown on the product cards
```

## Cover pages
Every product has a cover in `assets/covers/` (click it on the site to zoom).
- **Real first pages** (taken from the Drive PDFs): all notes, both formula sheets, both English workbooks.
- **Designed covers** in the Paper Bros style: all topical Paper 1/Paper 2 books, plus Business notes.
  Replace any of these with the real first page whenever you like (same file name).
Products without a cover image show a coloured book with the syllabus code.

To add or change a cover: save the first page of the PDF as a JPG (about 720px wide),
put it in `assets/covers/`, then in the admin page edit the product and set
**Cover image** to `assets/covers/<file>.jpg`. Publish `data.js` and upload the image too.

## 1. Put it online (GitHub Pages)
1. In your `paperbros` repository, upload `index.html`, `admin.html` and the whole `assets` folder
   (Add file → Upload files → Commit changes).
2. The site appears at `https://paperbrosofficial.github.io/paperbros/`.

## 2. Turn on order emails (one time)
Orders and contact messages are sent by [FormSubmit](https://formsubmit.co) (free, no account) to the
email in Settings (default `paperbrosofficial@gmail.com`).

1. Open the live site and place one test order.
2. FormSubmit emails **paperbrosofficial@gmail.com** with the subject "Action Required: Activate FormSubmit…".
   Click **Activate Form** (also check the Spam folder).
3. Every order after that arrives in your inbox with all the customer's details.

This only works from the live website (http/https), not when you double-click `index.html` on your computer.

## 3. Admin page
Open `admin.html` (e.g. `https://paperbrosofficial.github.io/paperbros/admin.html`).

- **Default passcode:** `paperbros@2026`. Change it in **Settings** and publish.
- **Products / Subjects / Settings:** edit prices, stock, delivery charges, bKash/Nagad numbers, the announcement bar and more.
- **Publish:** changes are saved as a draft in your browser. Click **Preview site** to check them, then
  **Download data.js** and upload it to `assets/js/` in the repository, replacing the old file.
- **Orders:** each order email ends with an *Admin import code*. Paste it in the Orders page to track the
  order (New → Confirmed → Shipped → Delivered). The tracker lives in your browser, so use **Export CSV** or
  **Download orders backup** to keep a copy.

### About admin security
The site has no server, so the passcode only stops casual visitors from opening the panel.
It can't change the live website by itself: your changes only go live when you upload `data.js` to GitHub,
which needs your GitHub login. Never put private data in `data.js`, since anyone can read it.
