from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_mysqldb import MySQL
from flask_cors import CORS
from dotenv import load_dotenv
import os
import cv2
import numpy as np
import face_recognition
import base64
import json

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuración
app.secret_key = os.getenv('SECRET_KEY', 'clave_secreta_por_defecto')

# Configuración MySQL
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'consulta_ciudadana')
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)

# Importar modelo después de configurar mysql
from models.user_model import UserModel
user_model = UserModel(mysql)

# ============== RUTAS PRINCIPALES ==============

@app.route('/')
def index():
    """Página de bienvenida"""
    return render_template('index.html')

@app.route('/login')
def login():
    """Página de login tradicional"""
    return render_template('login.html')

@app.route('/register')
def register():
    """Página de registro tradicional"""
    return render_template('register.html')

@app.route('/face_register')
def face_register():
    """Página de registro facial"""
    return render_template('face_register.html')

@app.route('/face_login_page')
def face_login_page():
    """Página para login con reconocimiento facial"""
    return render_template('face_login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('dashboard.html', user_name=session.get('user_name'))

# ============== API ENDPOINTS ==============

@app.route('/api/register', methods=['POST'])
def api_register():
    """Endpoint para registro tradicional"""
    try:
        data = request.json
        nombres = data.get('nombres')
        apellidos = data.get('apellidos')
        dni = data.get('dni')
        celular = data.get('celular')
        correo = data.get('correo')
        password = data.get('password')
        
        # Validaciones
        if not all([nombres, apellidos, dni, celular, correo, password]):
            return jsonify({'success': False, 'message': 'Todos los campos son requeridos'})
        
        if len(dni) != 8 or not dni.isdigit():
            return jsonify({'success': False, 'message': 'DNI debe tener 8 dígitos'})
        
        if len(celular) != 9 or not celular.isdigit():
            return jsonify({'success': False, 'message': 'Celular debe tener 9 dígitos'})
        
        # Verificar si ya existe
        if user_model.check_user_exists(dni, correo):
            return jsonify({'success': False, 'message': 'El DNI o correo ya está registrado'})
        
        # Registrar usuario
        success, message = user_model.register_user(nombres, apellidos, dni, celular, correo, password)
        
        if success:
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': message})
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/login', methods=['POST'])
def api_login():
    """Endpoint para login tradicional"""
    try:
        data = request.json
        dni = data.get('dni')
        password = data.get('password')
        
        if not dni or not password:
            return jsonify({'success': False, 'message': 'DNI y contraseña son requeridos'})
        
        success, user_data = user_model.login_user(dni, password)
        
        if success:
            session['user_id'] = user_data['id']
            session['user_name'] = f"{user_data['nombres']} {user_data['apellidos']}"
            session['user_dni'] = user_data['dni']
            session['face_login'] = False  # Indicar que fue login tradicional
            
            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': user_data
            })
        else:
            return jsonify({'success': False, 'message': user_data})
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/register_facial', methods=['POST'])
def api_register_facial():
    """Endpoint para registro con reconocimiento facial"""
    try:
        data = request.json
        image_data = data.get('image')
        dni = data.get('dni')
        nombres = data.get('nombres')
        apellidos = data.get('apellidos')
        celular = data.get('celular')
        correo = data.get('correo')
        password = data.get('password')
        
        # Decodificar imagen base64
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Detectar rostro y obtener codificación
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0:
            return jsonify({'success': False, 'message': 'No se detectó ningún rostro'})
        elif len(face_locations) > 1:
            return jsonify({'success': False, 'message': 'Se detectaron múltiples rostros'})
        
        # Obtener codificación facial
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if len(face_encodings) == 0:
            return jsonify({'success': False, 'message': 'No se pudo procesar el rostro'})
        
        facial_encoding = face_encodings[0].tolist()
        
        # Verificar si ya existe
        if user_model.check_user_exists(dni, correo):
            return jsonify({'success': False, 'message': 'El DNI o correo ya está registrado'})
        
        # Registrar usuario con datos faciales
        success, message = user_model.register_user(nombres, apellidos, dni, celular, correo, password, facial_encoding)
        
        if success:
            return jsonify({'success': True, 'message': 'Registro facial exitoso. Ahora puedes iniciar sesión con tu rostro.'})
        else:
            return jsonify({'success': False, 'message': message})
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/verify_face_only', methods=['POST'])
def api_verify_face_only():
    """Verificar solo el rostro sin necesidad de DNI - Login facial puro"""
    try:
        data = request.json
        image_data = data.get('image')
        
        # Decodificar imagen
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Procesar rostro
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0:
            return jsonify({'success': False, 'message': 'No se detectó ningún rostro'})
        elif len(face_locations) > 1:
            return jsonify({'success': False, 'message': 'Se detectaron múltiples rostros. Asegúrate de que solo aparezca tu rostro.'})
        
        # Obtener codificación del rostro capturado
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if len(face_encodings) == 0:
            return jsonify({'success': False, 'message': 'No se pudo procesar el rostro. Intenta de nuevo.'})
        
        current_face_encoding = face_encodings[0]
        
        # Buscar en todos los usuarios registrados con datos faciales
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, nombres, apellidos, dni, facial_data FROM usuarios WHERE facial_data IS NOT NULL")
        users = cur.fetchall()
        cur.close()
        
        if not users:
            return jsonify({'success': False, 'message': 'No hay usuarios registrados con reconocimiento facial. Debes registrarte primero.'})
        
        # Comparar con cada usuario
        best_match = None
        best_distance = 0.5  # Umbral más estricto para mayor seguridad
        
        for user in users:
            if user['facial_data']:
                try:
                    stored_encoding = np.array(json.loads(user['facial_data']))
                    # Calcular distancia entre rostros
                    distance = face_recognition.face_distance([stored_encoding], current_face_encoding)[0]
                    
                    print(f"Comparando con usuario {user['dni']} - Distancia: {distance}")  # Debug
                    
                    if distance < best_distance:
                        best_distance = distance
                        best_match = user
                except Exception as e:
                    print(f"Error procesando usuario {user['id']}: {e}")
                    continue
        
        if best_match and best_distance < 0.5:
            # Login exitoso
            session['user_id'] = best_match['id']
            session['user_name'] = f"{best_match['nombres']} {best_match['apellidos']}"
            session['user_dni'] = best_match['dni']
            session['face_login'] = True  # Indicar que fue login facial
            
            return jsonify({
                'success': True,
                'message': f'✅ Bienvenido {best_match["nombres"]}! Reconocimiento facial exitoso.',
                'user': {
                    'id': best_match['id'],
                    'nombres': best_match['nombres'],
                    'apellidos': best_match['apellidos'],
                    'dni': best_match['dni']
                }
            })
        else:
            return jsonify({'success': False, 'message': '❌ Rostro no reconocido. Asegúrate de haberte registrado con reconocimiento facial.'})
            
    except Exception as e:
        print(f"Error en verify_face_only: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/api/check_face_registered', methods=['POST'])
def api_check_face_registered():
    """Verificar si un usuario ya tiene registro facial antes de registrar"""
    try:
        data = request.json
        image_data = data.get('image')
        
        # Decodificar imagen
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Procesar rostro
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0:
            return jsonify({'success': False, 'message': 'No se detectó ningún rostro'})
        
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if len(face_encodings) == 0:
            return jsonify({'success': False, 'message': 'No se pudo procesar el rostro'})
        
        current_face_encoding = face_encodings[0]
        
        # Verificar si ya existe este rostro en la BD
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, nombres, apellidos, dni, facial_data FROM usuarios WHERE facial_data IS NOT NULL")
        users = cur.fetchall()
        cur.close()
        
        for user in users:
            if user['facial_data']:
                stored_encoding = np.array(json.loads(user['facial_data']))
                distance = face_recognition.face_distance([stored_encoding], current_face_encoding)[0]
                
                if distance < 0.5:  # Mismo umbral
                    return jsonify({
                        'success': False, 
                        'message': f'⚠️ Este rostro ya está registrado con el DNI {user["dni"]}. Por favor, inicia sesión con tu rostro.'
                    })
        
        # Guardar temporalmente la codificación facial en la sesión para usarla en el registro
        session['temp_facial_encoding'] = current_face_encoding.tolist()
        
        return jsonify({'success': True, 'message': 'Rostro válido. Puedes proceder con el registro.'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/check_session')
def check_session():
    """Verificar si hay sesión activa"""
    if 'user_id' in session:
        return jsonify({'logged_in': True, 'user_name': session.get('user_name')})
    return jsonify({'logged_in': False})

@app.route('/logout')
def logout():
    """Cerrar sesión"""
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)