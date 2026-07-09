/* =================================================================
 * CARTE CRÉMIERS-FROMAGERS FFF — Logique applicative
 * Données : Google Sheets public (CSV), récupéré au chargement.
 * Aucune donnée métier en dur (la table géo n'est que de la référence).
 * ================================================================= */

const CONFIG = window.CONFIG;
const C = CONFIG.COLS;

/* État global de l'application */
const APP = {
  shops: [],          // établissements géolocalisés
  unlocated: [],      // établissements sans coordonnées
  map: null,
  cluster: null,
  userMarker: null,
  filtered: [],       // résultat courant des filtres (pour l'export)
};

/* État des filtres */
const FILTRES = {
  region: "",
  departement: "",
  arrondissement: "",
  recherche: "",
  adherentsOnly: false,
  grossistesOnly: false,
  /* Segmentation grossistes : une valeur choisie par catégorie ("" = toutes) */
  seg: {
    gammes: "",
    regionsVente: "",
    typesFournisseurs: "",
    typesClients: "",
    typesTransport: "",
    typeGrossiste: "",
  },
};


/* =================================================================
 * GÉO — Table de référence Départements -> Régions
 * (donnée géographique de référence, pas de la donnée métier)
 * ================================================================= */
const DEPARTEMENTS = {
  "01": { nom: "Ain", region: "Auvergne-Rhône-Alpes" },
  "02": { nom: "Aisne", region: "Hauts-de-France" },
  "03": { nom: "Allier", region: "Auvergne-Rhône-Alpes" },
  "04": { nom: "Alpes-de-Haute-Provence", region: "Provence-Alpes-Côte d'Azur" },
  "05": { nom: "Hautes-Alpes", region: "Provence-Alpes-Côte d'Azur" },
  "06": { nom: "Alpes-Maritimes", region: "Provence-Alpes-Côte d'Azur" },
  "07": { nom: "Ardèche", region: "Auvergne-Rhône-Alpes" },
  "08": { nom: "Ardennes", region: "Grand Est" },
  "09": { nom: "Ariège", region: "Occitanie" },
  "10": { nom: "Aube", region: "Grand Est" },
  "11": { nom: "Aude", region: "Occitanie" },
  "12": { nom: "Aveyron", region: "Occitanie" },
  "13": { nom: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
  "14": { nom: "Calvados", region: "Normandie" },
  "15": { nom: "Cantal", region: "Auvergne-Rhône-Alpes" },
  "16": { nom: "Charente", region: "Nouvelle-Aquitaine" },
  "17": { nom: "Charente-Maritime", region: "Nouvelle-Aquitaine" },
  "18": { nom: "Cher", region: "Centre-Val de Loire" },
  "19": { nom: "Corrèze", region: "Nouvelle-Aquitaine" },
  "2A": { nom: "Corse-du-Sud", region: "Corse" },
  "2B": { nom: "Haute-Corse", region: "Corse" },
  "21": { nom: "Côte-d'Or", region: "Bourgogne-Franche-Comté" },
  "22": { nom: "Côtes-d'Armor", region: "Bretagne" },
  "23": { nom: "Creuse", region: "Nouvelle-Aquitaine" },
  "24": { nom: "Dordogne", region: "Nouvelle-Aquitaine" },
  "25": { nom: "Doubs", region: "Bourgogne-Franche-Comté" },
  "26": { nom: "Drôme", region: "Auvergne-Rhône-Alpes" },
  "27": { nom: "Eure", region: "Normandie" },
  "28": { nom: "Eure-et-Loir", region: "Centre-Val de Loire" },
  "29": { nom: "Finistère", region: "Bretagne" },
  "30": { nom: "Gard", region: "Occitanie" },
  "31": { nom: "Haute-Garonne", region: "Occitanie" },
  "32": { nom: "Gers", region: "Occitanie" },
  "33": { nom: "Gironde", region: "Nouvelle-Aquitaine" },
  "34": { nom: "Hérault", region: "Occitanie" },
  "35": { nom: "Ille-et-Vilaine", region: "Bretagne" },
  "36": { nom: "Indre", region: "Centre-Val de Loire" },
  "37": { nom: "Indre-et-Loire", region: "Centre-Val de Loire" },
  "38": { nom: "Isère", region: "Auvergne-Rhône-Alpes" },
  "39": { nom: "Jura", region: "Bourgogne-Franche-Comté" },
  "40": { nom: "Landes", region: "Nouvelle-Aquitaine" },
  "41": { nom: "Loir-et-Cher", region: "Centre-Val de Loire" },
  "42": { nom: "Loire", region: "Auvergne-Rhône-Alpes" },
  "43": { nom: "Haute-Loire", region: "Auvergne-Rhône-Alpes" },
  "44": { nom: "Loire-Atlantique", region: "Pays de la Loire" },
  "45": { nom: "Loiret", region: "Centre-Val de Loire" },
  "46": { nom: "Lot", region: "Occitanie" },
  "47": { nom: "Lot-et-Garonne", region: "Nouvelle-Aquitaine" },
  "48": { nom: "Lozère", region: "Occitanie" },
  "49": { nom: "Maine-et-Loire", region: "Pays de la Loire" },
  "50": { nom: "Manche", region: "Normandie" },
  "51": { nom: "Marne", region: "Grand Est" },
  "52": { nom: "Haute-Marne", region: "Grand Est" },
  "53": { nom: "Mayenne", region: "Pays de la Loire" },
  "54": { nom: "Meurthe-et-Moselle", region: "Grand Est" },
  "55": { nom: "Meuse", region: "Grand Est" },
  "56": { nom: "Morbihan", region: "Bretagne" },
  "57": { nom: "Moselle", region: "Grand Est" },
  "58": { nom: "Nièvre", region: "Bourgogne-Franche-Comté" },
  "59": { nom: "Nord", region: "Hauts-de-France" },
  "60": { nom: "Oise", region: "Hauts-de-France" },
  "61": { nom: "Orne", region: "Normandie" },
  "62": { nom: "Pas-de-Calais", region: "Hauts-de-France" },
  "63": { nom: "Puy-de-Dôme", region: "Auvergne-Rhône-Alpes" },
  "64": { nom: "Pyrénées-Atlantiques", region: "Nouvelle-Aquitaine" },
  "65": { nom: "Hautes-Pyrénées", region: "Occitanie" },
  "66": { nom: "Pyrénées-Orientales", region: "Occitanie" },
  "67": { nom: "Bas-Rhin", region: "Grand Est" },
  "68": { nom: "Haut-Rhin", region: "Grand Est" },
  "69": { nom: "Rhône", region: "Auvergne-Rhône-Alpes" },
  "70": { nom: "Haute-Saône", region: "Bourgogne-Franche-Comté" },
  "71": { nom: "Saône-et-Loire", region: "Bourgogne-Franche-Comté" },
  "72": { nom: "Sarthe", region: "Pays de la Loire" },
  "73": { nom: "Savoie", region: "Auvergne-Rhône-Alpes" },
  "74": { nom: "Haute-Savoie", region: "Auvergne-Rhône-Alpes" },
  "75": { nom: "Paris", region: "Île-de-France" },
  "76": { nom: "Seine-Maritime", region: "Normandie" },
  "77": { nom: "Seine-et-Marne", region: "Île-de-France" },
  "78": { nom: "Yvelines", region: "Île-de-France" },
  "79": { nom: "Deux-Sèvres", region: "Nouvelle-Aquitaine" },
  "80": { nom: "Somme", region: "Hauts-de-France" },
  "81": { nom: "Tarn", region: "Occitanie" },
  "82": { nom: "Tarn-et-Garonne", region: "Occitanie" },
  "83": { nom: "Var", region: "Provence-Alpes-Côte d'Azur" },
  "84": { nom: "Vaucluse", region: "Provence-Alpes-Côte d'Azur" },
  "85": { nom: "Vendée", region: "Pays de la Loire" },
  "86": { nom: "Vienne", region: "Nouvelle-Aquitaine" },
  "87": { nom: "Haute-Vienne", region: "Nouvelle-Aquitaine" },
  "88": { nom: "Vosges", region: "Grand Est" },
  "89": { nom: "Yonne", region: "Bourgogne-Franche-Comté" },
  "90": { nom: "Territoire de Belfort", region: "Bourgogne-Franche-Comté" },
  "91": { nom: "Essonne", region: "Île-de-France" },
  "92": { nom: "Hauts-de-Seine", region: "Île-de-France" },
  "93": { nom: "Seine-Saint-Denis", region: "Île-de-France" },
  "94": { nom: "Val-de-Marne", region: "Île-de-France" },
  "95": { nom: "Val-d'Oise", region: "Île-de-France" },
  "971": { nom: "Guadeloupe", region: "Guadeloupe" },
  "972": { nom: "Martinique", region: "Martinique" },
  "973": { nom: "Guyane", region: "Guyane" },
  "974": { nom: "La Réunion", region: "La Réunion" },
  "976": { nom: "Mayotte", region: "Mayotte" },
};

/* Normalise un code postal : rajoute le zéro initial perdu (ex. "1700" -> "01700") */
function normaliserCP(cp) {
  const c = (cp || "").trim();
  return c.length === 4 ? "0" + c : c;   // CP français = 5 chiffres
}

/* Déduit le code département à partir d'un code postal */
function deptDepuisCP(cp) {
  if (!cp || cp.length < 2) return "";
  // DOM/TOM : 3 premiers chiffres
  if (cp.startsWith("97") || cp.startsWith("98")) return cp.slice(0, 3);
  // Corse : 20xxx -> 2A (Corse-du-Sud) ou 2B (Haute-Corse)
  if (cp.startsWith("20")) return parseInt(cp, 10) < 20200 ? "2A" : "2B";
  return cp.slice(0, 2);
}

/* Déduit le numéro d'arrondissement parisien (1..20) depuis le CP, sinon "" */
function arrondissementDepuisCP(cp) {
  if (!cp || !cp.startsWith("75")) return "";
  let n = parseInt(cp.slice(2), 10);   // 75001 -> 1, 75116 -> 116
  if (isNaN(n)) return "";
  if (n > 100) n -= 100;               // 116 -> 16 (cas du 75116)
  if (n < 1 || n > 20) return "";
  return String(n);
}


/* =================================================================
 * 1. DATA — Récupération + parsing du CSV Google Sheets
 * ================================================================= */

/* Récupère un CSV brut depuis le Google Sheets (une URL par onglet) */
async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.text();
}

