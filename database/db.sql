CREATE DATABASE consulta_ciudadana;

USE consulta_ciudadana;

CREATE TABLE usuarios (
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

CREATE TABLE tramites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tipo_tramite VARCHAR(100),
    descripcion TEXT,
    estado VARCHAR(50),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
);

CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tramite_id INT,
    fecha_cita DATE,
    hora TIME,
    lugar VARCHAR(255),
    tipo_cita VARCHAR(50),
    datos_formulario LONGTEXT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id),

    FOREIGN KEY (tramite_id)
    REFERENCES tramites(id)
);


CREATE TABLE citas_partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,

    anio_inscripcion VARCHAR(20),
    mes_inscripcion VARCHAR(50),

    cod_sexo VARCHAR(50),
    cod_hecho VARCHAR(100),

    cod_inscripcion_1 VARCHAR(100),
    cod_inscripcion_2 VARCHAR(100),

    ubigeo_l VARCHAR(20),
    ubigeo_inei_l VARCHAR(20),

    depa_cont_l VARCHAR(100),
    prov_pais_l VARCHAR(100),

    dist_ciud_l VARCHAR(100),
    nacional_l VARCHAR(100),

    cantidad VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
);

CREATE TABLE citas_padrones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,

    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    ubigeo VARCHAR(20),

    tipo VARCHAR(100),
    fecha_solicitud VARCHAR(20),

    razon_social VARCHAR(255),
    numero_resolucion VARCHAR(100),

    fecha_emision VARCHAR(20),
    fecha_vencimiento VARCHAR(20),

    placa VARCHAR(50),
    ano_fabricacion VARCHAR(20),

    peso_bruto VARCHAR(50),
    numero_tuc_mtc VARCHAR(100),

    tipo_carga VARCHAR(100),
    fecha_corte VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
);

CREATE TABLE citas_licencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,

    tipo_resolucion VARCHAR(255),
    expediente VARCHAR(100),
    anio_expediente VARCHAR(10),
    resolucion VARCHAR(100),
    autorizacion VARCHAR(100),

    fecha_solicitud VARCHAR(20),
    fecha_otorgamiento VARCHAR(20),
    fecha_entrega VARCHAR(20),

    ruc VARCHAR(20),
    area VARCHAR(50),
    costo_tramite VARCHAR(50),

    riesgoddcc VARCHAR(100),
    tipinsp VARCHAR(100),

    fecha_inspeccion VARCHAR(20),
    resultado_itse VARCHAR(100),
    estado_vigencia VARCHAR(100),

    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),

    ubigeo VARCHAR(20),
    fecha_corte VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(usuario_id)
    REFERENCES usuarios(id)
);


ALTER TABLE citas_partidas
ADD fecha_cita DATE,
ADD hora_cita VARCHAR(10),
ADD lugar VARCHAR(100);

ALTER TABLE citas_padrones
ADD fecha_cita DATE,
ADD hora_cita VARCHAR(10),
ADD lugar VARCHAR(100);

ALTER TABLE citas_licencias
ADD fecha_cita DATE,
ADD hora_cita VARCHAR(10),
ADD lugar VARCHAR(100);