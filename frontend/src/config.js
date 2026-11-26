// Everything editable on the page lives here. All numbers come from the project report / abstract
// and from the v9 backend notebook (HINet + SFNet + AdaIR, DFFN fusion module).

export const PROJECT_NAME = "Pixel-wise Reliability Gate (PRG)";
export const TITLE = "Deep Feature Fusion Network for Image Deblurring";
export const SUBTITLE =
  "Three frozen restoration networks, one small gate that decides which of them to trust at every pixel.";

export const AUTHORS = [
  { name: "Bhoomi Pandey", url: null },
  { name: "Naurah Ahsan", url: null },
  { name: "Shreya Gupta", url: null },
  { name: "Shreya Tejan", url: null },

];
export const GUIDE = "Dr. Ravinder M.";
export const AFFILIATION =
  "Department of Computer Science & Engineering, Indira Gandhi Delhi Technical University for Women, Delhi";

// url: null renders a disabled "Soon" button
export const LINKS = [
  { label: "Live demo", url: "#demo", primary: true },
  { label: "Code", url: "https://github.com/Shreyaa173/Pixel-wise-reliability-gate" },
  { label: "Report", url: null },
];

/* Experts, in the exact order the backend uses (ORDER = hinet, sfnet, adair). */
export const EXPERTS = [
  { id: "hinet", name: "HINet", kind: "Two-stage CNN", detail: "Half instance normalisation blocks", tap: "Input to final convolution", ch: 64, params: 88.7, color: "#3b82f6" },
  { id: "sfnet", name: "SFNet", kind: "Frequency CNN", detail: "Selective frequency processing", tap: "Output of last decoder block", ch: 32, params: 13.3, color: "#f59e0b" },
  { id: "adair", name: "AdaIR", kind: "Transformer", detail: "Frequency mining and modulation", tap: "Output of refinement block", ch: 96, params: 28.8, color: "#d946ef" },
];

/* Everything the demo can return, in display order. */
export const MODELS = [
  ...EXPERTS.map((e) => ({ id: e.id, name: e.name, kind: e.kind, color: e.color })),
  { id: "average", name: "Output averaging", kind: "Plain mean of the three outputs", baseline: true },
  { id: "fusion", name: "DFFN", kind: "Learned fusion (ours)", ours: true },
];

export const TRUST_COLORS = Object.fromEntries(EXPERTS.map((e) => [e.id, e.color]));

export const TASK = "deblur";
export const DATASET = "GoPro";
export const DEFAULT_API = import.meta.env.VITE_API_URL || "";

/* ---------------- Abstract (structured, from the report) ---------------- */

export const ABSTRACT = [
  ["Background", "Image deblurring restores the sharpness of motion-blurred images. Restoration networks use different architectures, such as Convolutional Neural Networks and Transformers, and each makes errors in different regions of an image. Current ensemble approaches only combine the final outputs of the models and do not consider how reliable each model is in each region."],
  ["Objectives", "This work combines several pretrained image restoration models at the feature level, learning per pixel which model to trust through reliability weights, while training only the parameters that decide which model provides the most useful information for each image region."],
  ["Methods", "The Deep Feature Fusion Network (DFFN) keeps three pretrained experts, HINet, SFNet and AdaIR, frozen and taps the last full-resolution feature map of each. A 1×1 convolution aligns these maps to a common 48 channels. A Pixel-wise Reliability Gate (PRG), built from two 3×3 convolutions and a softmax, predicts three trust weights per pixel."],
  ["Results", "The learned weights fuse the experts’ features and restored images at every pixel, with a refined correction added. Only 0.24M parameters are trained, under 0.2% of the frozen experts. On the GoPro test set (1,111 images), DFFN reaches 33.45 dB PSNR and 0.9448 SSIM, ahead of every individual expert and of output averaging (+0.23 dB over SFNet, +1.20 dB over averaging), and improves on the best expert for 97.7% of test images. Gate heatmaps show that DFFN learns, without supervision, to suppress the least reliable expert."],
  ["Conclusion", "DFFN consistently improves state-of-the-art deblurring models through a lightweight, interpretable fusion module, without retraining them. Future work will explore multi-scale feature fusion."],
];

export const KEYWORDS = ["Image deblurring", "Deep feature fusion", "Pixel-wise reliability gate", "Convolutional Neural Networks", "Transformers"];

/* ---------------- Results ---------------- */

export const GLANCE = [
  { value: "33.45", unit: "dB", label: "PSNR on GoPro", sub: "all 1,111 test images" },
  { value: "0.9448", unit: "", label: "SSIM", sub: "best of all five methods" },
  { value: "+0.23", unit: "dB", label: "over the best expert", sub: "SFNet, 33.22 dB" },
  { value: "+1.20", unit: "dB", label: "over output averaging", sub: "averaging: 32.25 dB" },
  { value: "97.7", unit: "%", label: "images improved", sub: "1,085 of 1,111 beat the best expert" },
  { value: "0.24", unit: "M", label: "trained parameters", sub: "under 0.2% of the frozen experts" },
];

// [id, label, [psnr, ssim]]
export const TABLE = [
  ["hinet", "HINet", [32.88, 0.9380]],
  ["sfnet", "SFNet", [33.22, 0.9429]],
  ["adair", "AdaIR", [28.11, 0.8607]],
  ["average", "Average of 3 (no learning)", [32.25, 0.9324]],
  ["fusion", "DFFN (ours)", [33.45, 0.9448]],
];
export const TABLE_DELTAS = [
  ["DFFN − best single expert (SFNet)", "+0.23 dB"],
  ["DFFN − average of 3", "+1.20 dB"],
  ["Images where DFFN beats the best expert", "97.7% (1,085 / 1,111)"],
];

