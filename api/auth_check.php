<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

session_start();

if (isset($_SESSION['user_id'])) {
    http_response_code(200);
    echo json_encode(array("logged_in" => true, "username" => $_SESSION['username']));
} else {
    http_response_code(200); // OK, but not logged in
    echo json_encode(array("logged_in" => false));
}
?>