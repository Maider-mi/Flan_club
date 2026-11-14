// 1. LES DONNEES : les flans recenses
const flans = [
  { nom: "Veloff", ville: "Biarritz", saveur: "Vanille", prix: 4.20, note: 4.8, photo: "images/flan-1.svg", latitude: 43.46161420631582, longitude: -1.5396550134930929 },
  { nom: "Le Flan Doré", ville: "Biarritz", saveur: "Nature intense", prix: 3.60, note: 4.6, photo: "images/flan-2.svg" },
  { nom: "Atelier Ostal", ville: "Saint-Jean-de-Luz", saveur: "Chocolat noir", prix: 4.50, note: 4.9, photo: "images/flan-3.svg" },
  { nom: "Belle Époque", ville: "Hendaye", saveur: "Noix de coco", prix: 3.90, note: 4.5, photo: "images/flan-4.svg" },
  { nom: "Les Délices de Léonie", ville: "Espelette", saveur: "Pistache", prix: 4.80, note: 4.7, photo: "images/flan-5.svg" },
  { nom: "Vanille & Cie", ville: "Saint-Jean-Pied-de-Port", saveur: "Caramel beurre salé", prix: 4.00, note: 4.4, photo: "images/flan-6.svg" }
];

// 2. LES ELEMENTS DE LA PAGE
const champRecherche = document.getElementById("recherche");
const liste = document.getElementById("liste");
const compteur = document.getElementById("compteur");
const messageVide = document.getElementById("vide");

// 3. PROTECTION DES TEXTES AFFICHES EN HTML
function proteger(texte) {
  return String(texte ?? "").replace(/[&<>"']/g, function(caractere) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[caractere];
  });
}

// 4. CREER UNE FICHE
function creerFiche(flan) {
  const prix = typeof flan.prix === "number"
    ? flan.prix.toFixed(2).replace(".", ",") + " €"
    : "Prix non renseigné";

  const noteDisponible = typeof flan.note === "number" && flan.note >= 0 && flan.note <= 5;
  const note = noteDisponible
    ? flan.note.toFixed(1).replace(".", ",") + " / 5"
    : "Pas encore de note";

  const nombreEtoiles = noteDisponible ? Math.round(flan.note) : 0;
  const etoiles = noteDisponible
    ? "★".repeat(nombreEtoiles) + "☆".repeat(5 - nombreEtoiles)
    : "";

  return `
    <article class="fiche">
      <img src="${proteger(flan.photo)}" alt="Illustration du flan">
      <div class="infos">
        <div class="haut">
          <h2 class="nom">${proteger(flan.nom)}</h2>
          <span class="prix">${prix}</span>
        </div>
        <p class="ville">📍 ${proteger(flan.ville)}</p>
        <span class="saveur">${proteger(flan.saveur)}</span>
        <div class="note">
          <span class="etoiles">${etoiles}</span>
          <span>${note}</span>
        </div>
      </div>
    </article>`;
}

// 5. LA RECHERCHE
function simplifier(texte) {
  return String(texte).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function afficher() {
  if (!champRecherche || !liste || !compteur || !messageVide) return;

  const recherche = simplifier(champRecherche.value);
  const resultats = flans.filter(function(flan) {
    return simplifier(flan.ville).includes(recherche);
  });

  liste.innerHTML = resultats.map(creerFiche).join("");
  messageVide.hidden = resultats.length > 0;

  const pluriel = resultats.length > 1 ? "s" : "";
  compteur.textContent = recherche
    ? `${resultats.length} flan${pluriel} trouvé${pluriel}`
    : `${resultats.length} flan${pluriel} à découvrir`;
}

// 6. AFFICHAGE DES FICHES
if (champRecherche) {
  champRecherche.addEventListener("input", afficher);
}
afficher();

// 7. CARTE INTERACTIVE
const emplacementCarte = document.getElementById("carte-flans");

if (emplacementCarte && typeof L !== "undefined") {

  const carte = L.map("carte-flans").setView([43.4933, -1.4751], 10);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(carte);

  // Notre icone flan
  const iconeFlan = L.divIcon({
    html: '<div style="font-size:32px;text-align:center;line-height:40px;">🍮</div>',
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  // Creation automatique des reperes
  flans.forEach(function(flan) {

    if (typeof flan.latitude === "number" &&
        typeof flan.longitude === "number") {

      const prix = typeof flan.prix === "number"
        ? flan.prix.toFixed(2).replace(".", ",") + " €"
        : "Non renseigné";

      const note = typeof flan.note === "number"
        ? flan.note.toFixed(1).replace(".", ",") + " / 5 ⭐"
        : "Pas encore de note";

      // Fiche ouverte directement sur la carte
      const fichePopup = `
        <div style="width:220px;font-family:Arial,sans-serif;">
          <img src="${proteger(flan.photo)}"
               alt="Illustration du flan"
               style="width:100%;height:120px;object-fit:cover;border-radius:10px;">

          <h3 style="margin:10px 0 5px;">
            🍮 ${proteger(flan.nom)}
          </h3>

          <p>📍 ${proteger(flan.ville)}</p>
          <p>🍮 ${proteger(flan.saveur || "À découvrir")}</p>
          <p>💶 ${prix}</p>
          <p>⭐ ${note}</p>
        </div>
      `;

      L.marker([flan.latitude, flan.longitude], {
        icon: iconeFlan
      })
        .addTo(carte)
        .bindPopup(fichePopup);
    }
  });

  // 8. GEOLOCALISATION
  const boutonGeo = document.getElementById("btn-geolocalisation");
  let reperePosition = null;

  if (boutonGeo) {
    boutonGeo.addEventListener("click", function() {

      if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas disponible sur ce navigateur.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        function(position) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          carte.setView([latitude, longitude], 14);

          if (reperePosition) {
            carte.removeLayer(reperePosition);
          }

          reperePosition = L.marker([latitude, longitude])
            .addTo(carte)
            .bindPopup("📍 Vous êtes ici !")
            .openPopup();
        },

        function(erreur) {
          alert("Impossible de te géolocaliser. Vérifie les autorisations de ton navigateur.");
          console.error(erreur);
        }
      );
    });
  }
}
