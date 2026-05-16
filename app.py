from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_mysqldb import MySQL
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random
import os
import cv2
import numpy as np
# import face_recognition  # Comentar hasta instalar dlib
import base64
import json
from werkzeug.utils import secure_filename # AGREGADO PARA LAS FOTOS

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

# CONFIGURACIÓN PARA SUBIR FOTOS DE PERFIL
UPLOAD_FOLDER = os.path.join('static', 'uploads', 'perfiles')
os.makedirs(UPLOAD_FOLDER, exist_ok=True) # Crea la carpeta si no existe
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

mysql = MySQL(app)

from models.user_model import UserModel
user_model = UserModel(mysql)

# ============== RUTAS PRINCIPALES ==============

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/face_register')
def face_register():
    return render_template('face_register.html')

@app.route('/face_login_page')
def face_login_page():
    return render_template('face_login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('dashboard.html', user_name=session.get('user_name'))

# ============== RUTAS DEL SISTEMA MUNICIPAL (VISTAS) ==============

@app.route('/mi-perfil')
def mi_perfil():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session.get('user_id')
    cur = mysql.connection.cursor()
    # MODIFICADO: Ahora también seleccionamos 'foto_perfil'
    cur.execute("SELECT nombres, apellidos, dni, celular, correo, foto_perfil FROM usuarios WHERE id = %s", (user_id,))
    usuario = cur.fetchone()
    cur.close()
    
    return render_template('perfil.html', datos=usuario)

@app.route('/padron')
def padron():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('padron.html')

@app.route('/licencias')
def licencias():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('licencias.html')

@app.route('/partidas')
def partidas():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('partidas.html')

@app.route('/mis-tramites')
def mis_tramites():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session.get('user_id')
    cur = mysql.connection.cursor()
    cur.execute("SELECT expediente, tipo_tramite, estado, detalle, fecha_inicio FROM tramites WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    tramites_bd = cur.fetchall()
    cur.close()
    
    return render_template('mis_tramites.html', tramites=tramites_bd)

@app.route('/citas')
def citas():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session.get('user_id')
    cur = mysql.connection.cursor()
    cur.execute("SELECT id, tipo_tramite, fecha, hora, estado FROM citas WHERE user_id = %s ORDER BY fecha ASC", (user_id,))
    citas_bd = cur.fetchall()
    cur.close()
    
    return render_template('citas.html', citas=citas_bd)

# ============== ENDPOINTS API PARA FECHAS Y RESERVAS ==============

@app.route('/api/fechas-disponibles', methods=['GET'])
def api_fechas_disponibles():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
        
    dias_es = {0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves', 4: 'Viernes', 5: 'Sábado', 6: 'Domingo'}
    meses_es = {1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'}

    fechas = []
    fecha_actual = datetime.now()
    dias_agregados = 0
    
    cur = mysql.connection.cursor()
    cur.execute("SELECT fecha, hora FROM citas WHERE estado = 'Programada'")
    citas_ocupadas = cur.fetchall()
    cur.close()
    
    ocupados_reales = set([f"{str(c['fecha'])}|{c['hora']}" for c in citas_ocupadas])

    while dias_agregados < 5:
        fecha_actual += timedelta(days=1)
        if fecha_actual.weekday() != 6: 
            
            nombre_dia = dias_es[fecha_actual.weekday()]
            nombre_mes = meses_es[fecha_actual.month]
            fecha_db = fecha_actual.strftime("%Y-%m-%d")
            fecha_mostrar = f"{nombre_dia}, {fecha_actual.day} de {nombre_mes}"
            
            horarios_base = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]
            horarios_final = []

            for h in horarios_base:
                clave_horario = f"{fecha_db}|{h}"
                choque_real = clave_horario in ocupados_reales
                choque_simulado = random.random() < 0.25 
                esta_disponible = not (choque_real or choque_simulado)

                horarios_final.append({
                    "hora": h,
                    "disponible": esta_disponible
                })

            fechas.append({
                "fecha": fecha_db,
                "fecha_mostrar": fecha_mostrar,
                "horarios": horarios_final
            })
            dias_agregados += 1
            
    return jsonify({'success': True, 'datos': fechas})

@app.route('/api/agendar', methods=['POST'])
def api_agendar_cita():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'No autorizado.'}), 401
        
    try:
        data = request.json
        tipo_tramite = data.get('tramite')
        fecha = data.get('fecha')
        hora = data.get('hora')
        user_id = session.get('user_id')
        
        if not all([tipo_tramite, fecha, hora]):
            return jsonify({'success': False, 'message': 'Faltan datos para agendar.'})
            
        expediente = f"EXP-{datetime.now().year}-{random.randint(10000, 99999)}"
        fecha_inicio = datetime.now().strftime("%Y-%m-%d")
        detalle = f"Solicitud registrada. Pendiente de atención en ventanilla el día {fecha} a las {hora}."
        
        cur = mysql.connection.cursor()
        
        cur.execute("""
            INSERT INTO tramites (user_id, expediente, tipo_tramite, estado, detalle, fecha_inicio)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, expediente, tipo_tramite, 'En Evaluación', detalle, fecha_inicio))
        
        tramite_id = cur.lastrowid
        
        cur.execute("""
            INSERT INTO citas (user_id, tramite_id, tipo_tramite, fecha, hora, estado)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, tramite_id, tipo_tramite, fecha, hora, 'Programada'))
        
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'success': True, 'message': 'Cita y trámite registrados.', 'expediente': expediente})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/cancelar-cita/<int:cita_id>', methods=['POST'])
def api_cancelar_cita(cita_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'No autorizado.'}), 401
        
    user_id = session.get('user_id')
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT tramite_id FROM citas WHERE id = %s AND user_id = %s", (cita_id, user_id))
        cita = cur.fetchone()
        
        if not cita:
            return jsonify({'success': False, 'message': 'Cita no encontrada.'})
            
        cur.execute("UPDATE citas SET estado = 'Cancelada' WHERE id = %s", (cita_id,))
        
        tramite_id = cita.get('tramite_id')
        if tramite_id:
            cur.execute("UPDATE tramites SET estado = 'Cancelado', detalle = 'El ciudadano canceló la cita virtualmente.' WHERE id = %s", (tramite_id,))
            
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'success': True, 'message': 'La cita ha sido cancelada exitosamente.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============== NUEVO ENDPOINT: SUBIR FOTO DE PERFIL ==============

