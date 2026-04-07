const { uploadFile, getSignedUrl, deleteFile, buildObjectPath, validateMagicBytes } = require('./gcpStorage');
const { generateDocumentPDF } = require('./generateDocument');
const { generateDocumentDocx } = require('./generateDocumentDocx');
const crypto = require('crypto');

/**
 * Generate a PDF document and upload to GCP Cloud Storage
 * Returns object with gcsPath, fileName, fileSize, and signedUrl
 */
async function generateAndUploadPDF(document, orgSlug, employeeId, employeeName) {
  try {
    const pdfBuffer = await generateDocumentPDF(document);

    // Validate PDF magic bytes
    if (!validateMagicBytes(pdfBuffer, 'application/pdf')) {
      throw new Error('Generated PDF failed magic bytes validation');
    }

    const safeType = document.type.replace(/_/g, '-');
    const fileName = `${safeType}_${Date.now()}.pdf`;
    const gcsPath = `${orgSlug}/generated/${employeeId}_${employeeName}/${document._id}/${fileName}`;

    // Upload to GCS
    await uploadFile(gcsPath, pdfBuffer, 'application/pdf');

    // Get signed URL
    const signedUrl = await getSignedUrl(gcsPath);

    return {
      gcsPath,
      fileName,
      fileSize: pdfBuffer.length,
      signedUrl,
    };
  } catch (error) {
    console.error('Failed to generate and upload PDF:', error);
    throw error;
  }
}

/**
 * Generate a DOCX document and upload to GCP Cloud Storage
 * Returns object with gcsPath, fileName, fileSize, and signedUrl
 */
async function generateAndUploadDocx(document, orgSlug, employeeId, employeeName) {
  try {
    const docxBuffer = await generateDocumentDocx(document);

    const safeType = document.type.replace(/_/g, '-');
    const fileName = `${safeType}_${Date.now()}.docx`;
    const gcsPath = `${orgSlug}/generated/${employeeId}_${employeeName}/${document._id}/${fileName}`;

    // Upload to GCS
    await uploadFile(gcsPath, docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Get signed URL
    const signedUrl = await getSignedUrl(gcsPath);

    return {
      gcsPath,
      fileName,
      fileSize: docxBuffer.length,
      signedUrl,
    };
  } catch (error) {
    console.error('Failed to generate and upload DOCX:', error);
    throw error;
  }
}

/**
 * Clean up old generated documents from GCS when updating or deleting
 */
async function cleanupOldDocuments(document) {
  const cleanupPromises = [];

  if (document.pdfFile?.gcsPath) {
    cleanupPromises.push(
      deleteFile(document.pdfFile.gcsPath).catch(err => {
        console.error('Failed to delete old PDF from GCS:', err);
      })
    );
  }

  if (document.docxFile?.gcsPath) {
    cleanupPromises.push(
      deleteFile(document.docxFile.gcsPath).catch(err => {
        console.error('Failed to delete old DOCX from GCS:', err);
      })
    );
  }

  if (!cleanupPromises.length) return;
  await Promise.all(cleanupPromises);
}

module.exports = {
  generateAndUploadPDF,
  generateAndUploadDocx,
  cleanupOldDocuments,
};
