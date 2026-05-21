import MySQLdb.cursors
import hashlib
import base64
import json

def get_user_by_id(user_id, mysql):
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute("SELECT * FROM usuarios WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    return user

class UserModel:
    def __init__(self, mysql):
        self.mysql = mysql
    
    def hash_password(self, password):
        """Encriptar contraseña"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def register_user(self, nombres, apellidos, dni, celular, correo, password, facial_data=None):
        """Registrar nuevo usuario"""
        try:
            cur = self.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            hashed_password = self.hash_password(password)
            
            # Convertir facial_data a formato JSON si existe
            facial_json = json.dumps(facial_data) if facial_data else None
            
            cur.execute("""
                INSERT INTO usuarios (nombres, apellidos, dni, celular, correo, password, facial_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (nombres, apellidos, dni, celular, correo, hashed_password, facial_json))
            
            self.mysql.connection.commit()
            cur.close()
            return True, "Usuario registrado exitosamente"
        except Exception as e:
            return False, str(e)
    
    def login_user(self, dni, password):
        """Login tradicional con DNI y contraseña"""
        try:
            cur = self.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            hashed_password = self.hash_password(password)
            
            cur.execute("""
                SELECT id, nombres, apellidos, dni, celular, correo, facial_data
                FROM usuarios 
                WHERE dni = %s AND password = %s
            """, (dni, hashed_password))
            
            user = cur.fetchone()
            cur.close()
            
            if user:
                return True, user
            return False, "DNI o contraseña incorrectos"
        except Exception as e:
            return False, str(e)
    
    def get_user_by_id(self, user_id):
        """Obtener usuario por ID"""
        try:
            cur = self.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            cur.execute("""
                SELECT id, nombres, apellidos, dni, celular, correo
                FROM usuarios WHERE id = %s
            """, (user_id,))
            user = cur.fetchone()
            cur.close()
            return user
        except Exception as e:
            return None
    
    def save_facial_data(self, user_id, facial_data):
        """Guardar datos faciales para un usuario"""
        try:
            cur = self.mysql.connection.cursor()
            facial_json = json.dumps(facial_data)
            cur.execute("""
                UPDATE usuarios SET facial_data = %s WHERE id = %s
            """, (facial_json, user_id))
            self.mysql.connection.commit()
            cur.close()
            return True
        except Exception as e:
            print(f"Error guardando datos faciales: {e}")
            return False
    
    def get_facial_data(self, dni):
        """Obtener datos faciales por DNI"""
        try:
            cur = self.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            cur.execute("""
                SELECT id, facial_data FROM usuarios WHERE dni = %s AND facial_data IS NOT NULL
            """, (dni,))
            user = cur.fetchone()
            cur.close()
            
            if user and user['facial_data']:
                return True, user['id'], json.loads(user['facial_data'])
            return False, None, None
        except Exception as e:
            return False, None, None
    
    def check_user_exists(self, dni, correo):
        """Verificar si ya existe usuario con DNI o correo"""
        try:
            cur = self.mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            cur.execute("""
                SELECT id FROM usuarios WHERE dni = %s OR correo = %s
            """, (dni, correo))
            user = cur.fetchone()
            cur.close()
            return user is not None
        except Exception as e:
            return False