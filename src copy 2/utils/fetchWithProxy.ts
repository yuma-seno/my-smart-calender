export const fetchWithProxy = async (url: string): Promise<string> => {
  const targetUrl = url.includes("?")
    ? `${url}&t=${Date.now()}`
    : `${url}?t=${Date.now()}`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
    const text = await response.text();
    if (!text) throw new Error("No content received");
    return text;
  } catch (e) {
    console.error("Proxy Fetch Failed:", e);
    throw e;
  }
};
