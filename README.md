# DFFN: Deep Feature Fusion Network for Image Deblurring (project website)

One page for the B.Tech project (IGDTUW, November 2026): abstract, method, GoPro results, what the gate learned,
cost, limitations, and a live demo where you upload a blurry image and get HINet, SFNet, AdaIR, plain output
averaging and DFFN side by side (plus PSNR / SSIM if you add the sharp image). All ML runs in Google Colab; the React
page only sends the image.

```
frontend/   Vite + React single page
  src/config.js            ALL text and ALL reported numbers (edit here to change the page)
  src/sections/Report.jsx  hero, abstract, method, results, trust explorer, cost, limitations, citation
  src/sections/Demo.jsx    backend connection, upload, compare / zoom / error maps / trust map
  src/components/          BeforeAfter slider, Pipeline diagram
  src/api.js               GET /health, POST /restore
  public/report/           figures from the report (panel_*.jpg are the trust-strip panels, cropped)
backend/
  restoration_fusion_backend_v9_dffn_final.ipynb   current backend (HINet + SFNet + AdaIR + DFFN)
  archive_v5/                                      earlier NAFNet-based backend, no longer used by the site
```

## Run it
1. Open `backend/restoration_fusion_backend_v9_dffn_final.ipynb` in Colab on a **GPU runtime** and run the cells top
   to bottom. Set `SFNET_HF_REPO` in the CONFIG cell (see the one-time cell below it) and keep the trained DFFN
   checkpoint in `MyDrive/DFFN` (`checkpoints/final/deblur_dffn.pt` or `results/final/ckpt/deblur_DFFN.pt`).
   The last cell prints `https://xxxx.trycloudflare.com`.
2. `cd frontend && npm install && npm run dev`, open the page, paste that URL into **Backend URL**
   (or put `VITE_API_URL=...` in `frontend/.env`).

## API (as served by the v9 notebook)
- `GET /health`: GPU name, which experts loaded, whether DFFN weights loaded
- `POST /restore` multipart: `image`, optional `gt` (the sharp image). Returns each output as a PNG data URL, PSNR / SSIM
  when `gt` is given, the trust map and each expert's average share.

## Notes
- Numbers on the page are the report's: GoPro test set (1,111 images), DFFN 33.45 dB / 0.9448, 0.24M trained parameters.
  Expert order everywhere is HINet, SFNet, AdaIR, matching `ORDER` in the notebook. Expert colours (blue, amber,
  magenta) are the trust-map colours the backend also uses; change them in `config.js` only.
- Still open in `config.js`: author profile links and the "Report" link are `null` (they render without a link / as "soon").
  The BibTeX entry is a `@techreport` for the B.Tech report; change it if you publish a paper.
- Quick Cloudflare tunnels cut a request after about 100 s; the page explains this if the backend stops answering.
