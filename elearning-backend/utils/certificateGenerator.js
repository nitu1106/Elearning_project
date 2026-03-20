const PDFDocument = require("pdfkit");
let cloudinary = null;
try {
  if (process.env.CLOUDINARY_CLOUD_NAME)
    cloudinary = require("../config/cloudinary").cloudinary;
} catch (e) {}
const { Readable } = require("stream");

/**
 * Generates a certificate PDF and uploads it to Cloudinary.
 * Returns the secure_url of the uploaded PDF.
 */
const generateCertificatePDF = async ({
  studentName,
  courseName,
  instructorName,
  certificateId,
  issuedAt,
}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 50,
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Upload to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "elearning/certificates",
          resource_type: "raw",
          public_id: `cert_${certificateId}`,
          format: "pdf",
          type: "upload", // ← add this
          access_mode: "public", // ← add this
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        },
      );

      const readable = new Readable();
      readable.push(pdfBuffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });

    // ── Certificate Design ────────────────────────────────────────────────────
    const width = doc.page.width;
    const height = doc.page.height;
    const cx = width / 2;

    // Background
    doc.rect(0, 0, width, height).fill("#F8FAFF");

    // Border
    doc
      .rect(20, 20, width - 40, height - 40)
      .lineWidth(3)
      .stroke("#2563EB");
    doc
      .rect(30, 30, width - 60, height - 60)
      .lineWidth(1)
      .stroke("#93C5FD");

    // Header
    doc
      .fontSize(36)
      .fillColor("#1E3A8A")
      .font("Helvetica-Bold")
      .text("CERTIFICATE OF COMPLETION", 0, 80, { align: "center" });

    doc
      .moveTo(cx - 200, 140)
      .lineTo(cx + 200, 140)
      .lineWidth(2)
      .stroke("#2563EB");

    // Body text
    doc
      .fontSize(16)
      .fillColor("#374151")
      .font("Helvetica")
      .text("This is to certify that", 0, 165, { align: "center" });

    doc
      .fontSize(32)
      .fillColor("#1D4ED8")
      .font("Helvetica-Bold")
      .text(studentName, 0, 200, { align: "center" });

    doc
      .moveTo(cx - 180, 248)
      .lineTo(cx + 180, 248)
      .lineWidth(1)
      .stroke("#93C5FD");

    doc
      .fontSize(16)
      .fillColor("#374151")
      .font("Helvetica")
      .text("has successfully completed the course", 0, 265, {
        align: "center",
      });

    doc
      .fontSize(24)
      .fillColor("#1E3A8A")
      .font("Helvetica-Bold")
      .text(`"${courseName}"`, 0, 300, { align: "center" });

    // Footer info
    const dateStr = new Date(issuedAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc
      .fontSize(12)
      .fillColor("#6B7280")
      .font("Helvetica")
      .text(`Issued on: ${dateStr}`, 60, height - 120)
      .text(`Instructor: ${instructorName}`, 60, height - 100)
      .text(`Certificate ID: ${certificateId}`, 60, height - 80);

    doc.end();
  });
};

module.exports = { generateCertificatePDF };