@app.route('/api/upload-foto', methods=['POST'])
def upload_foto():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'No autorizado'}), 401
        
    if 'foto' not in request.files:
        return jsonify({'success': False, 'message': 'No se seleccionó ninguna imagen.'})
        
    foto = request.files['foto']
    if foto.filename == '':
        return jsonify({'success': False, 'message': 'El archivo está vacío.'})
        
    try:
        # Generar nombre único para la foto
        ext = foto.filename.rsplit('.', 1)[1].lower() if '.' in foto.filename else 'png'
        filename = secure_filename(f"user_{session['user_id']}_{int(datetime.now().timestamp())}.{ext}")
        
        # Guardar en la carpeta static/uploads/perfiles
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        foto.save(filepath)
        
        # Actualizar base de datos
        cur = mysql.connection.cursor()
        cur.execute("UPDATE usuarios SET foto_perfil = %s WHERE id = %s", (filename, session['user_id']))
        mysql.connection.commit()
        cur.close()
        
        # Generar la URL de la nueva foto para que el frontend la muestre de inmediato
        nueva_url = url_for('static', filename=f'uploads/perfiles/{filename}')
        
        return jsonify({'success': True, 'message': 'Foto de perfil actualizada correctamente.', 'foto_url': nueva_url})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============== ENDPOINTS API AUTENTICACIÓN Y FACIAL (INTACTOS) ==============

@app.route('/api/register', methods=['POST'])
def api_register():
    try:
        data = request.json
        nombres = data.get('nombres')
        apellidos = data.get('apellidos')
        dni = data.get('dni')
        celular = data.get('celular')
        correo = data.get('correo')
        password = data.get('password')
        
        if not all([nombres, apellidos, dni, celular, correo, password]):
            return jsonify({'success': False, 'message': 'Todos los campos son requeridos'})
        
        if len(dni) != 8 or not dni.isdigit():
            return jsonify({'success': False, 'message': 'DNI debe tener 8 dígitos'})
        
        if len(celular) != 9 or not celular.isdigit():
            return jsonify({'success': False, 'message': 'Celular debe tener 9 dígitos'})
        
        if user_model.check_user_exists(dni, correo):
            return jsonify({'success': False, 'message': 'El DNI o correo ya está registrado'})
        
        success, message = user_model.register_user(nombres, apellidos, dni, celular, correo, password)
        if success: return jsonify({'success': True, 'message': message})
        else: return jsonify({'success': False, 'message': message})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.json
        dni = data.get('dni')
        password = data.get('password')
        
        if not dni or not password:
            return jsonify({'success': False, 'message': 'DNI y contraseña requeridos'})
        
        success, user_data = user_model.login_user(dni, password)
        if success:
            session['user_id'] = user_data['id']
            session['user_name'] = f"{user_data['nombres']} {user_data['apellidos']}"
            session['user_dni'] = user_data['dni']
            session['face_login'] = False
            return jsonify({'success': True, 'message': 'Login exitoso', 'user': user_data})
        else:
            return jsonify({'success': False, 'message': user_data})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/register_facial', methods=['POST'])
