# RS Hebdo Delivery — FAQ & Problèmes connus

> Toutes les questions et problèmes que vous pouvez rencontrer en tant que journaliste sur la plateforme.

---

## Table des matières

1. [Connexion & compte](#1-connexion--compte)
2. [Dashboard](#2-dashboard)
3. [Formulaire de livraison](#3-formulaire-de-livraison)
4. [Upload d'images](#4-upload-dimages)
5. [Correction IA](#5-correction-ia)
6. [Soumission & Dropbox](#6-soumission--dropbox)
7. [Modification d'une livraison](#7-modification-dune-livraison)
8. [Problèmes réseau & performance](#8-problèmes-réseau--performance)
9. [Navigateur & session](#9-navigateur--session)
10. [Référence rapide des messages d'erreur](#10-référence-rapide-des-messages-derreur)

---

## 1. Connexion & compte

### Q : Je n'arrive pas à me connecter, que faire ?

**Message affiché** : *"Email ou mot de passe incorrect"*

**Causes possibles :**
- Email ou mot de passe erroné (attention aux majuscules et espaces)
- Votre compte n'a pas encore été créé par l'administrateur
- Faute de frappe dans l'adresse email

**Solution :** Vérifiez vos identifiants. Si le problème persiste, contactez l'administrateur pour qu'il vérifie votre compte.

---

### Q : Mon compte est désactivé, comment le réactiver ?

**Message affiché** : *"Compte desactive"*

**Cause :** L'administrateur a désactivé votre compte (champ `is_active` passé à `false`).

**Solution :** Contactez l'administrateur pour qu'il réactive votre accès.

---

### Q : J'étais connecté et je me retrouve sur la page de login

**Cause possible :**
- Votre session a expiré (token d'authentification périmé)
- Vous avez vidé le cache ou les cookies de votre navigateur
- Le navigateur a fermé et la session n'a pas été conservée

**Solution :** Reconnectez-vous avec vos identifiants. Aucune donnée n'est perdue.

---

### Q : Je n'ai pas reçu mes identifiants

**Cause :** Les comptes sont créés manuellement par l'administrateur. Il n'y a pas d'inscription en libre-service.

**Solution :** Contactez l'administrateur pour qu'il crée votre compte avec votre email, nom complet et un mot de passe.

---

### Q : Puis-je changer mon mot de passe ?

Oui. Sur la page de connexion, cliquez sur **"Mot de passe oublié ?"**. Vous recevrez un email contenant un lien de réinitialisation. Ce lien vous redirigera vers un formulaire où vous pourrez définir un nouveau mot de passe.

**Si vous ne recevez pas l'email :**
- Vérifiez vos spams
- Assurez-vous d'utiliser l'email exact avec lequel votre compte a été créé
- Si le problème persiste, contactez l'administrateur

---

## 2. Dashboard

### Q : Je ne vois aucune livraison sur mon Dashboard

**Causes possibles :**
- Vous n'avez pas encore soumis d'article
- Le filtre hebdo sélectionné ne correspond pas à vos livraisons
- Vous êtes connecté avec un autre compte

**Solution :** Vérifiez le sélecteur d'hebdo en haut de page. Sélectionnez "Tous" ou l'hebdo correct pour voir l'ensemble de vos livraisons.

---

### Q : Le compteur de livraisons affiche 0 alors que j'ai déjà livré

**Cause :** Le compteur est filtré par l'hebdo actuellement sélectionné. Vos livraisons sont peut-être rattachées à un autre numéro d'hebdo.

**Solution :** Changez l'hebdo dans le sélecteur pour retrouver vos livraisons passées.

---

### Q : Quel est le statut de mes livraisons ?

Actuellement, toutes les livraisons soumises ont le statut **Livré** — cela signifie que le DOCX a été généré, les fichiers uploadés sur Dropbox, et la rédaction notifiée par email. Il n'y a pas de système de brouillon : une fois le formulaire soumis, la livraison est définitive (mais modifiable ensuite).

---

## 3. Formulaire de livraison

### Q : Quel type de papier choisir ?

Chaque type correspond à un format éditorial avec une limite de signes propre :

| Type de papier | Limite de signes |
|----------------|-----------------|
| Sujet de couv | 15 000 |
| Interview 3000 | 3 000 |
| Disque de la semaine | 2 500 |
| Chroniques | 1 500 |
| Chronique Cinéma | 1 500 |
| Chronique Coup de Coeur | 2 500 |
| Frenchie | 2 500 |
| Livres et Expo | 1 500 |

En cas de doute, demandez à votre rédacteur en chef.

---

### Q : Je ne peux pas passer à l'étape suivante du formulaire

**Message affiché** : *"Ce champ est obligatoire"*

**Cause :** Un ou plusieurs champs obligatoires ne sont pas remplis.

**Solution :** Remplissez tous les champs marqués comme obligatoires (indiqués par un astérisque ou un encadré rouge). Les champs concernés peuvent être :
- Texte court (artiste, titre...)
- Zone de texte (corps de l'article, accroche...)
- Note étoiles (si requise pour ce type de papier)
- Images (si un minimum est exigé)

---

### Q : Le message "Champs obligatoires manquants (type, titre, hebdo)" s'affiche à la soumission

**Cause :** Le formulaire a été soumis sans que le type de papier, le titre ou l'hebdo soient correctement sélectionnés.

**Solution :**
- Retournez à l'étape 1 pour vérifier que le type de papier est bien sélectionné
- Vérifiez que le champ titre est rempli dans les métadonnées
- Vérifiez que l'hebdo est bien attribué (normalement automatique)

---

### Q : J'ai dépassé la limite de signes, est-ce bloquant ?

**Message affiché** : *"Dépassement de X signes"* (en rouge)

**Non, ce n'est pas bloquant.** Le compteur de signes s'affiche en rouge mais la soumission reste possible. Cependant, il est fortement recommandé de respecter la limite pour faciliter le travail de la rédaction.

---

### Q : Mes sauts de ligne et paragraphes disparaissent

**Cause :** Le système retire automatiquement les balises HTML du texte pour des raisons de sécurité.

**Ce qui est préservé :**
- Les retours à la ligne simples
- Les sauts de paragraphe (double retour à la ligne)
- Maximum 2 sauts de ligne consécutifs

**Ce qui est supprimé :**
- Les balises HTML (`<b>`, `<i>`, `<br>`, etc.)
- Les espaces insécables (`&nbsp;`) remplacés par des espaces normaux
- Les espaces multiples consécutifs (réduits à un seul)

---

### Q : Mes guillemets et apostrophes ont changé dans le DOCX

**Cause :** Le système de correction IA et de nettoyage convertit certains caractères typographiques :
- Les guillemets droits `"..."` peuvent devenir des guillemets français `« ... »`
- Les apostrophes typographiques sont normalisées

C'est un comportement attendu qui améliore la qualité typographique du texte.

---

### Q : Je ne trouve pas le type de papier dont j'ai besoin

**Cause :** Le type de papier n'a pas été créé ou a été désactivé par l'administrateur.

**Solution :** Contactez l'administrateur pour qu'il crée ou réactive le type de papier souhaité.

---

### Q : La note étoiles ne fonctionne pas / le champ étoiles est vide

**Message affiché** : *"Veuillez sélectionner une note"*

**Solution :** Cliquez sur les étoiles pour attribuer une note (de 1 à 5). Si le champ est obligatoire, vous devez sélectionner au moins 1 étoile.

---

## 4. Upload d'images

### Q : Mon image est refusée

**Message affiché** : *"Seules les images sont acceptées"* ou *"{filename}: File is larger than 25 MB"*

**Contraintes à respecter :**

| Contrainte | Limite |
|------------|--------|
| Taille max par fichier | **25 Mo** |
| Nombre max de fichiers | **10 images** par livraison |
| Formats acceptés | JPG, JPEG, PNG, WebP, GIF, HEIC, HEIF, TIFF, BMP, AVIF |
| Formats refusés | PDF, Word, vidéos, et tout fichier non-image |

**Solutions :**
- Compressez vos images si elles dépassent 25 Mo
- Convertissez les fichiers non supportés en JPG ou PNG
- Réduisez le nombre d'images si vous dépassez la limite de 10

---

### Q : Le message "{X} photo(s) minimum requise(s)" s'affiche

**Cause :** Le type de papier sélectionné exige un nombre minimum d'images.

**Solution :** Ajoutez le nombre de photos requis via la zone de dépôt (glisser-déposer ou clic pour parcourir).

---

### Q : Je veux remplacer une image déjà uploadée

**En mode création :** Supprimez l'image de la liste (clic sur la croix) puis ajoutez la nouvelle.

**En mode édition :** Les images existantes sont indiquées dans la zone de dépôt. Ajoutez de nouvelles images pour **remplacer** les anciennes. Si vous n'ajoutez rien, les images existantes sur Dropbox sont conservées.

---

### Q : L'aperçu de l'image ne s'affiche pas

**Cause :** Le navigateur n'a pas réussi à générer l'aperçu (fichier trop volumineux ou format peu courant comme HEIC/TIFF).

**Solution :** L'image sera quand même uploadée correctement même sans aperçu visible. Si vous souhaitez un aperçu, convertissez l'image en JPG ou PNG.

---

### Q : Mon navigateur rame avec beaucoup d'images

**Cause :** Chaque image génère un aperçu en mémoire. 10 fichiers de 20 Mo = 200 Mo de mémoire navigateur.

**Solution :** Réduisez la taille de vos images avant de les uploader (compresser en JPG qualité 80-90%).

---

## 5. Correction IA

### Q : La correction ne fonctionne pas / prend trop de temps

**Message affiché** : *"Correction automatique indisponible — texte original conservé"*

**Causes possibles :**
- Le service IA (Claude) met plus de **2 minutes** à répondre (timeout)
- La clé API Anthropic est invalide ou expirée
- Le texte dépasse **100 000 signes**
- Problème réseau temporaire

**Solution :**
- Patientez et réessayez après quelques minutes
- Si le texte est très long, divisez-le en sections plus courtes
- En dernier recours, vous pouvez passer l'étape de correction et soumettre le texte original

---

### Q : L'IA a fusionné ou modifié mes paragraphes

**Cause :** Le système préserve la structure de vos paragraphes via des marqueurs internes. Dans de rares cas, l'IA peut mal interpréter la structure.

**Protection automatique :** Si plus de 50% des sauts de ligne sont perdus, le système revient automatiquement à votre structure originale.

**Solution :** Si le résultat ne vous convient pas, refusez les corrections et soumettez votre texte original.

---

### Q : Puis-je corriger seulement une partie des suggestions ?

**Oui.** La correction affiche un comparatif côte à côte avec la liste des modifications. Vous pouvez accepter ou refuser chaque correction individuellement. Seules les corrections acceptées sont appliquées.

---

### Q : Quels types de corrections l'IA fait-elle ?

| Type | Ce qui est corrigé |
|------|-------------------|
| **Orthographe** | Fautes d'orthographe |
| **Grammaire** | Accords, conjugaisons, syntaxe |
| **Ponctuation** | Virgules, points, deux-points manquants ou superflus |
| **Style** | Tournures maladroites, répétitions |
| **Typographie** | Espaces insécables, guillemets français, tirets |

---

### Q : Le texte corrigé est identique à l'original

**Cause :** Votre texte ne contenait aucune erreur détectable par l'IA. La liste des corrections sera vide.

---

### Q : Mon texte est trop long pour la correction

**Message affiché** : *"Texte trop long (max 100 000 signes)"*

**Solution :** Réduisez la taille de votre texte en dessous de 100 000 caractères. Ce seuil est rarement atteint (le plus long type de papier, Sujet de couv, est limité à 15 000 signes).

---

### Q : La correction me propose un texte vide

**Message affiché** : *"Texte requis"*

**Cause :** Le champ corps de texte est vide au moment de lancer la correction.

**Solution :** Remplissez le champ de texte principal avant de demander la correction.

---

## 6. Soumission & Dropbox

### Q : La soumission échoue avec "Erreur lors de la livraison"

**Causes possibles (par ordre de fréquence) :**

1. **Problème Dropbox** : le service est temporairement indisponible ou le token a expiré
2. **Fichiers trop volumineux** : la somme de toutes les images dépasse la capacité de traitement
3. **Timeout réseau** : connexion trop lente pour uploader dans les temps (5 min max)
4. **Erreur serveur** : problème technique côté backend

**Solutions :**
- Réessayez la soumission (le système fait déjà 3 tentatives automatiques en cas d'erreur Dropbox)
- Réduisez la taille/nombre de vos images
- Vérifiez votre connexion internet
- Si le problème persiste après 2-3 tentatives, contactez l'administrateur

---

### Q : La soumission est très lente

**Cause :** La soumission implique plusieurs opérations séquentielles :
1. Génération du fichier Word (.docx)
2. Création des dossiers sur Dropbox
3. Upload du DOCX sur Dropbox
4. Upload de chaque image sur Dropbox (une par une)
5. Création des liens de partage
6. Enregistrement en base de données
7. Envoi de l'email de notification

**Temps estimé :** De 10 secondes (texte seul) à plusieurs minutes (10 images volumineuses).

**Conseil :** Ne fermez pas la page pendant la soumission. Un timeout de 5 minutes est configuré côté serveur.

---

### Q : Où sont mes fichiers sur Dropbox ?

L'arborescence suit cette structure :

```
Hebdo Delivery/
└── RSH226/                          ← Numéro d'hebdo
    ├── Interview 3000/
    │   └── Interview NomArtiste/    ← Sous-dossier par sujet
    │       ├── article.docx
    │       └── photo.jpg
    ├── Chroniques/
    │   └── VotreNom/                ← Sous-dossier par journaliste
    │       ├── chronique.docx
    │       └── image.png
    ├── Disque de la semaine/
    │   └── article.docx
    └── ...
```

**Note :** Certains types de papier (Chroniques, Livres et Expo) créent un sous-dossier à votre nom. D'autres types (Interview) créent un sous-dossier au nom du sujet.

---

### Q : Le lien Dropbox ne fonctionne pas

**Causes possibles :**
- Le lien de partage n'a pas pu être généré (erreur Dropbox)
- Le dossier a été déplacé ou supprimé sur Dropbox par un administrateur
- Problème de permissions Dropbox

**Solution :** Contactez l'administrateur. Le fichier est probablement bien uploadé même si le lien ne fonctionne pas.

---

### Q : "Erreur préparation des dossiers Dropbox" s'affiche

**Cause :** La plateforme n'arrive pas à créer la structure de dossiers sur Dropbox avant la soumission.

**Causes techniques :**
- Token Dropbox expiré
- Limite de requêtes Dropbox atteinte
- Problème réseau

**Solution :** Réessayez dans quelques secondes. Le système tente automatiquement 3 retries avec délai croissant.

---

### Q : Mon article a été livré mais la rédaction n'a pas reçu l'email

**Cause :** L'envoi d'email est **non bloquant** : si le serveur SMTP rencontre une erreur, la livraison est quand même enregistrée.

**Votre article est bien livré.** Vous pouvez partager le lien Dropbox manuellement ou prévenir la rédaction directement.

---

### Q : J'ai soumis deux fois par erreur

**Cause :** En cas d'erreur partielle (ex: Dropbox OK mais base de données KO), un retry peut créer un doublon dans Dropbox.

**Solution :** Contactez l'administrateur pour qu'il supprime la livraison en double. Les fichiers sur Dropbox devront être nettoyés manuellement.

---

## 7. Modification d'une livraison

### Q : Je ne peux pas modifier la livraison d'un collègue

**Message affiché** : *"Livraison introuvable ou non autorisée"*

**Cause :** Chaque journaliste ne peut modifier que ses propres livraisons. Seul un administrateur peut modifier les livraisons des autres.

---

### Q : Que se passe-t-il quand je modifie une livraison ?

Lors d'une modification :
- Le fichier Word (.docx) est **régénéré** avec le nouveau contenu
- Les fichiers sont **ré-uploadés** sur Dropbox (même dossier)
- La base de données est **mise à jour**
- Un nouvel email de notification est envoyé

**Attention :** Les anciennes versions du DOCX sur Dropbox sont écrasées.

---

### Q : J'ai modifié ma livraison en même temps qu'un administrateur

**Cause :** Il n'y a pas de mécanisme de verrouillage. Si deux personnes modifient la même livraison simultanément, la dernière sauvegarde écrase la précédente.

**Solution :** Coordonnez-vous avec l'administrateur avant de modifier un article qui pourrait être en cours de relecture.

---

### Q : Je ne retrouve plus ma livraison pour la modifier

**Solutions :**
- Vérifiez le filtre d'hebdo sur le Dashboard (changez pour "Tous")
- Vérifiez que vous êtes connecté avec le bon compte
- La livraison a peut-être été supprimée par un administrateur

---

## 8. Problèmes réseau & performance

### Q : "Too Many Requests" / Erreur 429

**Cause :** Vous avez dépassé la limite de **300 requêtes en 15 minutes**.

**Solution :** Attendez quelques minutes avant de réessayer. Cette limite est rarement atteinte en usage normal.

---

### Q : La page reste bloquée en chargement

**Causes possibles :**
- Connexion internet instable
- Le serveur est temporairement surchargé
- Timeout d'une opération en cours

**Solutions :**
- Rafraîchissez la page (F5 ou Cmd+R)
- Vérifiez votre connexion internet
- Réessayez dans quelques minutes
- Si le problème persiste, contactez l'administrateur

---

### Q : L'upload est très lent sur une connexion Wi-Fi

**Cause :** Les images volumineuses prennent du temps à uploader, surtout sur une connexion lente.

**Conseils :**
- Compressez vos images avant upload (qualité JPG 80-90% suffit)
- Évitez les formats non compressés (TIFF, BMP) : préférez JPG ou PNG
- Si possible, utilisez une connexion filaire pour les envois volumineux
- Ne fermez pas l'onglet pendant l'upload (timeout serveur : 5 minutes)

---

## 9. Navigateur & session

### Q : Le tutoriel d'onboarding s'affiche à chaque connexion

**Cause :** Le flag d'onboarding est stocké dans le `localStorage` de votre navigateur. Si celui-ci est vidé (nettoyage de cache, navigation privée, changement de navigateur), le tutoriel se réaffiche.

**Solution :** Complétez le tutoriel à nouveau. Il ne réapparaîtra pas tant que le localStorage n'est pas vidé.

---

### Q : Quels navigateurs sont supportés ?

| Navigateur | Support |
|-----------|---------|
| Chrome (récent) | Supporté |
| Firefox (récent) | Supporté |
| Safari (récent) | Supporté |
| Edge (récent) | Supporté |
| Mobile (iOS/Android) | Supporté |
| Internet Explorer 11 | **Non supporté** |

---

### Q : La plateforme fonctionne-t-elle sur mobile ?

**Oui**, la plateforme est accessible depuis un navigateur mobile. Cependant, l'expérience est optimisée pour un écran d'ordinateur, notamment pour :
- Le formulaire multi-étapes
- Le comparatif de correction côte à côte
- L'upload d'images (glisser-déposer non disponible sur mobile)

---

### Q : J'utilise un ordinateur partagé, y a-t-il des risques ?

**Oui.** Votre session est stockée dans le navigateur. Sur un ordinateur partagé :
- Déconnectez-vous systématiquement après utilisation
- Utilisez la navigation privée si possible
- Ne cochez pas "Se souvenir de moi" (si proposé)
- Videz le cache après utilisation

---

## 10. Référence rapide des messages d'erreur

| Message d'erreur | Cause | Action |
|-----------------|-------|--------|
| *Email ou mot de passe incorrect* | Identifiants invalides | Vérifier email/mot de passe |
| *Compte desactive* | Compte désactivé par l'admin | Contacter l'administrateur |
| *Token invalide* | Session expirée | Se reconnecter |
| *Ce champ est obligatoire* | Champ requis non rempli | Remplir le champ |
| *Champs obligatoires manquants* | Type, titre ou hebdo manquant | Vérifier formulaire complet |
| *Dépassement de X signes* | Texte trop long (avertissement) | Réduire le texte (non bloquant) |
| *Seules les images sont acceptées* | Fichier non-image uploadé | Utiliser JPG/PNG/WebP |
| *File is larger than 25 MB* | Image trop volumineuse | Compresser l'image |
| *X photo(s) minimum requise(s)* | Pas assez d'images | Ajouter les images requises |
| *Veuillez sélectionner une note* | Note étoiles requise non remplie | Cliquer sur les étoiles |
| *Texte requis* | Texte vide envoyé à la correction | Remplir le champ texte |
| *Texte trop long (max 100 000 signes)* | Texte dépasse 100k caractères | Raccourcir le texte |
| *Correction automatique indisponible* | Timeout ou erreur IA | Réessayer ou soumettre sans correction |
| *Erreur préparation des dossiers Dropbox* | Dropbox inaccessible | Réessayer dans quelques secondes |
| *Erreur lors de la livraison* | Erreur serveur à la soumission | Réessayer, puis contacter l'admin |
| *Livraison introuvable* | ID invalide ou livraison supprimée | Vérifier sur le Dashboard |
| *Livraison introuvable ou non autorisée* | Tentative de modifier la livraison d'un autre | Seul l'auteur peut modifier |
| *Hebdo introuvable* | Hebdo sélectionné n'existe plus | Rafraîchir la page |
| *Too Many Requests (429)* | Trop de requêtes en 15 min | Attendre quelques minutes |

---

## Contacts

En cas de problème non résolu par cette FAQ :

- **Problème technique** → Contactez l'administrateur de la plateforme
- **Question éditoriale** → Contactez votre rédacteur en chef
- **Problème de compte** → Contactez l'administrateur pour la création/réactivation de compte

---

*RS Hebdo Delivery — Rolling Stone France*