/* Parse le CSV en tableau d'objets (PapaParse gère guillemets + virgules internes) */
function parseCSV(texte) {
  const out = Papa.parse(texte, { header: true, skipEmptyLines: true });
  return out.data;
}

/* Convertit une coordonnée FR ("48,371811") en nombre, ou null si invalide */
function parseCoord(valeur) {
  if (valeur === undefined || valeur === null) return null;
  const n = parseFloat(String(valeur).trim().replace(",", "."));
  return isNaN(n) ? null : n;
}

/* Nettoie + structure une ligne brute du CSV en objet établissement.
   estGrossiste : true pour les lignes venant de l'onglet Grossistes. */
function normalizeShop(row, estGrossiste) {
  const get = (col) => (row[col] || "").toString().trim();

  const cp = normaliserCP(get(C.cp));
  const dept = deptDepuisCP(cp);
  const infoDept = DEPARTEMENTS[dept] || { nom: "", region: "" };
  const type = get(C.type);

  return {
    clef:          get(C.clef),
    enseigne:      get(C.enseigne) || "(Sans enseigne)",
    rue:           [get(C.rue), get(C.rue2), get(C.rue3)].filter(Boolean).join(" "),
    cp:            cp,
    commune:       get(C.commune),
    telephone:     get(C.telephone) || get(C.mobile),
    region:        infoDept.region,
    departement:   dept,
    deptNom:       infoDept.nom,
    arrondissement: arrondissementDepuisCP(cp),
    adherent:      get(C.syndicat) === CONFIG.VALEUR_ADHERENT,
    grossiste:     estGrossiste || type === CONFIG.VALEUR_GROSSISTE,
    lat:           parseCoord(row[C.latitude]),
    lng:           parseCoord(row[C.longitude]),
    /* Champs sondage grossistes (vides si colonnes absentes du Sheet) */
    annee:         get(C.annee),
    salaries:      get(C.salaries),
    fournisseurs:  get(C.fournisseurs),
    specialites:   get(C.specialites),
    labels:        get(C.labels),
    /* Segmentation grossistes (listes "val1, val2, ...") */
    gammes:            get(C.gammes),
    regionsVente:      get(C.regionsVente),
    typesFournisseurs: get(C.typesFournisseurs),
    typesClients:      get(C.typesClients),
    typesTransport:    get(C.typesTransport),
    typeGrossiste:     get(C.typeGrossiste),
  };
}

