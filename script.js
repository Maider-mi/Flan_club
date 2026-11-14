// 0. LA FEUILLE GOOGLE : colle ici le lien de ta feuille « Site » publiée en CSV (voir les étapes à venir).
// Tant que ce lien est vide, le site affiche seulement les flans écrits dans la liste ci-dessous.
const LIEN_FEUILLE = "";

// 1. LES DONNEES : les flans recensés
// - "criteres" = les 4 notes [croûte, crème, caramélisation, qualité/prix]. La note finale est leur moyenne.
// - "exemple: true" = flan inventé (une étiquette « Exemple fictif » s'affiche).
// - latitude / longitude = la position exacte. Sans elles, le flan est placé au centre de sa ville.
const flansLocaux = [
  { nom: "Veloff", ville: "Biarritz", saveur: "Vanille", prix: 4.20, note: 4.8, photo: "images/flan-1.svg", latitude: 43.46161420631582, longitude: -1.5396550134930929 },
  { nom: "Le Flan Doré", ville: "Biarritz", saveur: "Nature intense", prix: 3.60, criteres: [4.5, 4.8, 4.4, 4.7], photo: "images/flan-2.svg", exemple: true },
  { nom: "Atelier Ostal", ville: "Saint-Jean-de-Luz", saveur: "Chocolat noir", prix: 4.50, criteres: [4.8, 5.0, 4.9, 4.9], photo: "images/flan-3.svg", exemple: true },
  { nom: "Belle Époque", ville: "Hendaye", saveur: "Noix de coco", prix: 3.90, criteres: [4.4, 4.6, 4.4, 4.6], photo: "images/flan-4.svg", exemple: true },
  { nom: "Les Délices de Léonie", ville: "Espelette", saveur: "Pistache", prix: 4.80, criteres: [4.6, 4.8, 4.7, 4.7], photo: "images/flan-5.svg", exemple: true },
  { nom: "Vanille & Cie", ville: "Saint-Jean-Pied-de-Port", saveur: "Caramel beurre salé", prix: 4.00, criteres: [4.3, 4.5, 4.6, 4.2], photo: "images/flan-6.svg", exemple: true }
];
let flans = [];

// Le centre de quelques villes basques (pour placer sur la carte un flan qui n'a pas de position exacte)
const centresVilles = {
  "ainhoa": [43.30, -1.50], "anglet": [43.48, -1.51], "ascain": [43.31, -1.62], "bayonne": [43.49, -1.47],
  "biarritz": [43.48, -1.56], "bidart": [43.44, -1.59], "cambo-les-bains": [43.36, -1.40], "ciboure": [43.38, -1.67],
  "espelette": [43.34, -1.45], "guethary": [43.42, -1.61], "hasparren": [43.38, -1.30], "hendaye": [43.37, -1.78],
  "itxassou": [43.32, -1.40], "mauleon-licharre": [43.22, -0.89], "sare": [43.31, -1.58], "saint-jean-de-luz": [43.39, -1.66],
  "saint-jean-pied-de-port": [43.16, -1.24], "saint-palais": [43.33, -1.03], "saint-pee-sur-nivelle": [43.36, -1.57],
  "urrugne": [43.36, -1.70], "ustaritz": [43.40, -1.46]
};

// 2. LES ELEMENTS DE LA PAGE
const champRecherche = document.getElementById("recherche");
const choixTri = document.getElementById("tri");
const liste = document.getElementById("liste");
const compteur = document.getElementById("compteur");
const messageVide = document.getElementById("vide");
const fenetre = document.getElementById("detail");

