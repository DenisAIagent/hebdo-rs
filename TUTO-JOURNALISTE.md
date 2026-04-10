# RS Hebdo Delivery — Guide du journaliste

> Tutoriel complet pour livrer vos articles via la plateforme RS Hebdo Delivery.

---

## Table des matières

1. [Premiers pas](#1-premiers-pas)
2. [Le Dashboard](#2-le-dashboard)
3. [Livrer un article](#3-livrer-un-article)
4. [La correction IA](#4-la-correction-ia)
5. [Modifier une livraison](#5-modifier-une-livraison)
6. [FAQ & dépannage](#6-faq--dépannage)

---

## User Stories

Chaque fonctionnalité est décrite sous forme de user story pour vous aider à comprendre ce que vous pouvez faire sur la plateforme.

---

### 1. Premiers pas

#### US-01 — Se connecter à la plateforme

> **En tant que** journaliste,
> **je veux** me connecter avec mon email et mon mot de passe,
> **afin d'** accéder à mon espace de livraison.

**Comment faire :**

1. Rendez-vous sur l'URL de la plateforme.
2. Saisissez votre **email** et votre **mot de passe** (fournis par l'administrateur).
3. Cliquez sur **Se connecter**.
4. Vous êtes redirigé vers votre Dashboard.

> Si vous n'avez pas encore de compte, contactez votre administrateur pour qu'il en crée un.

---

#### US-02 — Découvrir la plateforme (Onboarding)

> **En tant que** nouveau journaliste,
> **je veux** suivre un tutoriel interactif à ma première connexion,
> **afin de** comprendre rapidement le fonctionnement de la plateforme.

**Comment faire :**

1. Lors de votre première connexion, un tutoriel en **5 étapes** s'affiche automatiquement.
2. Il couvre : le Dashboard, le formulaire de livraison, l'upload d'images, la correction IA et l'intégration Dropbox.
3. Naviguez entre les étapes avec les boutons **Suivant** / **Précédent**.
4. Une fois terminé, le tutoriel ne s'affichera plus.

---

### 2. Le Dashboard

#### US-03 — Consulter mes livraisons

> **En tant que** journaliste,
> **je veux** voir la liste de toutes mes livraisons,
> **afin de** suivre l'état de mes articles soumis.

**Comment faire :**

1. Le Dashboard s'affiche dès la connexion.
2. Vous voyez un **message de bienvenue** avec votre nom.
3. Un **compteur** indique le nombre total de livraisons pour l'hebdo en cours.
4. La liste affiche pour chaque livraison :
   - Le **titre** de l'article
   - Le **type de papier** (Interview, Chronique, etc.)
   - La **date** de soumission
   - Le **statut** (brouillon, corrigé, livré)
5. Des boutons permettent de **voir** ou **modifier** chaque livraison.

---

#### US-04 — Filtrer mes livraisons par hebdo

> **En tant que** journaliste,
> **je veux** filtrer mes livraisons par numéro d'hebdo,
> **afin de** retrouver facilement les articles d'une semaine précise.

**Comment faire :**

1. Sur le Dashboard, utilisez le **sélecteur d'hebdo** (menu déroulant).
2. Choisissez le numéro/label de l'hebdo souhaité (ex: RSH226).
3. La liste et le compteur se mettent à jour automatiquement.

---

#### US-05 — Lancer une nouvelle livraison

> **En tant que** journaliste,
> **je veux** accéder rapidement au formulaire de livraison,
> **afin de** soumettre un nouvel article.

**Comment faire :**

1. Sur le Dashboard, cliquez sur le bouton **"Nouvelle livraison"**.
2. Vous êtes redirigé vers le formulaire en 4 étapes.

---

### 3. Livrer un article

#### US-06 — Choisir le type de papier

> **En tant que** journaliste,
> **je veux** sélectionner le type de papier que je livre,
> **afin que** le formulaire s'adapte aux champs requis pour ce format.

**Comment faire :**

1. **Étape 1** du formulaire : une liste de types de papier s'affiche.
2. Les types disponibles sont par exemple :
   - **Sujet de couv** (15 000 signes)
   - **Interview 3000** (3 000 signes)
   - **Disque de la semaine** (2 500 signes)
   - **Chroniques** (1 500 signes)
   - **Chronique Cinéma** (1 500 signes)
   - **Chronique Coup de Coeur** (2 500 signes)
   - **Frenchie** (2 500 signes)
   - **Livres et Expo** (1 500 signes)
3. Cliquez sur le type correspondant à votre article.
4. Le nombre de **signes maximum** est affiché pour chaque type.

---

#### US-07 — Remplir les champs de contenu

> **En tant que** journaliste,
> **je veux** remplir les champs spécifiques à mon type de papier (artiste, titre, corps, accroche...),
> **afin de** fournir toutes les informations nécessaires à la publication.

**Comment faire :**

1. **Étape 2** du formulaire : les champs s'affichent dynamiquement selon le type choisi.
2. Les types de champs possibles :
   - **Texte court** : artiste, album, titre...
   - **Zone de texte** : corps de l'article, accroche, chapô, description...
   - **URL** : lien digital, lien source...
   - **Note étoiles** : notation de 1 à 5 (★★★★☆)
   - **Images** : zone de dépôt pour vos photos
3. Les champs **obligatoires** sont marqués.
4. Un **compteur de signes** en temps réel vous indique où vous en êtes par rapport à la limite.

---

#### US-08 — Uploader des images

> **En tant que** journaliste,
> **je veux** joindre des images à ma livraison,
> **afin qu'** elles accompagnent mon article.

**Comment faire :**

1. Dans l'étape 2, localisez la zone **Images**.
2. **Glissez-déposez** vos fichiers dans la zone ou cliquez pour parcourir votre ordinateur.
3. Vous pouvez ajouter **jusqu'à 10 images**.
4. Chaque fichier ne doit pas dépasser **25 Mo**.
5. Seuls les formats image sont acceptés (JPG, PNG, etc.).
6. Les images seront uploadées automatiquement sur Dropbox lors de la soumission.

---

#### US-09 — Corriger mon texte avec l'IA

> **En tant que** journaliste,
> **je veux** soumettre mon texte à une correction automatique par IA,
> **afin de** corriger les fautes d'orthographe, grammaire et typographie avant livraison.

**Comment faire :**

1. **Étape 3** du formulaire : cliquez sur **"Corriger le texte"**.
2. L'IA (Claude) analyse votre texte et propose des corrections.
3. Un **comparatif côte à côte** s'affiche :
   - À gauche : votre texte **original**
   - À droite : le texte **corrigé**
4. La liste des **corrections** est détaillée avec :
   - Le **type** (orthographe, grammaire, ponctuation, style, typographie)
   - L'**explication** de chaque correction
5. Vous pouvez **accepter** ou **refuser** les corrections proposées.
6. Le compteur de signes est mis à jour après correction.

> La correction préserve la structure de vos paragraphes. Aucun paragraphe ne sera fusionné.

---

#### US-10 — Relire et soumettre ma livraison

> **En tant que** journaliste,
> **je veux** relire un récapitulatif complet avant de soumettre,
> **afin de** m'assurer que tout est correct.

**Comment faire :**

1. **Étape 4** du formulaire : un récapitulatif complet s'affiche.
2. Vous pouvez vérifier :
   - Les **métadonnées** (artiste, titre, type de papier...)
   - Le **texte** (original ou corrigé)
   - Le **nombre de signes**
   - Les **images** jointes
3. Un **lien vers le dossier Dropbox** est visible.
4. Cliquez sur **"Livrer"** pour soumettre définitivement.
5. La plateforme effectue automatiquement :
   - La **génération du fichier Word** (.docx) formaté
   - L'**upload sur Dropbox** (document + images)
   - La **notification par email** à la rédaction
   - L'**enregistrement** dans la base de données

---

#### US-11 — Recevoir la confirmation de livraison

> **En tant que** journaliste,
> **je veux** recevoir une confirmation après soumission,
> **afin de** savoir que ma livraison a bien été prise en compte.

**Ce qui se passe :**

1. Après soumission, un **message de succès** s'affiche.
2. Votre livraison apparaît dans le Dashboard avec le statut **"livré"**.
3. Le **lien Dropbox** vers votre dossier est accessible.
4. La rédaction reçoit un **email de notification** contenant :
   - Votre nom
   - Le type de papier
   - Le titre de l'article
   - Le numéro d'hebdo
   - Le nombre de signes
   - Le lien vers le dossier Dropbox

---

### 4. La correction IA

#### US-12 — Comprendre les types de corrections

> **En tant que** journaliste,
> **je veux** comprendre les différents types de corrections proposées,
> **afin de** décider lesquelles accepter.

**Types de corrections :**

| Type | Description | Exemple |
|------|-------------|---------|
| **Orthographe** | Fautes d'orthographe | "language" → "langage" |
| **Grammaire** | Accords, conjugaisons, syntaxe | "les album" → "les albums" |
| **Ponctuation** | Virgules, points, deux-points | Ajout d'une virgule manquante |
| **Style** | Tournures maladroites, répétitions | Reformulation d'une phrase |
| **Typographie** | Espaces insécables, guillemets français | "..." → « ... » |

---

#### US-13 — Accepter ou refuser les corrections individuellement

> **En tant que** journaliste,
> **je veux** choisir quelles corrections appliquer,
> **afin de** garder le contrôle éditorial sur mon texte.

**Comment faire :**

1. Dans l'étape de correction, chaque modification est listée.
2. Vous voyez l'**avant/après** pour chaque correction.
3. Vous pouvez **accepter** les corrections qui vous conviennent.
4. Vous pouvez **refuser** celles que vous souhaitez ignorer (choix éditoriaux, style volontaire...).
5. Le texte final reflète uniquement les corrections acceptées.

---

### 5. Modifier une livraison

#### US-14 — Modifier un article déjà livré

> **En tant que** journaliste,
> **je veux** modifier une livraison existante,
> **afin de** corriger ou mettre à jour mon article après soumission.

**Comment faire :**

1. Sur le Dashboard, repérez la livraison à modifier.
2. Cliquez sur l'icône **Modifier** (crayon).
3. Le formulaire s'ouvre avec vos données **pré-remplies**.
4. Modifiez les champs souhaités (texte, images, métadonnées...).
5. Vous pouvez relancer une **correction IA** sur le texte modifié.
6. Cliquez sur **"Livrer"** pour enregistrer les modifications.
7. Le fichier Word est **régénéré** et **ré-uploadé** sur Dropbox.

---

#### US-15 — Consulter une livraison en lecture seule

> **En tant que** journaliste,
> **je veux** consulter le détail d'une livraison passée,
> **afin de** vérifier ce qui a été soumis.

**Comment faire :**

1. Sur le Dashboard, cliquez sur l'icône **Voir** (oeil) d'une livraison.
2. Les détails complets s'affichent : titre, type, contenu, statut, date, lien Dropbox.

---

### 6. FAQ & dépannage

#### US-16 — Retrouver mon dossier Dropbox

> **En tant que** journaliste,
> **je veux** accéder au dossier Dropbox de ma livraison,
> **afin de** vérifier que mes fichiers sont bien uploadés.

**Comment faire :**

1. Après une livraison, le **lien Dropbox** est affiché dans la confirmation.
2. Vous pouvez aussi le retrouver en **consultant** la livraison depuis le Dashboard.
3. L'arborescence Dropbox est organisée ainsi :
   ```
   Hebdo Delivery/
   └── RSH226/
       ├── Interview 3000/
       │   └── votre-article.docx
       ├── Chroniques/
       │   └── VotreNom/
       │       ├── votre-chronique.docx
       │       └── photo.jpg
       └── ...
   ```

---

#### US-17 — Comprendre les statuts de livraison

> **En tant que** journaliste,
> **je veux** comprendre les différents statuts de mes articles,
> **afin de** savoir où en est chaque livraison.

| Statut | Signification |
|--------|---------------|
| **Brouillon** | L'article est en cours de rédaction, pas encore soumis |
| **Corrigé** | Le texte a été corrigé par l'IA mais pas encore livré |
| **Livré** | L'article a été soumis avec succès (DOCX généré, uploadé sur Dropbox, rédaction notifiée) |

---

#### US-18 — Gérer les erreurs courantes

> **En tant que** journaliste,
> **je veux** savoir quoi faire en cas de problème,
> **afin de** ne pas bloquer ma livraison.

| Problème | Solution |
|----------|----------|
| **Connexion impossible** | Vérifiez email/mot de passe. Contactez l'admin si le problème persiste. |
| **Image trop lourde** | Réduisez la taille (max 25 Mo par fichier). |
| **Trop d'images** | Maximum 10 images par livraison. |
| **Correction IA lente** | La correction peut prendre jusqu'à 2 minutes pour les longs textes. Patientez. |
| **Dépassement de signes** | Réduisez votre texte pour respecter la limite du type de papier. |
| **Erreur à la soumission** | Réessayez. Si le problème persiste, contactez l'administrateur. |

---

## Récapitulatif du parcours journaliste

```
Connexion
    │
    ▼
Dashboard ◄──────────────────────┐
    │                            │
    ▼                            │
Nouvelle livraison               │
    │                            │
    ▼                            │
Étape 1 — Choix du type          │
    │                            │
    ▼                            │
Étape 2 — Rédaction + images     │
    │                            │
    ▼                            │
Étape 3 — Correction IA         │
    │                            │
    ▼                            │
Étape 4 — Relecture & soumission │
    │                            │
    ▼                            │
Confirmation ─────────────────────┘
    │
    ▼
Dropbox (DOCX + images)
    │
    ▼
Email notification → Rédaction
```

---

*RS Hebdo Delivery — Rolling Stone France*
