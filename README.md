# PoE2 Stat Compare

Application locale pour comparer les stats de ton equipement Path of Exile 2 avec les stats d'un build cible, par exemple depuis Mobalytics.

## Utilisation

1. Ouvre `index.html` dans ton navigateur.
2. Ajoute ou selectionne un objet dans la colonne Equipement.
3. Colle le texte de l'objet, puis utilise `Analyser`.
4. Colle les stats du build Mobalytics dans Build cible, puis utilise `Analyser`.
5. Lis les manques dans le tableau Comparaison.

Les donnees sont sauvegardees automatiquement dans le navigateur. Les boutons du haut permettent de charger un exemple, exporter, importer ou reinitialiser.

Tu peux aussi importer un build cible avec le bouton `BUILD`. Il accepte un fichier `.build` ou un `.zip` contenant plusieurs fichiers `.build`, comme les exports de build Mobalytics.

## Publication GitHub Pages

Avec GitHub Desktop :

1. `File` > `Add local repository`.
2. Choisis ce dossier : `C:\Users\noahg\Documents\POE2`.
3. Si GitHub Desktop propose de creer un depot, accepte.
4. Clique `Publish repository`.
5. Garde le nom `poe2-stat-compare`.
6. Laisse le depot en public si tu veux utiliser GitHub Pages gratuitement.
7. Apres publication, va dans l'onglet `Actions` du depot GitHub et attends la fin de `Deploy GitHub Pages`.

L'adresse du site sera affichee dans le resultat de l'action. Elle ressemble a :

`https://ton-nom.github.io/poe2-stat-compare/`