// 3. PETITS OUTILS
function proteger(texte) {   // empêche un texte de casser la page (sécurité)
  return String(texte ?? "").replace(/[&<>"']/g, function(c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function simplifier(texte) {   // enlève accents et majuscules pour comparer
  return String(texte ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function virgule(nombre, decimales) {   // 4.2 devient « 4,2 »
  return nombre.toFixed(decimales).replace(".", ",");
}
function calculerNote(flan) {   // la moyenne des 4 critères, ou la note unique si on n'a pas le détail
  if (Array.isArray(flan.criteres) && flan.criteres.length === 4) {
    const somme = flan.criteres.reduce(function(a, b) { return a + b; }, 0);
    return Math.round(somme / 4 * 10) / 10;
  }
  return typeof flan.note === "number" ? flan.note : null;
}
function formaterPrix(flan) {
  return typeof flan.prix === "number" ? virgule(flan.prix, 2) + " €" : "Prix non renseigné";
}
function formaterEtoiles(note) {
  const n = Math.round(note);
  return "★".repeat(n) + "☆".repeat(5 - n);
}
function position(flan) {   // où placer le flan sur la carte ?
  if (typeof flan.latitude === "number" && typeof flan.longitude === "number") {
    return { lat: flan.latitude, lon: flan.longitude, approx: false };
  }
  const centre = centresVilles[simplifier(flan.ville)];
  return centre ? { lat: centre[0], lon: centre[1], approx: true } : null;
}

// L'illustration d'un flan qui n'a pas de photo : on la dessine avec les couleurs de sa saveur
const COULEURS = [
  { mot: "chocolat", creme: "#6B3B24", dessus: "#3A1E12", fond: "#F3DCC4" },
  { mot: "pistache", creme: "#C9D98F", dessus: "#8C7A2E", fond: "#EEF0D2" },
  { mot: "coco", creme: "#FFF3D6", dessus: "#D2994A", fond: "#FFF6E5" },
  { mot: "caramel", creme: "#EFC678", dessus: "#A8541A", fond: "#FADFB5" },
  { mot: "nature", creme: "#F9E7A8", dessus: "#C07A26", fond: "#FFF0D2" },
  { mot: "vanille", creme: "#F6DF8E", dessus: "#B5651D", fond: "#FBE9C6" }
];
function illustration(saveur) {
  const s = simplifier(saveur);
  const c = COULEURS.find(function(x) { return s.includes(x.mot); }) || COULEURS[5];
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 190"><rect width="300" height="190" fill="' + c.fond + '"/>'
    + '<ellipse cx="150" cy="150" rx="112" ry="20" fill="#fff" opacity=".75"/>'
    + '<rect x="75" y="60" width="150" height="86" rx="14" fill="#D9A25E"/>'
    + '<rect x="84" y="72" width="132" height="66" rx="8" fill="' + c.creme + '"/>'
    + '<rect x="75" y="52" width="150" height="26" rx="13" fill="' + c.dessus + '"/></svg>';
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
function photoDe(flan) { return flan.photo || illustration(flan.saveur); }

// 4. LA CARTE (Leaflet + OpenStreetMap)
const emplacementCarte = document.getElementById("carte-flans");
let carte = null, groupeReperes = null, reperes = {};
const iconeFlan = (typeof L !== "undefined") ? L.divIcon({
  html: '<div style="font-size:32px;text-align:center;line-height:40px;">🍮</div>',
  className: "", iconSize: [40, 40], iconAnchor: [20, 20]
}) : null;

if (emplacementCarte && typeof L !== "undefined") {
  carte = L.map("carte-flans").setView([43.4933, -1.4751], 10);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
  }).addTo(carte);
  groupeReperes = L.layerGroup().addTo(carte);
  // la carte recalcule sa taille une fois la page entièrement chargée (évite une carte vide ou grise)
  window.addEventListener("load", function() { carte.invalidateSize(); });
  setTimeout(function() { carte.invalidateSize(); }, 500);

  // Le bouton « Me géolocaliser »
  const boutonGeo = document.getElementById("btn-geolocalisation");
  let reperePosition = null;
  if (boutonGeo) {
    boutonGeo.addEventListener("click", function() {
      if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas disponible sur ce navigateur.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function(p) {
          carte.setView([p.coords.latitude, p.coords.longitude], 14);
          if (reperePosition) carte.removeLayer(reperePosition);
          reperePosition = L.marker([p.coords.latitude, p.coords.longitude]).addTo(carte).bindPopup("📍 Vous êtes ici !").openPopup();
        },
        function() { alert("Impossible de te géolocaliser. Vérifie les autorisations de ton navigateur."); }
      );
    });
  }
}

function fichePopup(flan, approx) {   // le contenu de la bulle qui s'ouvre sur la carte
  const note = calculerNote(flan);
  return '<div style="width:220px;font-family:Arial,sans-serif;">'
    + '<img src="' + proteger(photoDe(flan)) + '" alt="Illustration du flan" style="width:100%;height:120px;object-fit:cover;border-radius:10px;">'
    + '<h3 style="margin:10px 0 5px;">🍮 ' + proteger(flan.nom) + '</h3>'
    + '<p style="margin:3px 0;">📍 ' + proteger(flan.ville) + (flan.exemple ? " (exemple fictif)" : approx ? " (position approximative)" : "") + '</p>'
    + '<p style="margin:3px 0;">💶 ' + formaterPrix(flan) + '</p>'
    + '<p style="margin:3px 0;">⭐ ' + (note === null ? "Pas encore de note" : virgule(note, 1) + " / 5") + '</p>'
    + '<button class="btn btn-secondaire btn-petit" onclick="ouvrirDetail(' + flan.id + ')">Voir le détail</button></div>';
}

function dessinerReperes(resultats) {   // on remet un repère pour chaque flan affiché
  if (!carte) return;
  groupeReperes.clearLayers();
  reperes = {};
  resultats.forEach(function(flan) {
    const pos = position(flan);
    if (!pos) return;
    const repere = L.marker([pos.lat, pos.lon], { icon: iconeFlan }).bindPopup(fichePopup(flan, pos.approx));
    repere.addTo(groupeReperes);
    reperes[flan.id] = repere;
  });
}

function voirSurCarte(id) {   // le bouton « Sur la carte » d'une fiche
  const repere = reperes[id];
  if (!repere || !carte) return;
  if (fenetre && fenetre.open) fenetre.close();
  document.getElementById("section-carte").scrollIntoView({ behavior: "smooth" });
  carte.setView(repere.getLatLng(), 15);
  repere.openPopup();
}

// 5. UNE FICHE
function creerFiche(flan) {
  const note = calculerNote(flan);
  return '<article class="fiche">'
    + '<div class="photo"><img src="' + proteger(photoDe(flan)) + '" alt="Illustration du flan">'
    + (note === null ? "" : '<span class="pastille">★ ' + virgule(note, 1) + '</span>')
    + (flan.exemple ? '<span class="exemple">Exemple fictif</span>' : "") + '</div>'
    + '<div class="infos"><div class="haut"><h2 class="nom">' + proteger(flan.nom) + '</h2><span class="prix">' + formaterPrix(flan) + '</span></div>'
    + '<p class="ville">📍 ' + proteger(flan.ville) + '</p>'
    + '<span class="saveur">' + proteger(flan.saveur || "À découvrir") + '</span>'
    + '<div class="note"><span class="etoiles">' + (note === null ? "" : formaterEtoiles(note)) + '</span><span>'
    + (note === null ? "Pas encore de note" : virgule(note, 1) + " / 5") + '</span></div></div>'
    + '<div class="actions"><button class="btn btn-principal btn-petit" data-action="detail" data-id="' + flan.id + '">Voir le détail</button>'
    + (reperes[flan.id] ? '<button class="btn btn-secondaire btn-petit" data-action="carte" data-id="' + flan.id + '">📍 Sur la carte</button>' : "")
    + '</div></article>';
}

// 6. LA FENÊTRE DE DÉTAIL
function ouvrirDetail(id) {
  if (!fenetre) return;
  const flan = flans.find(function(f) { return f.id === id; });
  if (!flan) return;
  const note = calculerNote(flan);
  const noms = ["Croûte", "Crème", "Caramélisation", "Rapport qualité/prix"];
  const barres = Array.isArray(flan.criteres)
    ? noms.map(function(nom, i) {
        return '<div class="critere"><span>' + nom + '</span><div class="barre-note"><i style="width:' + (flan.criteres[i] * 20) + '%"></i></div><b>' + virgule(flan.criteres[i], 1) + '</b></div>';
      }).join("")
    : '<p class="astuce">Le détail des notes arrive bientôt.</p>';
  const pos = position(flan);
  let lienItineraire = "";
  if (!flan.exemple) {
    const url = (pos && !pos.approx)
      ? "https://www.google.com/maps/dir/?api=1&destination=" + pos.lat + "," + pos.lon
      : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(flan.nom + " " + (flan.adresse || "") + " " + flan.ville);
    lienItineraire = '<a class="btn btn-secondaire btn-petit" href="' + url + '" target="_blank" rel="noopener noreferrer">🧭 Itinéraire</a>';
  }
  fenetre.innerHTML = '<button class="fermer" aria-label="Fermer" onclick="this.closest(\'dialog\').close()">✕</button>'
    + '<img src="' + proteger(photoDe(flan)) + '" alt="Illustration du flan">'
    + '<div class="contenu"><h2 class="nom">' + proteger(flan.nom) + '</h2>'
    + '<p class="ville">📍 ' + proteger(flan.adresse ? flan.adresse + ", " : "") + proteger(flan.ville) + ' · ' + proteger(flan.saveur || "À découvrir") + ' · ' + formaterPrix(flan) + '</p>'
    + '<div class="grosse-note"><b>' + (note === null ? "–" : virgule(note, 1)) + '</b><span class="etoiles">' + (note === null ? "" : formaterEtoiles(note)) + '</span></div>'
    + barres
    + (flan.avis ? '<p class="avis">« ' + proteger(flan.avis) + ' »</p>' : "")
    + '<div class="actions" style="padding:16px 0 0;">' + (reperes[flan.id] ? '<button class="btn btn-principal btn-petit" onclick="voirSurCarte(' + flan.id + ')">📍 Sur la carte</button>' : "") + lienItineraire + '</div></div>';
  fenetre.showModal();
}
if (fenetre) fenetre.addEventListener("click", function(e) { if (e.target === fenetre) fenetre.close(); });
liste.addEventListener("click", function(e) {   // un clic sur un bouton d'une fiche
  const bouton = e.target.closest("button[data-action]");
  if (!bouton) return;
  const id = Number(bouton.dataset.id);
  if (bouton.dataset.action === "detail") ouvrirDetail(id);
  if (bouton.dataset.action === "carte") voirSurCarte(id);
});

// 7. LA RECHERCHE ET LE TRI
function trier(resultats) {
  const choix = choixTri ? choixTri.value : "note";
  resultats.sort(function(a, b) {
    if (choix === "prix-asc") return (a.prix ?? 999) - (b.prix ?? 999);
    if (choix === "prix-desc") return (b.prix ?? -1) - (a.prix ?? -1);
    return (calculerNote(b) ?? -1) - (calculerNote(a) ?? -1);
  });
}

function afficher() {
  if (!champRecherche || !liste || !compteur || !messageVide) return;
  const recherche = simplifier(champRecherche.value);
  const resultats = flans.filter(function(flan) { return simplifier(flan.ville).includes(recherche); });
  trier(resultats);
  dessinerReperes(resultats);   // d'abord la carte, pour que les fiches sachent si elles ont un repère
  liste.innerHTML = resultats.map(creerFiche).join("");
  messageVide.hidden = resultats.length > 0;
  const pluriel = resultats.length > 1 ? "s" : "";
  compteur.textContent = recherche
    ? resultats.length + " flan" + pluriel + " trouvé" + pluriel
    : resultats.length + " flan" + pluriel + " à découvrir";
}

// 8. LES FLANS PROPOSÉS PAR LE FORMULAIRE (lus depuis la feuille Google, une fois que tu l'as publiée)
function lireCSV(texte) {   // transforme le texte CSV en tableau de lignes
  const lignes = [];
  let ligne = [], cellule = "", entreGuillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (entreGuillemets) {
      if (c === '"' && texte[i + 1] === '"') { cellule += '"'; i++; }
      else if (c === '"') entreGuillemets = false;
      else cellule += c;
    } else if (c === '"') entreGuillemets = true;
    else if (c === ",") { ligne.push(cellule); cellule = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i++;
      ligne.push(cellule); cellule = ""; lignes.push(ligne); ligne = [];
    } else cellule += c;
  }
  if (cellule !== "" || ligne.length) { ligne.push(cellule); lignes.push(ligne); }
  return lignes.filter(function(l) { return l.some(function(x) { return x.trim() !== ""; }); });
}

function nombre(texte, min, max) {   // « 4,5 » devient 4.5 ; null si ce n'est pas un nombre valide
  const n = parseFloat(String(texte ?? "").replace(",", "."));
  return (isNaN(n) || n < min || n > max) ? null : n;
}

function ligneEnFlan(entetes, cellules) {
  function col(nom) { return (cellules[entetes.indexOf(nom)] || "").trim(); }
  if (!col("nom") || !col("ville")) return null;
  const criteres = [col("croute"), col("creme"), col("caramelisation"), col("qualite")].map(function(t) { return nombre(t, 0, 5); });
  return {
    nom: col("nom"), ville: col("ville"), adresse: col("adresse"), saveur: col("saveur"),
    prix: nombre(col("prix"), 0, 100) ?? undefined,
    criteres: criteres.every(function(c) { return c !== null; }) ? criteres : undefined,
    avis: col("avis"),
    latitude: nombre(col("latitude"), -90, 90) ?? undefined,
    longitude: nombre(col("longitude"), -180, 180) ?? undefined
  };
}

function numeroter(liste) {   // chaque flan reçoit un numéro unique
  liste.forEach(function(flan, i) { flan.id = i; });
  return liste;
}

async function chargerFeuille() {
  flans = numeroter(flansLocaux.slice());
  afficher();
  if (!LIEN_FEUILLE) return;
  try {
    const reponse = await fetch(LIEN_FEUILLE);
    if (!reponse.ok) throw new Error("Erreur " + reponse.status);
    const lignes = lireCSV(await reponse.text());
    const entetes = lignes.shift().map(simplifier);
    const deja = flansLocaux.map(function(f) { return simplifier(f.nom + f.ville); });
    const nouveaux = lignes.map(function(l) { return ligneEnFlan(entetes, l); })
      .filter(function(f) { return f && !deja.includes(simplifier(f.nom + f.ville)); });
    flans = numeroter(flansLocaux.concat(nouveaux));
    afficher();
  } catch (erreur) {
    console.error("Impossible de lire la feuille Google :", erreur);   // le site continue avec les flans locaux
  }
}

// 9. LE DÉMARRAGE
if (champRecherche) champRecherche.addEventListener("input", afficher);
if (choixTri) choixTri.addEventListener("change", afficher);
chargerFeuille();
