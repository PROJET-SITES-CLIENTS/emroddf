const { google } = require("googleapis");
require("dotenv").config();
const DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY || "AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM";
const drive = google.drive({ version: "v3", auth: DRIVE_API_KEY });
async function run() {
  try {
    const fileId = "1J2fbOXNkJnMXhnd79VwHk-VKBUp7uSm9";
    const res = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );
    console.log("status:", res.status);
    console.log("content-type:", res.headers["content-type"]);
  } catch (error) {
    console.error("error:", error.message);
  }
}
run();