/* Orchestre fetch (2 onglets en parallèle) -> parse -> normalise, puis sépare géo / non-géo */
async function loadShops() {
  const [txtCremiers, txtGrossistes] = await Promise.all([
    fetchCSV(CONFIG.SHEET_CREMIERS_URL),
    fetchCSV(CONFIG.SHEET_GROSSISTES_URL),
  ]);
  const lignes = parseCSV(txtCremiers).map((r) => normalizeShop(r, false))
    .concat(parseCSV(txtGrossistes).map((r) => normalizeShop(r, true)));
  APP.shops     = lignes.filter((s) => s.lat !== null && s.lng !== null);
  APP.unlocated = lignes.filter((s) => s.lat === null || s.lng === null);
}


/* =================================================================
 * 2. FILTERS — Application des filtres + cascade des listes
 * ================================================================= */

/* Renvoie la liste des établissements correspondant aux filtres courants */
function applyFilters() {
  const q = FILTRES.recherche.toLowerCase();
  return APP.shops.filter((s) => {
    if (FILTRES.adherentsOnly && !s.adherent) return false;
    if (FILTRES.grossistesOnly && !s.grossiste) return false;
    /* Segmentation grossistes : chaque filtre actif doit matcher la liste de la boutique */
    for (const [cat, val] of Object.entries(FILTRES.seg)) {
      if (!val) continue;
      if (!s.grossiste) return false;
      if (cat === "typeGrossiste") {
        // "Groupe (X)" est regroupé sous l'option "Groupe"
        const ok = val === "Groupe" ? s.typeGrossiste.startsWith("Groupe") : s.typeGrossiste === val;
        if (!ok) return false;
      } else if (!(s[cat] || "").split(", ").some((v) => v.toLowerCase() === val.toLowerCase())) {
        return false;
      }
    }
    if (FILTRES.region && s.region !== FILTRES.region) return false;
    if (FILTRES.departement && s.departement !== FILTRES.departement) return false;
    if (FILTRES.arrondissement && s.arrondissement !== FILTRES.arrondissement) return false;
    if (q) {
      const cible = (s.enseigne + " " + s.commune).toLowerCase();
      if (!cible.includes(q)) return false;
    }
    return true;
  });
}

