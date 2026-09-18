-- =============================================================================
-- TRUEINSPECT - Database Schema
-- Database: trueinspect_db
-- Engine: InnoDB
-- Character Set: utf8mb4
-- =============================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS trueinspect_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE trueinspect_db;

-- 2. Users Table
-- Supports INSPECTOR and MANAGER roles. Passwords stored as bcrypt hashes.
-- No phone number column as strictly specified in Requirement 21.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('INSPECTOR', 'MANAGER') NOT NULL DEFAULT 'INSPECTOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Inspections Table
-- Connects user_id to users.id
CREATE TABLE IF NOT EXISTS inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    vehicle_make VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    inspection_date DATE NOT NULL,
    status ENUM('CREATED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inspections_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_inspections_user (user_id),
    INDEX idx_inspections_reg (registration_number),
    INDEX idx_inspections_status (status)
) ENGINE=InnoDB;

-- 4. Inspection Images Table
-- Stores metadata only; binary files are kept on the server filesystem.
CREATE TABLE IF NOT EXISTS inspection_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    vehicle_area ENUM(
        'Front',
        'Rear',
        'Left Side',
        'Right Side',
        'Front Left',
        'Front Right',
        'Rear Left',
        'Rear Right',
        'Interior',
        'Other'
    ) NOT NULL DEFAULT 'Other',
    source ENUM('CAMERA', 'UPLOAD') NOT NULL DEFAULT 'UPLOAD',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_images_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    INDEX idx_images_inspection (inspection_id)
) ENGINE=InnoDB;

-- 5. Defects Table
-- Confidence is NULLable to avoid fabricating confidence scores.
CREATE TABLE IF NOT EXISTS defects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    image_id INT NULL,
    defect_type VARCHAR(50) NOT NULL,
    component VARCHAR(100) NOT NULL,
    severity ENUM('Minor', 'Moderate', 'Major') NOT NULL,
    confidence DECIMAL(5, 4) NULL,
    bbox_x INT NULL,
    bbox_y INT NULL,
    bbox_width INT NULL,
    bbox_height INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_defects_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_defects_image FOREIGN KEY (image_id) REFERENCES inspection_images(id) ON DELETE SET NULL,
    INDEX idx_defects_inspection (inspection_id),
    INDEX idx_defects_image (image_id)
) ENGINE=InnoDB;

-- 6. Repair Cost Master Table
-- Configurable repair cost rules. Prices in INR (₹).
CREATE TABLE IF NOT EXISTS repair_cost_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    component VARCHAR(100) NOT NULL,
    defect_type VARCHAR(50) NOT NULL,
    severity ENUM('Minor', 'Moderate', 'Major') NOT NULL,
    action VARCHAR(255) NOT NULL,
    min_cost DECIMAL(10, 2) NOT NULL,
    max_cost DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cost_lookup (component, defect_type, severity, active)
) ENGINE=InnoDB;

-- 7. Inspection Estimates Table
-- Stores historical snapshots of applied cost rules for historical integrity.
CREATE TABLE IF NOT EXISTS inspection_estimates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    defect_id INT NOT NULL,
    cost_rule_id INT NULL,
    min_cost DECIMAL(10, 2) NOT NULL,
    max_cost DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_estimates_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_estimates_defect FOREIGN KEY (defect_id) REFERENCES defects(id) ON DELETE CASCADE,
    CONSTRAINT fk_estimates_cost_rule FOREIGN KEY (cost_rule_id) REFERENCES repair_cost_master(id) ON DELETE SET NULL,
    INDEX idx_estimates_inspection (inspection_id),
    INDEX idx_estimates_defect (defect_id)
) ENGINE=InnoDB;

-- 8. Reports Table
-- Persists generated report summary and condition assessment
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL UNIQUE,
    summary_json JSON NULL,
    condition_assessment VARCHAR(100) NOT NULL,
    min_total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    max_total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_inspection FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    INDEX idx_reports_inspection (inspection_id)
) ENGINE=InnoDB;
