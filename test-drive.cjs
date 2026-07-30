const { google } = require("googleapis");
const fs = require("fs");
require("dotenv").config();

const DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY || "AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM";
const drive = google.drive({ version: "v3", auth: DRIVE_API_KEY });
const GALLERY_FOLDER_ID = process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || "14FAzo-gy1WKjCxEFcXEWhVzhfvPqYx2X";

async function run() {
  try {
    const response = await drive.files.list({
      q: `'${GALLERY_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "files(id, name, mimeType)",
      orderBy: "name",
    });
    const files = response.data.files || [];
    if (files.length === 0) {
      console.log("No files found");
      return;
    }
    const fileId = files[0].id;
    console.log("File ID:", fileId);

    // Test API download
    const res = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );
    console.log("API download success, status:", res.status);
  } catch (error) {
    console.error("API error:", error.message || error);
  }

  try {
    // Test thumbnail download
    const fileId = "1S0o2OaE-A-h2e44q_O_9Ld-Zofl_bBnt"; // example, wait I need real one
  } catch (e) {}
}

run();