def api_register_facial():
    try:
        data = request.json
        image_data = data.get('image')
        dni = data.get('dni')
        nombres = data.get('nombres')
        apellidos = data.get('apellidos')
        celular = data.get('celular')
        correo = data.get('correo')
        password = data.get('password')
        
        if ',' in image_data: image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0: return jsonify({'success': False, 'message': 'No se detectó ningún rostro'})
        elif len(face_locations) > 1: return jsonify({'success': False, 'message': 'Se detectaron múltiples rostros'})
        
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if len(face_encodings) == 0: return jsonify({'success': False, 'message': 'No se pudo procesar el rostro'})
        
        facial_encoding = face_encodings[0].tolist()
        
        if user_model.check_user_exists(dni, correo): return jsonify({'success': False, 'message': 'DNI o correo registrado'})
        
        success, message = user_model.register_user(nombres, apellidos, dni, celular, correo, password, facial_encoding)
        if success: return jsonify({'success': True, 'message': 'Registro facial exitoso.'})
        else: return jsonify({'success': False, 'message': message})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/verify_face_only', methods=['POST'])
def api_verify_face_only():
    try:
        data = request.json
        image_data = data.get('image')
        
        if ',' in image_data: image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0: return jsonify({'success': False, 'message': 'No se detectó ningún rostro'})
        elif len(face_locations) > 1: return jsonify({'success': False, 'message': 'Múltiples rostros detectados.'})
        
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if len(face_encodings) == 0: return jsonify({'success': False, 'message': 'No se pudo procesar.'})
        
        current_face_encoding = face_encodings[0]
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, nombres, apellidos, dni, facial_data FROM usuarios WHERE facial_data IS NOT NULL")
        users = cur.fetchall()
        cur.close()
        
        if not users: return jsonify({'success': False, 'message': 'No hay usuarios registrados.'})
        
        best_match = None
        best_distance = 0.5 
        for user in users:
            if user['facial_data']:
                try:
                    stored_encoding = np.array(json.loads(user['facial_data']))
                    distance = face_recognition.face_distance([stored_encoding], current_face_encoding)[0]
                    if distance < best_distance: best_distance = distance; best_match = user
                except Exception as e: continue
        
        if best_match and best_distance < 0.5:
            session['user_id'] = best_match['id']
            session['user_name'] = f"{best_match['nombres']} {best_match['apellidos']}"
            session['user_dni'] = best_match['dni']
            session['face_login'] = True
            return jsonify({'success': True, 'message': f'✅ Bienvenido {best_match["nombres"]}!', 'user': {'id': best_match['id'], 'nombres': best_match['nombres'], 'apellidos': best_match['apellidos'], 'dni': best_match['dni']}})
        else: return jsonify({'success': False, 'message': '❌ Rostro no reconocido.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/check_face_registered', methods=['POST'])
def api_check_face_registered():
    try:
        data = request.json
        image_data = data.get('image')
        
        if ',' in image_data: image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0: return jsonify({'success': False, 'message': 'No se detectó ningún rostro'})
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if len(face_encodings) == 0: return jsonify({'success': False, 'message': 'No se pudo procesar el rostro'})
        
        current_face_encoding = face_encodings[0]
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, nombres, apellidos, dni, facial_data FROM usuarios WHERE facial_data IS NOT NULL")
        users = cur.fetchall()
        cur.close()
        
        for user in users:
            if user['facial_data']:
                stored_encoding = np.array(json.loads(user['facial_data']))
                distance = face_recognition.face_distance([stored_encoding], current_face_encoding)[0]
                if distance < 0.5: return jsonify({'success': False, 'message': f'Rostro ya registrado con DNI {user["dni"]}.'})
        
        session['temp_facial_encoding'] = current_face_encoding.tolist()
        return jsonify({'success': True, 'message': 'Rostro válido. Puedes proceder.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/check_session')
def check_session():
    if 'user_id' in session: return jsonify({'logged_in': True, 'user_name': session.get('user_name')})
    return jsonify({'logged_in': False})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)