<?php
// Headers
header("Access-Control-Allow-Origin: *"); // For development only, tighten in production
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    $username = $data->username;

    $query = "SELECT id, username, password_hash FROM users WHERE username = :username LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (password_verify($data->password, $row['password_hash'])) {
            // Password checked
            session_start();
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['username'] = $row['username'];

            http_response_code(200);
            echo json_encode(array(
                "message" => "Login successful.",
                "username" => $row['username']
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Invalid password."));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Invalid username."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>