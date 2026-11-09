// Panneau affiché au planning et aux statistiques tant que Zernio n'est pas configuré.
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const code = text => el('code', '', text);

export function zernioAbsent(phrase) {
  const panneau = el('div', 'zernioAbsent');
  const tete = el('div', 'zernioTete');
  tete.append(el('h3', '', 'Zernio n’est pas encore connecté'), el('p', 'muted', `${phrase} Le tournage et le montage marchent sans.`));
  const lien = Object.assign(el('a', '', 'zernio.com'), {href: 'https://zernio.com', target: '_blank', rel: 'noopener'});
  const etapes = el('ol', 'zernioEtapes');
  const li = (...x) => { const e = el('li'); e.append(...x); etapes.append(e); };
  li('Crée un compte sur ', lien, ', connecte tes réseaux et génère une clé d’API.');
  li('Mets la clé dans ', code('~/.config/zernio/.env'), ' : ', code('ZERNIO_API_KEY=ta_cle'), '.');
  li('Renseigne l’id du profil et des comptes dans le bloc ', code('zernio'), ' de ', code('studio.config.json'), '.');
  li('Relance le studio.');
  panneau.append(tete, etapes);
  return panneau;
}
