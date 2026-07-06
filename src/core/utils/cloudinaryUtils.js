const CLOUD_NAME = 'dlnkis1lj'
const UPLOAD_PRESET = 'sigei_pdfs'

export async function uploadPdfToCloudinary(pdfBlob, fileName) {
  const formData = new FormData()
  formData.append('file', pdfBlob, fileName + '.pdf')
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('resource_type', 'raw')
  formData.append('folder', 'sigei/boletas')
  formData.append('public_id', fileName)

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/raw/upload',
    { method: 'POST', body: formData }
  )
  if (!response.ok) throw new Error('Error al subir PDF a Cloudinary')
  const data = await response.json()
  return data.secure_url
}