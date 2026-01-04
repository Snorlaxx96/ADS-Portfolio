<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

session_start();

// Strict Auth Check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Unauthorized"));
    exit();
}

include_once 'db.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->action)) {
    http_response_code(400);
    echo json_encode(array("message" => "Action required"));
    exit();
}

try {
    switch ($data->action) {

        // --- PROFILE ---
        case 'update_profile':
            $query = "UPDATE profile SET name = :name, title = :title, bio = :bio, email = :email, github = :github, linkedin = :linkedin WHERE id = 1"; // Single profile assumption
            $stmt = $db->prepare($query);
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':title', $data->title);
            $stmt->bindParam(':bio', $data->bio);
            $stmt->bindParam(':email', $data->email);
            $stmt->bindParam(':github', $data->github);
            $stmt->bindParam(':linkedin', $data->linkedin);
            $stmt->execute();
            echo json_encode(array("message" => "Profile updated"));
            break;

        // --- SKILLS ---
        case 'add_skill':
            $query = "INSERT INTO skills (name, category, proficiency) VALUES (:name, :category, :proficiency)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':category', $data->category);
            $stmt->bindParam(':proficiency', $data->proficiency);
            $stmt->execute();
            echo json_encode(array("message" => "Skill added"));
            break;

        case 'delete_skill':
            $query = "DELETE FROM skills WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data->id);
            $stmt->execute();
            echo json_encode(array("message" => "Skill deleted"));
            break;

        // --- PROJECTS ---
        case 'add_project':
            $query = "INSERT INTO projects (title, description, tech_stack, image_url, project_url, display_order) VALUES (:title, :description, :tech, :img, :link, 1)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':title', $data->title);
            $stmt->bindParam(':description', $data->desc);
            $stmt->bindParam(':tech', $data->tech);
            $stmt->bindParam(':img', $data->img);
            $stmt->bindParam(':link', $data->link);
            $stmt->execute();
            echo json_encode(array("message" => "Project added"));
            break;

        case 'delete_project':
            $query = "DELETE FROM projects WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data->id);
            $stmt->execute();
            echo json_encode(array("message" => "Project deleted"));
            break;

        // --- HOBBIES ---
        case 'add_hobby':
            $query = "INSERT INTO hobbies (name, description) VALUES (:name, :desc)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':desc', $data->desc);
            $stmt->execute();
            echo json_encode(array("message" => "Hobby added"));
            break;

        case 'delete_hobby':
            $query = "DELETE FROM hobbies WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data->id);
            $stmt->execute();
            echo json_encode(array("message" => "Hobby deleted"));
            break;

        default:
            http_response_code(400);
            echo json_encode(array("message" => "Invalid action"));
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $e->getMessage()));
}
?>