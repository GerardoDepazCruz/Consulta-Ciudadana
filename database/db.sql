-- Crear base de datos
CREATE DATABASE IF NOT EXISTS consulta_ciudadana;
USE consulta_ciudadana;

ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR(255) DEFAULT 'default.png';

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    dni VARCHAR(8) UNIQUE NOT NULL,
    celular VARCHAR(9) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    facial_data TEXT,  -- Almacena la codificación facial
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de tokens (para mantener sesión)
CREATE TABLE IF NOT EXISTS user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de Trámites (Registra el progreso de las licencias, partidas, etc.)
CREATE TABLE tramites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    expediente VARCHAR(50) UNIQUE NOT NULL,
    tipo_tramite VARCHAR(100) NOT NULL,
    estado VARCHAR(50) DEFAULT 'En Evaluación',
    detalle TEXT,
    fecha_inicio DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de Citas (Registra el horario presencial reservado y lo vincula al trámite)
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tramite_id INT, 
    tipo_tramite VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    hora VARCHAR(20) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Programada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE CASCADE
);

-- Insertar usuario de prueba
INSERT INTO usuarios (nombres, apellidos, dni, celular, correo, password) 
VALUES ('Admin', 'Prueba', '12345678', '987654321', 'admin@test.com', 'admin123');
-- Nota: En producción usar hash de contraseña