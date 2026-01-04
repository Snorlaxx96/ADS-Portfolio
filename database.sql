-- Database Creation
CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

-- 1. Tables & Indexed Queries
-- Profile Table
CREATE TABLE IF NOT EXISTS profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    bio TEXT,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    github VARCHAR(255),
    linkedin VARCHAR(255),
    career_start_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills Table (Categorized)
CREATE TABLE IF NOT EXISTS skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    category ENUM('Frontend', 'Backend', 'Database', 'Tools') NOT NULL,
    proficiency INT CHECK (proficiency BETWEEN 1 AND 100),
    is_featured BOOLEAN DEFAULT FALSE,
    -- INDEX for performance on category filtering
    INDEX idx_skill_category (category)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    tech_stack VARCHAR(255) NOT NULL, -- "PHP, MySQL, JS"
    image_url VARCHAR(255),
    project_url VARCHAR(255),
    repo_url VARCHAR(255),
    featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- INDEX for sorting and featured lookup
    INDEX idx_project_featured (featured, display_order)
);

-- Hobbies Table
CREATE TABLE IF NOT EXISTS hobbies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    icon_class VARCHAR(50), -- for fontawesome or similar
    description VARCHAR(255)
);

-- Messages Table (Contact Form)
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_name VARCHAR(100) NOT NULL,
    sender_email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- INDEX for searching primarily by email or date
    INDEX idx_messages_email (sender_email)
);

-- Users Table (Admin Authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Views
-- View to simplify fetching only featured projects for the landing page
CREATE OR REPLACE VIEW v_project_showcase AS
SELECT 
    id, 
    title, 
    description, 
    image_url, 
    project_url 
FROM projects 
WHERE featured = 1 
ORDER BY display_order ASC;

-- 3. Functions
-- Function to calculate years of experience from a start date (Advanced SQL requirement)
DROP FUNCTION IF EXISTS fn_calculate_years;
DELIMITER //
CREATE FUNCTION fn_calculate_years(start_date DATE) 
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE years INT;
    SET years = TIMESTAMPDIFF(YEAR, start_date, CURDATE());
    RETURN years;
END //
DELIMITER ;

-- 4. Stored Procedures with CTEs and Subqueries
-- Procedure to fetch all portfolio data in a structured format
DROP PROCEDURE IF EXISTS sp_get_portfolio_data;
DELIMITER //
CREATE PROCEDURE sp_get_portfolio_data()
BEGIN
    -- Using CTE (Common Table Expression) to aggregate skills by category
    WITH SkillGroups AS (
        SELECT 
            category, 
            JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name, 'level', proficiency)) as skills_json
        FROM skills
        GROUP BY category
    )
    SELECT
        (SELECT JSON_OBJECT(
            'name', name, 
            'title', title, 
            'bio', bio, 
            'exp_years', fn_calculate_years(career_start_date),
            'contacts', JSON_OBJECT('email', email, 'github', github)
        ) FROM profile LIMIT 1) as profile_data,
        
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT('category', category, 'items', skills_json)
        ) FROM SkillGroups) as skills_data,
        
        -- Subquery to fetch projects
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id, 
                'title', title, 
                'desc', description, 
                'tech', tech_stack, 
                'img', image_url,
                'link', project_url
            )
        ) FROM projects ORDER BY display_order) as projects_data,

        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', id, 'name', name, 'desc', description)
        ) FROM hobbies) as hobbies_data;
END //
DELIMITER ;

-- Procedure to safely insert a message
DROP PROCEDURE IF EXISTS sp_save_message;
DELIMITER //
CREATE PROCEDURE sp_save_message(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_message TEXT
)
BEGIN
    -- Basic validation logic could go here
    INSERT INTO messages (sender_name, sender_email, message)
    VALUES (p_name, p_email, p_message);
    
    -- Return success status
    SELECT 'Message sent successfully' as status, LAST_INSERT_ID() as message_id;
END //
DELIMITER ;

-- 5. Triggers
-- Trigger to audit project updates (simulated) or enforce data integrity
-- For this example, let's ensure the updated_at is properly handled if manual update missed it, 
-- or log it to a separate table (but we'll stick to a simple timestamp implementation here as requested)
DROP TRIGGER IF EXISTS trg_before_project_update;
DELIMITER //
CREATE TRIGGER trg_before_project_update 
BEFORE UPDATE ON projects
FOR EACH ROW 
BEGIN
    -- Performance Optimization: Only update if actual change detected (though MySQL does this often, explicit logic helps complex triggers)
    IF NEW.title <> OLD.title OR NEW.description <> OLD.description THEN
        SET NEW.updated_at = NOW();
    END IF;
END //
DELIMITER ;


-- SEED DATA (To make the portfolio usable immediately)
INSERT INTO profile (name, title, bio, email, github, linkedin) 
VALUES 
('Mhyco Giselo P. Bunao', 'Full Stack Developer', 'Passionate developer building premium web experiences.', 'alex@example.com', 'https://github.com/Snorlaxx96', 'https://linkedin.com')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO skills (name, category, proficiency, is_featured) VALUES
('PHP', 'Backend', 90, 1),
('MySQL', 'Database', 85, 1),
('JavaScript', 'Frontend', 88, 1),
('HTML/CSS', 'Frontend', 95, 1);

INSERT INTO projects (title, description, tech_stack, image_url, project_url, featured, display_order) VALUES
('Mini Project', 'A landing page for my mini project.', 'PHP, HTML, CSS', 'https://via.placeholder.com/600x400?text=Mini+Project', 'http://localhost/Mhyco_Mini_Project/landing.php', 1, 1),
('Portfolio Profile', 'My personal portfolio profile section.', 'HTML, CSS, JS, MySQL', 'https://via.placeholder.com/600x400?text=Portfolio+Profile', 'http://localhost/Portfolio/index.html#profile', 1, 2);

INSERT INTO hobbies (name, description) VALUES
('Eating', 'Foodie exploring various cuisines.'),
('Gaming', 'Strategy and RPG enthusiast.'),
('Traveling', 'Exploring new cultures and places.'),
('Work out', 'Maintaining physical fitness and discipline.');
