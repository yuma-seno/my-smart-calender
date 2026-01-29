export const fetchWithProxy = async (
  url: string,
  withoutProxy = false,
): Promise<string> => {
  let targetUrl = url.includes("?")
    ? `${url}&t=${Date.now()}`
    : `${url}?t=${Date.now()}`;
  if (!withoutProxy)
    targetUrl = `https://my-smart-calender.seno-yu-0816-2003.workers.dev?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
    const text = await response.text();
    if (!text) throw new Error("No content received");
    return text;
  } catch (e) {
    console.error("Proxy Fetch Failed:", e);
    throw e;
  }
};
