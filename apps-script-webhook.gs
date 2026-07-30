/**
 * EMROD SARL — Google Apps Script Webhook
 *
 * Ce script reçoit les données du site (leads et bons de commande)
 * et les sauvegarde directement dans Google Drive.
 *
 * ─────────────────────────────────────────
 *  INSTRUCTIONS DE DÉPLOIEMENT
 * ─────────────────────────────────────────
 * 1. Ouvrez https://script.google.com
 * 2. Créez un nouveau projet et nommez-le "EMROD - Webhook"
 * 3. Copiez-collez le contenu de ce fichier dans l'éditeur
 * 4. Cliquez sur "Déployer" > "Nouveau déploiement"
 * 5. Type : "Application Web"
 * 6. Exécuter en tant que : "Moi" (votre compte Google)
 * 7. Qui a accès : "Tout le monde" (Anyone)
 * 8. Cliquez "Déployer" et autorisez les permissions
 * 9. Copiez l'URL du déploiement (ex: https://script.google.com/macros/s/XXX/exec)
 * 10. Collez-la dans votre fichier .env : APPS_SCRIPT_WEBHOOK_URL="<url copiée>"
 * 11. Redémarrez le serveur (npm run dev)
 * ─────────────────────────────────────────
 */

// ── IDs des dossiers Google Drive ────────────────────────────────────────────
var PROSPECTS_FOLDER_ID = "1bOVDe5nRZStmn0AFD041m6MKoejAppEy";
var BONS_COMMANDE_FOLDER_ID = "1-FPIxzxKVLcutOct5dcDv5gZ8mRFrEjM";

// ── Point d'entrée principal ──────────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === "lead") {
      saveLead(data);
    } else if (data.type === "order") {
      saveOrder(data);
    } else {
      throw new Error("Type inconnu : " + data.type);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("Erreur webhook : " + err.toString());
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Sauvegarde d'un lead (prospect) ──────────────────────────────────────────
function saveLead(data) {
  var folder = DriveApp.getFolderById(PROSPECTS_FOLDER_ID);
  var date = new Date();
  var dateStr = Utilities.formatDate(date, "Africa/Conakry", "dd/MM/yyyy HH:mm:ss");
  var safeName = (data.firstName || "inconnu").replace(/[^a-zA-Z0-9]/g, "_");
  var fileName = "Lead_" + safeName + "_" + date.getTime() + ".txt";

  var content = [
    "PROSPECT — EMROD SARL",
    "═══════════════════════════════",
    "Date       : " + dateStr,
    "Source     : " + (data.source || "popup"),
    "───────────────────────────────",
    "Nom        : " + (data.firstName || "") + " " + (data.lastName || ""),
    "Téléphone  : " + (data.phone || ""),
    "Service    : " + (data.serviceType || ""),
    "Message    : " + (data.message || ""),
    "═══════════════════════════════",
  ].join("\n");

  folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
  Logger.log("Lead sauvegardé : " + fileName);
}

// ── Sauvegarde d'un bon de commande ──────────────────────────────────────────
function saveOrder(data) {
  var folder = DriveApp.getFolderById(BONS_COMMANDE_FOLDER_ID);
  var date = new Date();
  var dateStr = Utilities.formatDate(date, "Africa/Conakry", "dd/MM/yyyy HH:mm:ss");
  var ref = "BC-" + date.getTime();
  var safeName = ((data.nom || "") + "_" + (data.prenom || "")).replace(/[^a-zA-Z0-9]/g, "_");
  var fileName = "BonCommande_" + safeName + "_" + date.getTime() + ".txt";

  var content = [
    "╔═══════════════════════════════════════╗",
    "║       BON DE COMMANDE — EMROD SARL    ║",
    "╚═══════════════════════════════════════╝",
    "",
    "Référence  : " + ref,
    "Date       : " + dateStr,
    "Statut     : EN ATTENTE DE CONFIRMATION",
    "",
    "─── PRODUIT ────────────────────────────",
    "Nom        : " + (data.produit || ""),
    "Prix total : " + (data.prix || ""),
    "Acompte    : " + (data.acompte || "") + "  (60% à régler à la commande)",
    "",
    "─── CLIENT ─────────────────────────────",
    "Nom        : " + (data.nom || ""),
    "Prénom     : " + (data.prenom || ""),
    "Téléphone  : " + (data.telephone || ""),
    "Adresse    : " + (data.adresse || ""),
    "",
    "════════════════════════════════════════",
    "Document généré automatiquement par le site EMROD SARL",
  ].join("\n");

  folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
  Logger.log("Bon de commande sauvegardé : " + fileName);
}

// ── Test manuel (à lancer depuis l'éditeur pour vérifier) ────────────────────
function testWebhook() {
  var testLead = {
    type: "lead",
    firstName: "Test",
    lastName: "Client",
    phone: "+224 600 000 000",
    serviceType: "creation",
    message: "Test depuis Apps Script",
    source: "test",
    date: new Date().toISOString(),
  };
  saveLead(testLead);

  var testOrder = {
    type: "order",
    nom: "Dupont",
    prenom: "Jean",
    telephone: "+224 600 000 001",
    adresse: "Quartier Madina, Conakry",
    produit: "Table Basse Milano (TEST)",
    prix: "450 000 GNF",
    prixNumeric: 450000,
    acompte: "270 000 GNF",
    acompteNumeric: 270000,
    date: new Date().toISOString(),
  };
  saveOrder(testOrder);

  Logger.log("✅ Tests terminés — vérifiez les dossiers Drive.");
}