export const PLOT = { range: [28, 34], ticks: [28, 29, 30, 31, 32, 33, 34] };

// Mean gate weight per expert over the GoPro test set (percent).
export const WEIGHTS = [
  { id: "hinet", name: "HINet", value: 32 },
  { id: "sfnet", name: "SFNet", value: 68 },
  { id: "adair", name: "AdaIR", value: 0 },
];

export const ANALYSIS = [
  ["Averaging is not safe.", "Giving every expert equal weight scores 32.25 dB, which is 0.97 dB below SFNet alone. The weakest expert (AdaIR, 28.11 dB) drags the mean down. Trust has to be learned."],
  ["The gate finds the weak expert by itself.", "No label tells the gate which model is worst. After training it gives AdaIR close to zero weight everywhere and leans on SFNet (68%) and HINet (32%)."],
  ["The gain is consistent, not an average of wins and losses.", "DFFN improves on the best expert for 97.7% of test images."],
];

/* ---------------- Method ---------------- */

export const METHOD_STEPS = [
  ["Run the experts", "The blurry image goes through HINet, SFNet and AdaIR. Their weights never change. Each returns a restored image and, through a forward hook, the last full-resolution feature map it computed."],
  ["Align", "The three feature maps have 64, 32 and 96 channels. A separate 1×1 convolution per expert projects each to a common 48 channels."],
  ["Gate", "The Pixel-wise Reliability Gate stacks the aligned features, applies two 3×3 convolutions and a softmax, and outputs three weights per pixel that sum to one."],
  ["Fuse and refine", "The same weights blend the aligned features. A squeeze-and-excitation block and four residual blocks turn the fused features into a correction."],
  ["Blend and correct", "The same weights also blend the three restored images. Final output = weighted image blend + correction, clamped to [0, 1]."],
];

export const TRAINING = [
  ["Data", "GoPro (GOPRO_Large): 2,103 training pairs, 1,111 test pairs from unseen scenes. Only the standard blur version is used. Training uses random 256×256 crops with the same window on blurry and sharp images, plus random horizontal flips. Pixels are scaled to [0, 1] with no other normalisation."],
  ["Loss and schedule", "L1 plus 0.1 × a frequency-domain (FFT) L1 term. 2,000 iterations, learning rate 2e-4, on a single Tesla T4 in Colab."],
  ["Test time", "Full images at original resolution. Reflect padding makes sizes a multiple of 32 for the experts, then outputs and feature maps are cropped back."],
];

export const FUSER_PARAMS = [
  ["Align (3 × 1×1 conv)", "9,360"],
  ["Pixel-wise Reliability Gate", "63,555"],
  ["Squeeze-and-excitation", "1,212"],
  ["Four residual blocks", "166,272"],
  ["Output head", "1,299"],
];

/* ---------------- Cost ---------------- */

export const COST_NOTE = "AdaIR accounts for roughly 65% of inference time. Because the learned gate gives it almost no weight, it is the obvious candidate to remove in a future version. That would mean retraining the fusion module without it, which was not tested here. Latency and GMACs for the final pipeline were not recorded.";
export const FUSER_M = 0.242;

// export const LIMITATIONS = [
//   "Gains over the best expert are small (+0.23 dB) and come from one short training run with one seed, so there are no confidence intervals.",
//   "The gate effectively ignores AdaIR, so the final system behaves like a two-expert blend that still pays for a third network at inference time.",
//   "Only the last full-resolution feature map is fused. Multi-scale feature fusion is planned future work.",
//   "Latency and compute of the final pipeline were not measured.",
//   "The demo downsizes any image larger than the backend’s limit so all three experts fit on a T4. Scores on your own image can sit above or below the test-set averages.",
// ];

export const NOTES = [
  ["What the demo does", "It sends one image to a GPU backend running the three frozen experts and the trained DFFN module. You get each expert’s output, the plain average, the DFFN output and the per-pixel trust map. If you also add the sharp version of the same image, PSNR and SSIM are computed for every output."],
  ["Reported numbers", "The tables on this page are measured on the whole GoPro test set, not on the image you upload."],
];

export const BIBTEX = `@techreport{dffn2026,
  title       = {Deep Feature Fusion Network for Image Deblurring},
  author      = {Gupta, Shreya and Tejan, Shreya and Ahsan, Naurah and Pandey, Bhoomi},
  institution = {Indira Gandhi Delhi Technical University for Women},
  type        = {B.Tech project report},
  year        = {2026},
  month       = nov,
  note        = {Supervisor: Dr. Ravinder M.}
}`;

export const REFERENCES = [
  ["HINet", "Chen et al., Half Instance Normalization Network for Image Restoration, 2021", "https://github.com/megvii-model/HINet"],
  ["SFNet", "Cui et al., Selective Frequency Network for Image Restoration, ICLR 2023", "https://github.com/c-yn/SFNet"],
  ["AdaIR", "Cui et al., Adaptive All-in-One Image Restoration via Frequency Mining and Modulation, 2025", "https://github.com/c-yn/AdaIR"],
  ["GoPro", "Nah et al., Deep Multi-scale CNN for Dynamic Scene Deblurring, CVPR 2017", null],
];
