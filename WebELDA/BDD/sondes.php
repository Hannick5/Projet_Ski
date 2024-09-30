<?php
// Connexion à la base de données
$conn = pg_connect("host=localhost dbname=PDI_ELDA_new user=postgres password=postgres");

// Exécution de la requête SQL pour récupérer le GeoJSON
$sql = "SELECT fichier FROM table_sonde WHERE id = (SELECT MAX(id) FROM table_sonde)";
$result = pg_query($conn, $sql);

// Vérification que la requête SQL a réussi
if ($result !== false) {
    // Récupération des données et affichage en tant que réponse HTTP
    header('Content-Type: application/json');
    echo pg_fetch_result($result, 0);
} else {
    // Affichage d'un message d'erreur si la requête SQL a échoué
    echo "Erreur lors de l'exécution de la requête SQL";
}

// Fermeture de la connexion à la base de données
pg_close($conn);
?>