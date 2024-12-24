export async function uploadImage(imageFile) {
  if (!imageFile) return null;

  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Gagal mengupload gambar');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Gagal mengupload gambar');
  }
} 