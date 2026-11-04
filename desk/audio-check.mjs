// Vérification du son d'une prise, sur le fichier réellement sauvegardé : piste présente, niveaux, clarté de la voix.
// La clarté est la part d'énergie entre 6 et 8 kHz : elle sépare nettement une voix claire d'une voix étouffée.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run = promisify(execFile);

export const SEUILS = {claire: -27, etouffee: -32, sature: -0.5, faible: -35, muet: -55};

async function volume(file, filtre) {
  const args = ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', `${filtre}volumedetect`, '-f', 'null', '-'];
  const {stderr} = await run('ffmpeg', args, {maxBuffer: 1 << 24});
  const lire = cle => Number(stderr.match(new RegExp(`${cle}: (-?[\\d.]+) dB`))?.[1] ?? NaN);
  return {moyen: lire('mean_volume'), pic: lire('max_volume')};
}

export function verdictClarte(db) {
  if (db === null || !Number.isFinite(db)) return 'inconnue';
  return db >= SEUILS.claire ? 'claire' : db >= SEUILS.etouffee ? 'moyenne' : 'étouffée';
}

export async function verifierAudio(file) {
  const {stdout} = await run('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name,sample_rate,channels', '-of', 'json', file]);
  const piste = JSON.parse(stdout).streams?.[0];
  if (!piste) return {piste: false, alertes: ['Aucune piste audio dans ce fichier.']};
  const [tout, haut] = await Promise.all([
    volume(file, ''),
    volume(file, 'highpass=f=6000,highpass=f=6000,lowpass=f=8000,lowpass=f=8000,'),
  ]);
  const muet = !(tout.moyen >= SEUILS.muet);
  const clarteDb = muet ? null : Math.round((haut.moyen - tout.moyen) * 10) / 10;
  const alertes = [];
  if (muet) alertes.push('Prise quasi muette.');
  else {
    if (tout.pic >= SEUILS.sature) alertes.push('Le son sature.');
    if (tout.moyen < SEUILS.faible) alertes.push('Niveau trop faible.');
    if (verdictClarte(clarteDb) === 'étouffée') alertes.push('Voix étouffée.');
  }
  return {piste: true, codec: piste.codec_name, hz: Number(piste.sample_rate), voies: piste.channels, picDb: tout.pic, moyenDb: tout.moyen, clarteDb, clarte: muet ? 'muette' : verdictClarte(clarteDb), alertes};
}
