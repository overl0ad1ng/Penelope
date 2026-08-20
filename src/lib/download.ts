/** 触发浏览器下载给定的字节数据。 */
export function downloadBytes(
  bytes: Uint8Array<ArrayBuffer>,
  filename: string,
  mimeType = "application/octet-stream",
): void {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
