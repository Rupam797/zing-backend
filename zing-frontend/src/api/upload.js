import api from './axios';

/**
 * Upload an image file and return the URL.
 * @param {File} file
 * @returns {Promise<string>} the URL of the uploaded image
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url; // e.g. "/uploads/abc123.jpg"
}

/**
 * Get the full URL for a stored image path.
 * @param {string|null} url
 * @returns {string|null}
 */
export function imageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return url; // proxied via vite config
}
