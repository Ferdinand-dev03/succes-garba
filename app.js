/* ═══════════════════════════════════════════════════════════
   SUCCÈS GARBA — app.js
   GSAP 3.13 + ScrollTrigger + SplitText (gratuits depuis 2025).

   Ce qui est fait en CSS (pas ici) : le « rideau » du manifeste et les
   éléments qui restent collés (position: sticky). Le JavaScript ne fait
   que les mouvements : découpe de l'accueil, apparitions, arc du cercle.

   Règles suivies partout :
   - on n'anime que transform, opacity, clip-path, stroke-dashoffset et des
     variables CSS (jamais width/height/letter-spacing : ça recalcule la page) ;
   - gsap.matchMedia() sépare ordinateur / téléphone / mouvement réduit ;
   - si ce fichier ne charge pas, la page reste entièrement lisible.
   ═══════════════════════════════════════════════════════════ */

// Le bon de commande passe en premier : il doit marcher même si GSAP ne charge pas.
bonDeCommande();

gsap.registerPlugin(ScrollTrigger, SplitText);

// L'arc du cercle et l'en-tête collé fonctionnent même en mouvement réduit :
// ils suivent le défilement, ce n'est pas une animation décorative.
cercleDesEtapes();

const mm = gsap.matchMedia();
mm.add(
  {
    ordinateur: '(min-width: 900px) and (hover: hover)',
    telephone: '(max-width: 899px), (hover: none)',
    reduit: '(prefers-reduced-motion: reduce)',
  },
  (context) => {
    const { reduit } = context.conditions;
    if (reduit) return;            // mouvement réduit : aucune animation décorative

    manifeste();
    revelerTitres();
  }
);

/* ─────────────────────────────────────────────────────────────
   A3. LE MANIFESTE SOMBRE (accueil vidéo depuis le 2026-11-05)
   ───────────────────────────────────────────────────────────── */
function manifeste() {
  const section = document.querySelector('.manifesto');
  if (!section) return;

  const titre = SplitText.create('.manifesto-title', { type: 'lines', mask: 'lines' });

  // C'est l'accueil depuis le 2026-11-05 : l'apparition se joue dès le chargement.
  const tl = gsap.timeline({ delay: 0.2 });
  tl.from('.monogram', { opacity: 0, scale: 0.8, yPercent: 10, duration: 1.2, ease: 'power3.out' })
    .from('.manifesto .label', { opacity: 0, y: 12, duration: 0.6 }, '-=0.8')
    .from(titre.lines, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.1 }, '-=0.5')
    .from('.manifesto hr', { scaleX: 0, duration: 0.9, ease: 'power3.inOut' }, '-=0.5')
    .from('.manifesto .btn', { opacity: 0, y: 16, duration: 0.6 }, '-=0.4');

  // Vidéo : 4,4 Mo. On ne la charge pas si le visiteur a activé l'économie
  // de données ou s'il est en 2G/3G. L'image d'attente (poster) suffit.
  // Elle joue dès l'arrivée sur la page et s'arrête quand les étapes l'ont recouverte.
  const video = section.querySelector('video');
  const connexion = navigator.connection || {};
  const connexionLente = connexion.saveData || /2g|3g/.test(connexion.effectiveType || '');
  if (video && !connexionLente) {
    ScrollTrigger.create({
      trigger: section, start: 'top bottom',
      endTrigger: '.steps', end: 'top top',
      onToggle: (self) => (self.isActive ? video.play().catch(() => {}) : video.pause()),
    });
  }
}

/* ─────────────────────────────────────────────────────────────
   A2. LE CERCLE DES SIX ÉTAPES (comme Balans)
   L'assiette reste collée (CSS sticky), le texte défile librement.
   On trace une « ligne de lecture » à 60 % de la hauteur de l'écran :
   - l'étape dont le haut a franchi cette ligne devient l'étape courante ;
   - entre deux étapes, l'arc avance en proportion du chemin parcouru ;
   - l'arc va du point 1 (3 h) au point 6 : 5/6 du tour au maximum ;
   - chaque point atteint grossit et passe à l'orange (CSS, classe is-active).
   ───────────────────────────────────────────────────────────── */
