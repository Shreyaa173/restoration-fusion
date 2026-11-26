
# DFFN: Deep Feature Fusion Network for Image Deblurring

B.Tech project, Department of Computer Science and Engineering, Indira Gandhi Delhi Technical University for Women (IGDTUW), Delhi. November 2026.

**Team:** Shreya Gupta, Shreya Tejan, Naurah Ahsan, Bhoomi Pandey  
**Guide:** Dr. Ravinder M.

---

## Overview

Image deblurring networks built on different ideas (CNNs, frequency-domain models, Transformers) make errors in different regions of an image. Ensembles usually average the final outputs, which ignores how reliable each model is at each pixel.

**DFFN** keeps three pretrained experts frozen, taps the last full-resolution feature map of each, and trains a small module that decides, **per pixel**, how much to trust each expert.

This repository contains the project website (React) and the Colab backend that powers its live demo.

## Results

**GoPro test set:** 1,111 images, RGB.

| Method | PSNR (dB) | SSIM |
|---|---:|---:|
| HINet | 32.88 | 0.9380 |
| SFNet | 33.22 | 0.9429 |
| AdaIR | 28.11 | 0.8607 |
| Average of the 3 outputs (no learning) | 32.25 | 0.9324 |
| **DFFN (ours)** | **33.45** | **0.9448** |

### Key Findings

- +0.23 dB over the best single expert (SFNet) and +1.20 dB over output averaging.
- Better than the best expert on 97.7% of test images (1,085 / 1,111).
- Only 0.24M parameters are trained, under 0.2% of the frozen experts (about 131M in total).
- Without any supervision on the gate, DFFN learns to suppress AdaIR (about 0% mean weight) and relies on SFNet (about 68%) and HINet (about 32%).

## How It Works

```text
blurry image
   |-- HINet  (frozen) --> image + 64-ch features --+
   |-- SFNet  (frozen) --> image + 32-ch features --+--> 1x1 conv per expert -> 48 ch
   |-- AdaIR  (frozen) --> image + 96-ch features --+            |
                                                      Pixel-wise Reliability Gate
                                                (two 3x3 convs + softmax -> 3 weights/pixel)
                                                                 |
                                   weighted features -> SE -> 4 residual blocks -> correction
                                   weighted expert images (same weights) ------+
                                                                               v
                                          output = weighted image blend + correction, clamped to [0, 1]
```

### Expert Feature Taps

| Expert | Feature tap | Channels |
|---|---|---:|
| HINet | Input to the final convolution | 64 |
| SFNet | Output of the last decoder block | 32 |
| AdaIR | Output of the refinement block | 96 |

### Trainable Parameters

**Total trainable parameters:** 241,698

| Component | Parameters |
|---|---:|
| Align | 9,360 |
| Gate | 63,555 |
| Squeeze-and-excitation | 1,212 |
| Residual blocks | 166,272 |
| Head | 1,299 |

## Training and Testing

### Training

- Dataset: GoPro_Large blur images only, 2,103 training pairs.
- Random 256 × 256 crops (same window on blurry and sharp images).
- Horizontal flips.
- Pixels scaled to `[0, 1]`.
- Loss: L1 + 0.1 × frequency-domain L1.
- 2,000 iterations.
- Learning rate: `2e-4`.
- Hardware: Tesla T4 in Google Colab.

### Testing

- Full-resolution images.
- Reflect-padded to a multiple of 32.
- Outputs cropped back to the original dimensions.

## Repository Layout

```text
frontend/                 Vite + React project website
  src/config.js           ALL page text and reported numbers (edit here)
  src/sections/Report.jsx hero, abstract, method, results, trust explorer, cost, limitations, citation
  src/sections/Demo.jsx   backend connection, upload, compare / zoom / error maps / trust map
  src/components/         BeforeAfter slider, Pipeline diagram
  src/api.js              GET /health, POST /restore
  public/report/          figures from the report

backend/
  restoration_fusion_backend_v9_dffn_final.ipynb
                          current Colab backend
  archive_v5/             earlier NAFNet-based backend (not used by the site)
```

