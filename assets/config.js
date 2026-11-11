// SAFE Master Studio — configuration
// Edit these values after deploying. See README.md.
window.SAFE_CONFIG = {
  // Web app URL of the Marketing Studio Google Apps Script deployment
  // (Deploy > New deployment > Web app). Leave empty to run in demo mode.
  MARKETING_API_URL: "https://script.google.com/macros/s/AKfycbx4_GsBUjlHImcYkGpJVGwbhlXXe_-qj-Si1LZZKI1A7E98v3xkvUvTYXnPr4sqgM8bRA/exec",

  // Web app URL of the DPDPA Compliance Studio Apps Script deployment (dpdpa/apps-script).
  // Leave empty to run the DPDPA Studio in demo mode.
  DPDPA_API_URL: "https://script.google.com/macros/s/AKfycbwlftxVLUluJBqmnIzL0Cd6JVjXEGtp00DJwnqNbOt9d-TEMA-F2YOkFNaacPXB6Gqi/exec",

  // Links for the studio buttons on the Master Studio home page.
  STUDIOS: {
    policy:    "https://safelegalsolutions.github.io/safe-policy-studio/",
    invoice:   "https://safelegalsolutions.github.io/safe-invoice-studio/",   // confirm this matches the Invoice Studio address
    marketing: "marketing/",
    dpdpa:     "dpdpa/",
    // Public address of the DPDPA Studio, used in portal and verification links
    dpdpaPublic: "https://safelegalsolutions.github.io/safe-master-studio/dpdpa/"
  },

  FIRM: {
    name: "SAFE Legal Solutions",
    tagline: "Your legal department, virtually anywhere",
    website: "https://safelegal.in"
  }
};
