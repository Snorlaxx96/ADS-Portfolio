<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Fetch all portfolio data using the Stored Procedure with subqueries/CTEs inside
    // This demonstrates: Stored Procedures, CTEs, Subqueries, Views (if used inside SP), Functions (if used)
    try {
        $query = "CALL sp_get_portfolio_data()";
        $stmt = $db->prepare($query);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // decode JSON strings coming from the DB (since we used JSON_OBJECT/ARRAYAGG)
        // Note: MySQL returns them as strings, so we might need to parse them if we want to combine them in PHP, 
        // or just return the raw row if it's already a single JSON object. 
        // Our SP returns multiple columns each containing JSON.

        $response = [
            'profile' => json_decode($row['profile_data']),
            'skills' => json_decode($row['skills_data']),
            'projects' => json_decode($row['projects_data']),
            'hobbies' => json_decode($row['hobbies_data'])
        ];

        echo json_encode($response);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Error fetching data.", "error" => $e->getMessage()]);
    }
} elseif ($method == 'POST') {
    // Handle Contact Form
    // Expecting JSON input
    $data = json_decode(file_get_contents("php://input"));

    if (
        !empty($data->name) &&
        !empty($data->email) &&
        !empty($data->message)
    ) {
        try {
            // Use Stored Procedure for insertion to demonstrate usage
            $query = "CALL sp_save_message(:name, :email, :message)";
            $stmt = $db->prepare($query);

            // Sanitize (basic) - though PDO binding handles SQL injection
            $name = htmlspecialchars(strip_tags($data->name));
            $email = htmlspecialchars(strip_tags($data->email));
            $message = htmlspecialchars(strip_tags($data->message));

            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":message", $message);

            if ($stmt->execute()) {
                // Send Email
                $to = "giselobunao@gmail.com";
                $subject = "Portfolio Contact: " . $name;
                $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";
                $headers = "From: noreply@portfolio.local";

                // Attempt to send email (suppress warning if Xampp not configured)
                @mail($to, $subject, $body, $headers);

                http_response_code(201);
                echo json_encode(["message" => "Message sent successfully."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to send message."]);
            }
        } catch (Exception $e) {
            http_response_code(503);
            echo json_encode(["message" => "Unable to send message.", "error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>