function cercleDesEtapes() {
  const section = document.querySelector('.steps');
  if (!section) return;

  const tete = section.querySelector('.steps-head');
  const etapes = [...section.querySelectorAll('.step')];
  const points = [...section.querySelectorAll('.ring-dots g')];
  const onglets = [...section.querySelectorAll('.steps-tabs a')];
  const arc = section.querySelector('.ring-progress');
  const nb = etapes.length;                                     // 6

  // Hauteur exacte de l'en-tête collé, pour placer l'assiette juste dessous.
  const mesurer = () => section.style.setProperty('--tete', tete.offsetHeight + 'px');
  mesurer();
  new ResizeObserver(mesurer).observe(tete);

  // On lisse le mouvement de l'arc avec quickTo, mais sur un simple objet :
  // animé directement, strokeDashoffset était arrondi au pixel par GSAP,
  // donc à 0 ou 1 (nos valeurs vont de 0 à 1) : l'arc sautait d'un coup.
  const etat = { offset: 1 };
  const arcVers = gsap.quickTo(etat, 'offset', {
    duration: 0.35, ease: 'power2.out',
    onUpdate: () => { arc.style.strokeDashoffset = etat.offset; },
  });

  let courante = -1;
  const mettreAJour = () => {
    const ligne = window.innerHeight * 0.6;
    const hauts = etapes.map((el) => el.getBoundingClientRect().top);

    let k = 0;                                                  // étape courante (0 à 5)
    hauts.forEach((h, i) => { if (h <= ligne) k = i; });
    let f = 0;                                                  // avancée vers l'étape suivante (0 à 1)
    if (k < nb - 1 && hauts[k] <= ligne) {
      f = gsap.utils.clamp(0, 1, (ligne - hauts[k]) / (hauts[k + 1] - hauts[k]));
    }

    arcVers(1 - (k + f) / nb);                                  // 1 = invisible, 1/6 = point 6 atteint

    if (k !== courante) {
      courante = k;
      points.forEach((el, i) => el.classList.toggle('is-active', i <= k));
      onglets.forEach((el, i) => el.classList.toggle('is-active', i === k));
    }
  };

  ScrollTrigger.create({
    trigger: section.querySelector('.steps-list'),
    start: 'top bottom', end: 'bottom top',
    onUpdate: mettreAJour,
    onRefresh: mettreAJour,
  });
  mettreAJour();
}

/* ─────────────────────────────────────────────────────────────
   A4. LES TITRES RÉVÉLÉS LIGNE PAR LIGNE
   SplitText découpe le texte en lignes et met chaque ligne dans un
   masque (overflow caché). On fait monter chaque ligne de sous son masque.
   autoSplit : si la largeur change, le texte est redécoupé proprement.
   ───────────────────────────────────────────────────────────── */
function revelerTitres() {
  const titres = document.querySelectorAll('.where h2, .where-address, .order h2');
  titres.forEach((titre) => {
    SplitText.create(titre, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.9,
          ease: 'power4.out',
          stagger: 0.1,
          scrollTrigger: { trigger: titre, start: 'top 85%' },
        }),
    });
  });

  // A5 (complément) : le bouton « Commander » arrive avec un petit rebond.
  gsap.from('.order .btn', {
    scale: 0.8, opacity: 0, duration: 0.8, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.order', start: 'top 70%' },
  });
}

/* ─────────────────────────────────────────────────────────────
   LE BON DE COMMANDE
   Le client choisit le montant de son attiéké (100 F minimum) et de son
   poisson (200 F minimum), ajoute un message s'il veut. Le total se
   calcule seul et la commande part sur le WhatsApp de Succès Garba.
   ───────────────────────────────────────────────────────────── */
function bonDeCommande() {
  const form = document.getElementById('commande');
  if (!form) return;

  const WHATSAPP = '2250576548868';
  const attieke = form.elements.attieke;
  const poisson = form.elements.poisson;
  const message = form.elements.message;
  const total = document.getElementById('total-commande');
  const erreur = document.getElementById('erreur-commande');
  const fcfa = (n) => n.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' FCFA';
  const montant = (champ) => parseInt(champ.value, 10) || 0;

  // Les pastilles (100, 200, 300…) remplissent le champ d'un clic
  form.querySelectorAll('.order-chips').forEach((groupe) => {
    const champ = document.getElementById(groupe.dataset.for);
    groupe.querySelectorAll('button').forEach((bouton) => {
      bouton.addEventListener('click', () => {
        champ.value = bouton.textContent;
        mettreAJour();
      });
    });
  });

  function mettreAJour() {
    total.textContent = fcfa(montant(attieke) + montant(poisson));
    form.querySelectorAll('.order-chips').forEach((groupe) => {
      const valeur = document.getElementById(groupe.dataset.for).value;
      groupe.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === valeur)));
    });
    erreur.textContent = '';
  }

  attieke.addEventListener('input', mettreAJour);
  poisson.addEventListener('input', mettreAJour);
  mettreAJour();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const a = montant(attieke);
    const p = montant(poisson);
    if (a < 100) { erreur.textContent = 'L’attiéké commence à 100 FCFA.'; attieke.focus(); return; }
    if (p < 200) { erreur.textContent = 'Le poisson commence à 200 FCFA.'; poisson.focus(); return; }

    const lignes = [
      'Bonjour Succès Garba, je voudrais commander un garba :',
      `- Attiéké : ${fcfa(a)}`,
      `- Poisson : ${fcfa(p)}`,
      `Total : ${fcfa(a + p)}`,
    ];
    if (message.value.trim()) lignes.push('', `Message : ${message.value.trim()}`);

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lignes.join('\n'))}`, '_blank', 'noopener');
  });
}