## Quick Start

### 1. Start the Backend (Google Colab)

1. Open `backend/restoration_fusion_backend_v9_dffn_final.ipynb` in Colab and choose a **GPU runtime** (a T4 is enough).
2. In the CONFIG cell:
   - Set `SFNET_HF_REPO` to your Hugging Face repo holding `GOPRO.pkl`. If you do not have one, run the one-time upload cell below it (requires a Colab secret named `HF_TOKEN` with write access).
   - Keep `FUSION_FROM_DRIVE = True` and put the trained DFFN checkpoint at either:
     - `MyDrive/DFFN/checkpoints/final/deblur_dffn.pt`
     - `MyDrive/DFFN/results/final/ckpt/deblur_DFFN.pt`
   - Without the trained checkpoint, the fusion output is an untrained placeholder equal to a plain average, and `/health` reports `fusion_trained: false`.
3. Run all cells from top to bottom. HINet weights download automatically; AdaIR comes from Hugging Face.
4. The last cell prints a public address like `https://xxxx.trycloudflare.com`. Keep the notebook running while you use the demo.

### 2. Start the Website

Requires **Node.js 18 or newer**.

```bash
cd frontend
npm install
npm run dev
```

Open the page, go to **Try it on your own image**, and paste the Colab address into **Backend URL**. It is remembered in your browser.

To preset it, create `frontend/.env`:

```env
VITE_API_URL=https://xxxx.trycloudflare.com
```

Build for deployment with:

```bash
npm run build
```

The build output is in `frontend/dist`.

## Using the Demo

1. Drop in a motion-blurred photo. Optionally add the sharp version of the same scene to get PSNR and SSIM for every output.
2. Click **Deblur image**.
3. Explore the results:
   - **Compare:** slider against the input.
   - **Zoom:** same region from every output.
   - **Error maps:** requires the sharp image.
   - **Trust map:** shows where DFFN trusts each expert.

Images larger than `MAX_SIDE` (1024 px) are downscaled so all three experts fit on a T4. Scores on your own image can sit above or below the test-set averages.

## API

| Endpoint | Description |
|---|---|
| `GET /health` | GPU name, which experts loaded, and whether DFFN weights loaded. |
| `GET /benchmarks` | Reported test-set numbers. |
| `POST /restore` | Multipart form: `image`, optional `gt`, `task=deblur`. Returns each output as a PNG data URL, PSNR / SSIM when `gt` is given, the trust map, and each expert's average share. |

## Editing the Page

All text and numbers live in `frontend/src/config.js`.

Expert order is HINet, SFNet, AdaIR everywhere, matching `ORDER` in the notebook. The expert colours (blue, amber, magenta) match the backend's trust map.

Still to fill in: author profile links and the report link (both currently `null`).

## Limitations

- Gains over the best expert are small (+0.23 dB) and come from one short training run with one seed.
- The gate effectively ignores AdaIR, so the system behaves like a two-expert blend while still paying for a third network at inference.
- Only the last full-resolution feature map is fused. Multi-scale feature fusion is future work.
- Latency and compute of the final pipeline were not measured.
- Free Cloudflare tunnels cut a request after about 100 seconds.

## Citation

```bibtex
@techreport{dffn2026,
  title       = {Deep Feature Fusion Network for Image Deblurring},
  author      = {Gupta, Shreya and Tejan, Shreya and Ahsan, Naurah and Pandey, Bhoomi},
  institution = {Indira Gandhi Delhi Technical University for Women},
  type        = {B.Tech project report},
  year        = {2026},
  month       = nov,
  note        = {Supervisor: Dr. Ravinder M.}
}
```

## Acknowledgements

Built on [HINet](https://github.com/megvii-model/HINet), [SFNet](https://github.com/c-yn/SFNet), and [AdaIR](https://github.com/c-yn/AdaIR), evaluated on the GoPro dataset (Nah et al., CVPR 2017).

Thanks to our guide, Dr. Ravinder M.

Each pretrained model keeps its own license; check the linked repositories before reuse.
