export async function fetchManifest(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch manifest ${res.status}`);
  return res.json();
}
