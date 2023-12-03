// downloadBook.ts
export const downloadBook = async (url: string | undefined, name: string) => {
  if (!url) {
    console.error('URL is undefined');
    return;
  }
  const fileType = url.split('.').pop();
  const response = await fetch(url);
  const data = await response.blob();
  const blobUrl = window.URL.createObjectURL(data);

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `${name}.${fileType}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
