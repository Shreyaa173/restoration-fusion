# Restoration Fusion: demo website

One page. Upload an image, pick Deblurring or Deraining, get four outputs side by side
(HINet, SFNet, AdaIR, Fusion) plus PSNR/SSIM. All ML runs in Google Colab; the React page only
sends the image and shows results.

```
frontend/   Vite + React single page
backend/    restoration_fusion_backend.ipynb  (Colab, FastAPI + Cloudflare tunnel)
            restoration_fusion_backend.py     (same code, '# %%' cells; run build_notebook.py to regenerate the .ipynb)
```

## Run it
1. Open `backend/restoration_fusion_backend.ipynb` in Colab (GPU runtime), run all cells.
   The last cell prints `https://xxxx.trycloudflare.com`.
2. `cd frontend && npm install && npm run dev`, open the page, paste that URL in "Backend URL".
   (Or put it in `frontend/.env` as `VITE_API_URL=...`.)
3. Drop an image. Optionally also drop the ground-truth clean image to get per-image PSNR/SSIM.

## API
- `GET /health`, `GET /benchmarks`
- `POST /restore` multipart: `image`, `task` (`deblur` | `derain`), optional `gt`

## To finish later
- Train the two fusion models and save state_dicts to `/content/weights/fusion_deblur.pth` and
  `fusion_derain.pth`. Until then fusion is an identity-initialised placeholder (equals a plain average)
  and the UI says so.
- Fill `/content/benchmarks.json` with your test-set averages (the page shows it in "Test-set averages").
- Set the project name in `frontend/src/config.js`.
