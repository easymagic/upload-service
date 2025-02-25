// app.js
const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();

// Configure multer to store uploads in the 'uploads' directory
const upload = multer({ dest: 'uploads/' });

// Ensure the processed directory exists
const processedDir = path.join(__dirname, 'processed');
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir);
}

/**
 * POST /upload
 *
 * Accepts a single file upload via a field named 'file'.
 * For video files (.mp4, .mov, .avi) it:
 *   - Takes a screenshot (thumbnail) at 5 seconds.
 *   - Creates a 5-second video clip.
 *   - Keeps the full video file.
 * For image files (.jpg, .jpeg, .png) it:
 *   - Creates a thumbnail image.
 *   - Keeps the full image.
 *
 * The file details (paths) are collected in a "record" object.
 */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    // Get the file extension in lowercase
    const ext = path.extname(file.originalname).toLowerCase();

    // Define a record object to simulate saving file paths to a database
    let record = {
      video_thumbnail: null,
      image_thumbnail: null,
      video_clip: null,
      full_video_file: null,
      full_image_file: null
    };

    // Process Video Files
    if (['.mp4', '.mov', '.avi'].includes(ext)) {
      const videoFilePath = file.path; // The full video file as stored by multer
      const baseName = file.filename; // unique filename generated by multer

      // Set output paths for processed files
      const videoThumbnailPath = path.join(processedDir, `${baseName}_thumbnail.png`);
      const videoClipPath = path.join(processedDir, `${baseName}_clip.mp4`);

      // 1. Create a screenshot as a thumbnail from the video at the 5-second mark
      await new Promise((resolve, reject) => {
        ffmpeg(videoFilePath)
          .screenshots({
            timestamps: ['5'], // takes a screenshot at 5 seconds
            filename: path.basename(videoThumbnailPath),
            folder: processedDir
          })
          .on('end', () => {
            console.log('Screenshot taken.');
            resolve();
          })
          .on('error', (err) => {
            console.error('Error taking screenshot: ', err);
            reject(err);
          });
      });

      // 2. Create a 5-second clip from the video (starting at 0 seconds)
      await new Promise((resolve, reject) => {
        ffmpeg(videoFilePath)
          .setStartTime(0)
          .setDuration(5)
          .output(videoClipPath)
          .on('end', () => {
            console.log('5-second clip created.');
            resolve();
          })
          .on('error', (err) => {
            console.error('Error creating clip: ', err);
            reject(err);
          })
          .run();
      });

      // Build the record for a video file
      record.video_thumbnail = videoThumbnailPath;
      record.video_clip = videoClipPath;
      record.full_video_file = videoFilePath;
    }
    // Process Image Files
    else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const imageFilePath = file.path; // The full image file as stored by multer
      const baseName = file.filename;
      const imageThumbnailPath = path.join(processedDir, `${baseName}_thumbnail.png`);

      // Use sharp to create a thumbnail image (resize width to 200px while maintaining aspect ratio)
      await sharp(imageFilePath)
        .resize({ width: 200 })
        .toFile(imageThumbnailPath);

      // Build the record for an image file
      record.image_thumbnail = imageThumbnailPath;
      record.full_image_file = imageFilePath;
    } else {
      return res.status(400).send('Unsupported file type');
    }

    // In a real application, here you would save "record" to your database.
    console.log('Saved record: ', record);

    res.status(200).json({ message: 'Upload processed successfully', record });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).send('An error occurred while processing your file.');
  }
});

/**
 * GET /download
 *
 * A simple download endpoint that expects a query parameter "path" indicating the file path.
 * Example: /download?path=processed/abcd1234_thumbnail.png
 *
 * Note: In a production system, you would not expose direct file system paths
 * and would instead use a secure file retrieval method (by ID, token, etc.).
 */
app.get('/download', (req, res) => {
  const filePath = req.query.path;
  if (filePath && fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).send('File not found');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
