// 1. LES DONNÉES : la liste des 6 flans.
// Pour ajouter un flan, il suffit de copier une ligne et de changer les infos.
const flans = [
  { nom: "Maison Caramélia",       ville: "Bayonne",                 saveur: "Vanille bourbon",     prix: 4.20, note: 4.8, photo: "images/flan-1.svg" },
  { nom: "Le Flan Doré",           ville: "Biarritz",                saveur: "Nature intense",      prix: 3.60, note: 4.6, photo: "images/flan-2.svg" },
  { nom: "Atelier Ostal",          ville: "Saint-Jean-de-Luz",       saveur: "Chocolat noir",       prix: 4.50, note: 4.9, photo: "images/flan-3.svg" },
  { nom: "Belle Époque",           ville: "Hendaye",                 saveur: "Noix de coco",        prix: 3.90, note: 4.5, photo: "images/flan-4.svg" },
  { nom: "Les Délices de Léonie",  ville: "Espelette",               saveur: "Pistache",            prix: 4.80, note: 4.7, photo: "images/flan-5.svg" },
  { nom: "Vanille & Cie",          ville: "Saint-Jean-Pied-de-Port", saveur: "Caramel beurre salé", prix: 4.00, note: 4.4, photo: "images/flan-6.svg" }
];

// 2. LES ÉLÉMENTS DE LA PAGE : on "attrape" les morceaux de index.html dont on a besoin
const champRecherche = document.getElementById("recherche");
const liste = document.getElementById("liste");
const compteur = document.getElementById("compteur");
const messageVide = document.getElementById("vide");

// 3. LA FICHE : à partir des infos d'un flan, on fabrique le morceau de HTML de sa fiche
function creerFiche(flan) {
  const prix = flan.prix.toFixed(2).replace(".", ",") + " €";   // 4.2 devient « 4,20 € »
  const note = flan.note.toFixed(1).replace(".", ",");          // 4.8 devient « 4,8 »
  const etoilesPleines = Math.round(flan.note);
  const etoiles = "★".repeat(etoilesPleines) + "☆".repeat(5 - etoilesPleines);

  return `
    <article class="fiche">
      <img src="${flan.photo}" alt="Illustration d’un flan ${flan.saveur}">
      <div class="infos">
        <div class="haut">
          <h2 class="nom">${flan.nom}</h2>
          <span class="prix">${prix}</span>
        </div>
        <p class="ville">📍 ${flan.ville}</p>
        <span class="saveur">${flan.saveur}</span>
        <div class="note"><span class="etoiles">${etoiles}</span><span>${note} / 5</span></div>
      </div>
    </article>`;
}

// 4. LA RECHERCHE : on enlève les accents et les majuscules pour comparer ce qui est tapé et le nom des villes
function simplifier(texte) {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// 5. L'AFFICHAGE : on garde les flans dont la ville correspond, puis on les montre
function afficher() {
  const recherche = simplifier(champRecherche.value);
  const resultats = flans.filter(flan => simplifier(flan.ville).includes(recherche));

  liste.innerHTML = resultats.map(creerFiche).join("");
  messageVide.hidden = resultats.length > 0;

  const pluriel = resultats.length > 1 ? "s" : "";
  compteur.textContent = recherche
    ? `${resultats.length} flan${pluriel} trouvé${pluriel}`
    : `${resultats.length} flan${pluriel} à découvrir`;
}

// 6. LE DÉMARRAGE : à chaque lettre tapée on réaffiche, et on affiche une première fois au chargement
champRecherche.addEventListener("input", afficher);
afficher();

  
// 7. LA CARTE INTERACTIVE DES FLANS
const emplacementCarte = document.getElementById("carte-flans");

if (emplacementCarte && typeof L !== "undefined") {
  const carte = L.map("carte-flans").setView([43.4933, -1.4751], 10);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(carte);
}
