import axios from 'axios';

export interface CloudinaryAsset {
  secure_url: string;
  bytes: number;
}

interface CloudinaryResponse {
  secure_url?: unknown;
  bytes?: unknown;
}

function isCloudinaryAsset(value: unknown): value is CloudinaryAsset {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.secure_url === 'string' &&
    typeof candidate.bytes === 'number' &&
    Number.isFinite(candidate.bytes) &&
    candidate.bytes >= 0
  );
}

export function uploadToCloudinary(
  file: File,
  signal: AbortSignal,
  onProgress: (percent: number) => void
): Promise<CloudinaryAsset> {
  const url = import.meta.env.VITE_CLOUDINARY_URL as string;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'unsigned_upload');

  const onUploadProgress = (event: { loaded: number; total?: number }) => {
    if (event.total === undefined || event.total <= 0) return;
    const percent = Math.round((event.loaded / event.total) * 100);
    onProgress(Math.min(100, Math.max(0, percent)));
  };

  return axios
    .post<CloudinaryResponse>(url, formData, { signal, onUploadProgress })
    .then((response) => {
      if (!isCloudinaryAsset(response.data)) {
        throw new Error('Unexpected upload response');
      }
      return response.data;
    })
    .catch((error: unknown) => {
      if (axios.isCancel(error)) {
        throw new DOMException('Upload aborted', 'AbortError');
      }
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Upload failed (${error.response.status})`);
      }
      throw new Error('Network error during upload');
    });
}
