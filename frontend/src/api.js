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

async function call(url, init) {
  try {
    return await parse(await fetch(url, init));
  } catch (e) {
    if (e.name === "AbortError") throw e;
    if (e instanceof TypeError) {
      // fetch() only throws TypeError for network, CORS and tunnel failures.
      throw new Error("The backend did not answer. The Colab session may have stopped, or the tunnel closed the request (quick tunnels cut requests after about 100 s). Restart the tunnel cell and paste the new URL.");
    }
    throw e;
  }
}

export const getHealth = (base, signal) => call(`${clean(base)}/health`, { headers: HEADERS, signal });

export function restore(base, { image, gt }, signal) {
  const form = new FormData();
  form.append("image", image);
  form.append("task", "deblur");
  if (gt) form.append("gt", gt);
  return call(`${clean(base)}/restore`, { method: "POST", body: form, headers: HEADERS, signal });
}
