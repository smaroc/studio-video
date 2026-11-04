// Configuration du studio : valeurs par défaut + studio.config.json à la racine (lu au démarrage, relancer pour appliquer).
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const defauts = {
  nom: 'mon studio',
  prenom: '',
  pseudo: '',
  langue: 'fr',
  fuseau: 'Europe/Paris',
  reseaux: ['instagram', 'tiktok', 'youtube'],
  zernio: {profil: '', comptes: {instagram: '', facebook: '', tiktok: '', youtube: ''}},
  dm: {
    message: 'Salut ! Voici le lien : {url}',
    reponseInstagram: 'Envoyé en DM',
    variantes: ['Go dans tes DMs', "C'est envoyé"],
    reponseFacebook: 'Envoyé en message privé',
    abonnementRequis: false,
    messageAbonnement: 'Pour recevoir le lien, abonne-toi à {pseudo} puis appuie sur « Vérifier abonnement ». Le lien sera envoyé après vérification.',
    messageNonAbonne: "Ton abonnement à {pseudo} n'est pas confirmé. Abonne-toi, puis clique de nouveau sur « Vérifier abonnement ».",
    bouton: 'Vérifier abonnement',
  },
  piliers: [],
  couverture: {fond: '#F0EDE6', encre: '#1F1B16', accent: '#D9643A', gris: '#B9AFA3', signature: '#7A6F63'},
};

const objet = v => v && typeof v === 'object' && !Array.isArray(v);
const fusion = (a, b) => {
  const out = {...a};
  for (const [k, v] of Object.entries(b)) out[k] = objet(v) && objet(a[k]) ? fusion(a[k], v) : v;
  return out;
};

function lire() {
  const fichier = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'studio.config.json');
  try { return JSON.parse(readFileSync(fichier, 'utf8')); }
  catch (e) {
    if (e.code === 'ENOENT') return {};
    throw Error(`studio.config.json illisible : ${e.message}`);
  }
}

export const config = fusion(defauts, lire());
