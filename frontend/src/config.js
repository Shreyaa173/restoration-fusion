// Everything editable on the page lives here. Items marked TODO are placeholders.

export const PROJECT_NAME = "Project name TBD"; // TODO: final project name
export const TITLE = "Deep Feature Fusion Network for Image Deblurring and Deraining";

export const AUTHORS = [
  { name: "Author One", url: null },   // TODO: real names and profile links
  { name: "Author Two", url: null },
  { name: "Author Three", url: null },
];
export const AFFILIATION = "Your department, Your institution"; // TODO

// url: null renders a disabled "Soon" button
export const LINKS = [
  { label: "Paper", url: null },
  { label: "Code", url: null },
  { label: "Live demo", url: "#demo" },
];

export const MODELS = [
  { id: "hinet", name: "HINet", kind: "Spatial CNN" },
  { id: "sfnet", name: "SFNet", kind: "Frequency CNN" },
  { id: "adair", name: "AdaIR", kind: "Transformer" },
  { id: "fusion", name: "Fusion (ours)", kind: "Pixel-wise attention fusion", ours: true },
];

export const TASKS = [
  { id: "deblur", label: "Deblurring", dataset: "GoPro", hint: "motion-blurred photo" },
  { id: "derain", label: "Deraining", dataset: "Rain100L", hint: "photo with rain streaks" },
];

export const DEFAULT_API = import.meta.env.VITE_API_URL || "";

export const ABSTRACT =
  "Restoration networks built on different ideas fail in different places. One may recover edges well, another may handle repeating rain streaks, a third may keep global context. Instead of training yet another restorer, we freeze three pretrained models of different types (HINet, SFNet and AdaIR) and take both their restored images and their deep features. A small fusion module, the only part we train, aligns those features, learns which features matter and which model to trust at every pixel, blends the three images with those pixel weights and adds a correction for what all three missed. We train one fusion model for GoPro deblurring and one for Rain100L deraining, and compare each against the three experts alone and a simple average, using PSNR and SSIM.";

export const KEY_POINTS = [
  {
    title: "Experts of three different kinds",
    body: "The fusion design follows CMFNet (ICIP 2023), but its branches are not trained from scratch. We plug in a spatial CNN, a frequency-domain CNN and a Transformer, all pretrained and frozen, so each brings a different way of looking at the same image.",
  },
  {
    title: "Trust decided pixel by pixel",
    body: "A single fixed weight per image cannot say that one model is better on edges while another is better on rain streaks. Our module predicts a weight for every model at every pixel, so the blend can change across the image.",
  },
];

export const METHOD_STEPS = [
  ["Experts", "The degraded image goes through HINet, SFNet and AdaIR. Each returns a restored image and the deep features it learned: edges, textures, where the blur or rain is."],
  ["Align", "Features of different sizes are converted to one common size so they can be combined."],
  ["Attention fusion", "The module learns which features are most useful and which model to trust at each pixel."],
  ["Image mix", "Pixel weights blend the three restored images into one."],
  ["Refine", "The combined features produce a small correction. Final output = blended image + correction."],
];

export const TRAINING = "Only the fusion module learns: it sees a degraded image with its real clean version, measures the error between its output and the clean one, and improves. The three experts stay frozen. One fusion model is trained for deblurring (GoPro) and one for deraining (Rain100L); each powers one mode of the demo.";

export const NOTES = [
  {
    title: "Two tasks, two fusion models",
    body: "Deblurring and deraining use separate fusion weights. The three experts are shared in design but load task-specific checkpoints where the authors provide them (HINet has one for GoPro and one for Rain13k; AdaIR is a single all-in-one model).",
  },
  {
    title: "What the demo shows",
    body: "The demo sends one image to a GPU backend and returns the restored output of each expert and of the fusion module. If you also supply the clean ground-truth image, PSNR and SSIM are computed for every output on that image. Large images are downscaled so the three models fit in memory.",
  },
  {
    title: "Current status",
    body: "The fusion design is not final and its weights may not be trained yet. While they are not, the fusion card shows a placeholder that equals a plain average of the available models, and the page says so. Test-set averages appear in the table once they are measured.",
  },
];

export const BIBTEX = `@misc{TODO_citation_key,
  title  = {Deep Feature Fusion Network for Image Deblurring and Deraining},
  author = {Author One and Author Two and Author Three},
  year   = {2026},
  note   = {TODO: venue or arXiv id}
}`;

export const REFERENCES = [
  ["HINet", "Half Instance Normalization Network for Image Restoration", "https://github.com/megvii-model/HINet"],
  ["SFNet", "Selective Frequency Network for Image Restoration, ICLR 2023", "https://github.com/c-yn/SFNet"],
  ["AdaIR", "Adaptive All-in-One Image Restoration via Frequency Mining and Modulation, ICLR 2025", "https://github.com/c-yn/AdaIR"],
  ["CMFNet", "Compound Multi-branch Feature Fusion for Real Image Restoration, ICIP 2023", null],
];
