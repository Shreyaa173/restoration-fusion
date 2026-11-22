const clean = (base) => base.trim().replace(/\/+$/, "");
// Harmless for Cloudflare tunnels, and lets ngrok skip its interstitial page.
const HEADERS = { "ngrok-skip-browser-warning": "1" };

async function parse(res) {
  if (res.ok) return res.json();
  let detail = `${res.status} ${res.statusText}`;
  try {
    const j = await res.json();
    if (j.detail) detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
  } catch {}
  throw new Error(detail);
}

export async function getHealth(base, signal) {
  return parse(await fetch(`${clean(base)}/health`, { headers: HEADERS, signal }));
}

export async function getBenchmarks(base, signal) {
  return parse(await fetch(`${clean(base)}/benchmarks`, { headers: HEADERS, signal }));
}

export async function restore(base, { image, gt, task }, signal) {
  const form = new FormData();
  form.append("image", image);
  form.append("task", task);
  if (gt) form.append("gt", gt);
  return parse(await fetch(`${clean(base)}/restore`, { method: "POST", body: form, headers: HEADERS, signal }));
}