/* Trie une liste de valeurs uniques (ordre alphabétique FR) */
function uniqueTriees(valeurs) {
  return [...new Set(valeurs.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
}

/* Remplit un <select> avec une option « tout » + les options fournies */
function remplirSelect(sel, options, labelTout, labelFn) {
  sel.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = ""; opt0.textContent = labelTout;
  sel.appendChild(opt0);
  options.forEach((val) => {
    const o = document.createElement("option");
    o.value = val;
    o.textContent = labelFn ? labelFn(val) : val;
    sel.appendChild(o);
  });
}

/* Peuple le select des régions (une fois, au chargement) */
function peuplerRegions() {
  const regions = uniqueTriees(APP.shops.map((s) => s.region));
  remplirSelect(document.getElementById("filtre-region"), regions, CONFIG.TXT.toutesRegions);
}

/* Peuple le select des départements selon la région choisie (cascade) */
function peuplerDepartements() {
  const sel = document.getElementById("filtre-departement");
  if (!FILTRES.region) {
    remplirSelect(sel, [], CONFIG.TXT.tousDepts);
    sel.disabled = true;
    return;
  }
  const depts = uniqueTriees(
    APP.shops.filter((s) => s.region === FILTRES.region).map((s) => s.departement)
  );
  remplirSelect(sel, depts, CONFIG.TXT.tousDepts, (d) => `${d} — ${DEPARTEMENTS[d]?.nom || ""}`);
  sel.disabled = false;
}

/* Peuple/affiche le select des arrondissements (Paris uniquement) */
function peuplerArrondissements() {
  const champ = document.getElementById("champ-arrondissement");
  const sel = document.getElementById("filtre-arrondissement");
  if (FILTRES.departement !== "75") {
    champ.style.display = "none";
    FILTRES.arrondissement = "";
    return;
  }
  const arrs = [...new Set(
    APP.shops.filter((s) => s.departement === "75" && s.arrondissement).map((s) => s.arrondissement)
  )].sort((a, b) => Number(a) - Number(b));
  remplirSelect(sel, arrs, CONFIG.TXT.tousArr, (a) => `${a}ᵉ arrondissement`);
  champ.style.display = "block";
}

/* Définition des 6 menus de segmentation grossistes : [id select, propriété, libellé "tout"] */
const SEG_DEFS = [
  ["seg-gammes",            "gammes",            () => CONFIG.TXT.segGammes],
  ["seg-regionsVente",      "regionsVente",      () => CONFIG.TXT.segRegions],
  ["seg-typesFournisseurs", "typesFournisseurs", () => CONFIG.TXT.segFournisseurs],
  ["seg-typesClients",      "typesClients",      () => CONFIG.TXT.segClients],
  ["seg-typesTransport",    "typesTransport",    () => CONFIG.TXT.segTransport],
  ["seg-typeGrossiste",     "typeGrossiste",     () => CONFIG.TXT.segTypeGros],
];

/* Peuple les 6 menus de segmentation à partir des valeurs présentes chez les grossistes.
   Les variantes de casse ("charcuterie"/"Charcuterie") sont fusionnées en une seule option. */
function peuplerSegGrossistes() {
  const grossistes = APP.shops.filter((s) => s.grossiste);
  SEG_DEFS.forEach(([id, prop, labelTout]) => {
    const valeurs = new Map(); // clé en minuscules -> libellé affiché
    grossistes.forEach((s) => {
      (s[prop] || "").split(", ").filter(Boolean).forEach((v) => {
        // les "Groupe (X)" sont regroupés sous une seule option "Groupe"
        if (prop === "typeGrossiste" && v.startsWith("Groupe")) v = "Groupe";
        const cle = v.toLowerCase();
        if (!valeurs.has(cle)) valeurs.set(cle, v.charAt(0).toUpperCase() + v.slice(1));
      });
    });
    remplirSelect(document.getElementById(id), uniqueTriees([...valeurs.values()]), labelTout());
  });
}

/* Réinitialise la segmentation (valeurs + menus) */
function resetSegGrossistes() {
  Object.keys(FILTRES.seg).forEach((k) => (FILTRES.seg[k] = ""));
  SEG_DEFS.forEach(([id]) => { const el = document.getElementById(id); if (el) el.value = ""; });
}


/* =================================================================
 * 3. MAP — Carte Leaflet + marqueurs + clustering
 * ================================================================= */

/* Crée la carte + le fond + le cluster */
function initMap() {
  APP.map = L.map("map").setView(CONFIG.CENTRE_CARTE, CONFIG.ZOOM_INITIAL);
  L.tileLayer(CONFIG.FOND_CARTE, { attribution: CONFIG.ATTRIBUTION, maxZoom: 19 }).addTo(APP.map);
  APP.cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
  APP.map.addLayer(APP.cluster);
}

/* Construit une icône colorée (doré/bleu + contour vert si adhérent) */
function makeIcon(shop) {
  const couleur = shop.grossiste ? CONFIG.COULEUR_GROSSISTE : CONFIG.COULEUR_CREMIER;
  const cls = "marqueur" + (shop.grossiste ? " grossiste" : "") + (shop.adherent ? " adherent" : "");
  return L.divIcon({
    className: "",
    html: `<div class="${cls}" style="background:${couleur}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

/* Échappe le HTML d'un texte libre venant du Sheet */
function escHTML(t) {
  return t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* Contenu HTML du popup d'un établissement */
function popupHTML(s) {
  const adresse = [s.rue, `${s.cp} ${s.commune}`].filter(Boolean).join("<br>");
  const adherent = s.adherent
    ? `<span class="popup-adherent">✓ Adhérent FFF</span>`
    : `<span class="lbl">Non adhérent</span>`;
  const tel = s.telephone ? `<div class="popup-ligne"><span class="lbl">Tél. :</span> ${s.telephone}</div>` : "";

  /* Champs sondage grossistes : une ligne par champ, seulement si rempli */
  const ligne = (lbl, val) =>
    val ? `<div class="popup-ligne"><span class="lbl">${lbl} :</span> ${escHTML(val)}</div>` : "";
  const infos =
    ligne("Création", s.annee) +
    ligne("Salariés", s.salaries) +
    ligne("Fournisseurs", s.fournisseurs) +
    ligne("Spécialités", s.specialites) +
    ligne("Labels", s.labels);

  /* Section repliée "+ d'infos" : les 6 catégories de segmentation, si renseignées */
  const plusLignes =
    ligne("Gammes", s.gammes) +
    ligne("Régions de vente", s.regionsVente) +
    ligne("Fournisseurs", s.typesFournisseurs) +
    ligne("Clients", s.typesClients) +
    ligne("Transport", s.typesTransport) +
    ligne("Type", s.typeGrossiste);
  const plus = plusLignes
    ? `<div class="popup-plus" style="display:none">${plusLignes}</div>
       <div class="popup-plus-lien"><a href="#" onclick="
         var d = this.closest('.leaflet-popup-content').querySelector('.popup-plus');
         var ouvert = d.style.display === 'none';
         d.style.display = ouvert ? 'block' : 'none';
         this.textContent = ouvert ? CONFIG.TXT.popupMoins : CONFIG.TXT.popupPlus;
         return false;">${CONFIG.TXT.popupPlus}</a></div>`
    : "";

  return `
    <div class="popup-titre">${s.enseigne}</div>
    <div class="popup-ligne">${adresse}</div>
    <div class="popup-ligne">${adherent}</div>
    ${tel}
    ${infos}
    ${plus}
  `;
}

/* Crée un marqueur Leaflet + popup pour un établissement */
function buildMarker(s) {
  return L.marker([s.lat, s.lng], { icon: makeIcon(s) }).bindPopup(popupHTML(s));
}

/* Vide le cluster et ré-affiche la sélection filtrée */
function renderMarkers(liste) {
  APP.cluster.clearLayers();
  const marqueurs = liste.map(buildMarker);
  APP.cluster.addLayers(marqueurs);
}

/* Géolocalise l'utilisateur et centre la carte dessus */
function locateUser() {
  if (!navigator.geolocation) { alert("Géolocalisation non disponible sur ce navigateur."); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      if (APP.userMarker) APP.map.removeLayer(APP.userMarker);
      APP.userMarker = L.circleMarker(ll, {
        radius: 9, color: "#1565c0", fillColor: "#42a5f5", fillOpacity: 0.9, weight: 2,
      }).addTo(APP.map).bindPopup("Vous êtes ici").openPopup();
      APP.map.setView(ll, CONFIG.ZOOM_GEOLOC);
    },
    () => alert("Impossible de vous géolocaliser.")
  );
}


/* =================================================================
 * 4. UI — Liaison interface <-> logique
 * ================================================================= */

/* Affiche un message d'état (chargement / erreur) ou le masque */
function setStatus(msg, isError) {
  const el = document.getElementById("status");
  el.textContent = msg || "";
  el.style.display = msg ? "block" : "none";
  el.classList.toggle("error", !!isError);
}

/* Met à jour le compteur d'établissements visibles */
function updateCounter(n) {
  document.getElementById("compteur-nb").textContent = n;
}

/* Affiche la liste des établissements non géolocalisés */
function renderUnlocated() {
  const liste = document.getElementById("non-geo-liste");
  if (!APP.unlocated.length) {
    liste.innerHTML = `<div class="item">Aucun établissement non géolocalisé.</div>`;
    return;
  }
  liste.innerHTML = APP.unlocated.map((s) => `
    <div class="item">
      <strong>${s.enseigne}${s.adherent ? ' <span class="badge-warn">FFF</span>' : ""}</strong>
      <span>${[s.rue, s.cp, s.commune].filter(Boolean).join(" · ") || "Adresse incomplète"} <span class="badge-warn">⚠ non géolocalisé</span></span>
    </div>
  `).join("");
}

/* Recalcule la sélection, met à jour carte + compteur (appelé à chaque changement) */
function refresh() {
  APP.filtered = applyFilters();
  renderMarkers(APP.filtered);
  updateCounter(APP.filtered.length);
}

/* Injecte tous les libellés depuis CONFIG.TXT */
function injecterTextes() {
  const T = CONFIG.TXT;
  document.getElementById("titre").textContent = T.titre;
  document.getElementById("sous-titre").textContent = T.sousTitre;
  document.getElementById("recherche").placeholder = T.recherchePh;
  document.getElementById("lbl-adherents").textContent = T.adherentsOnly;
  document.getElementById("lbl-grossistes").textContent = T.grossistesOnly;
  document.getElementById("seg-titre").textContent = T.segTitre;
  document.getElementById("lbl-nongeo").textContent = T.nonGeoToggle;
  document.getElementById("btn-geoloc").textContent = T.geolocBtn;
  document.getElementById("compteur-txt").textContent = T.compteur;
}

/* Branche tous les écouteurs d'événements de l'interface */
function bindControls() {
  document.getElementById("recherche").addEventListener("input", (e) => {
    FILTRES.recherche = e.target.value;
    refresh();
  });

  document.getElementById("filtre-region").addEventListener("change", (e) => {
    FILTRES.region = e.target.value;
    FILTRES.departement = "";
    FILTRES.arrondissement = "";
    peuplerDepartements();
    peuplerArrondissements();
    refresh();
  });

  document.getElementById("filtre-departement").addEventListener("change", (e) => {
    FILTRES.departement = e.target.value;
    FILTRES.arrondissement = "";
    peuplerArrondissements();
    refresh();
  });

  document.getElementById("filtre-arrondissement").addEventListener("change", (e) => {
    FILTRES.arrondissement = e.target.value;
    refresh();
  });

  document.getElementById("toggle-adherents").addEventListener("change", (e) => {
    FILTRES.adherentsOnly = e.target.checked;
    refresh();
  });

  document.getElementById("toggle-grossistes").addEventListener("change", (e) => {
    FILTRES.grossistesOnly = e.target.checked;
    // la segmentation n'est visible (et active) que si le toggle est coché
    document.getElementById("seg-grossistes").style.display = e.target.checked ? "block" : "none";
    if (!e.target.checked) resetSegGrossistes();
    refresh();
  });

  SEG_DEFS.forEach(([id, prop]) => {
    document.getElementById(id).addEventListener("change", (e) => {
      FILTRES.seg[prop] = e.target.value;
      refresh();
    });
  });

  document.getElementById("toggle-nongeo").addEventListener("change", (e) => {
    document.getElementById("non-geo-wrap").style.display = e.target.checked ? "block" : "none";
  });

  document.getElementById("btn-geoloc").addEventListener("click", locateUser);
}


/* =================================================================
 * 5. INIT — Point d'entrée
 * ================================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  injecterTextes();
  initMap();
  bindControls();
  setStatus(CONFIG.TXT.chargement, false);
  try {
    await loadShops();
    peuplerRegions();
    peuplerSegGrossistes();
    renderUnlocated();
    refresh();
    setStatus("", false);
  } catch (err) {
    console.error(err);
    setStatus(CONFIG.TXT.erreur, true);
  }
});
