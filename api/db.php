<?php
class Database
{
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function getConnection()
    {
        $this->conn = null;

        // Check if running on localhost
        if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1') {
            $this->host = "localhost";
            $this->db_name = "portfolio_db";
            $this->username = "root";
            $this->password = "";
        } else {
            $this->host = "sql206.infinityfree.com";
            $this->db_name = "if0_40801881_carparking";
            $this->username = "if0_40801881";
            $this->password = "5P2fOKh11brqL";
        }

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            // Enable exceptions for errors
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>