from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Permite conexiones desde el puerto 5000

def cargar_datos():
    """Carga los JSON a memoria"""
    datos = {'licencias': [], 'padrones': [], 'partidas': []}
    
    for clave in datos.keys():
        json_path = f'data/{clave}.json'
        if os.path.exists(json_path):
            with open(json_path, 'r', encoding='utf-8') as f:
                datos[clave] = json.load(f)
            print(f"✅ Cargados {len(datos[clave])} registros de {clave}")
        else:
            print(f"⚠️ No se encontró {json_path}")
    
    return datos

# Cargar datos al iniciar
DATOS = cargar_datos()

# ============== ENDPOINTS ==============

@app.route('/api/v1/licencias', methods=['GET'])
def get_licencias():
    return jsonify({'success': True, 'data': DATOS['licencias'], 'total': len(DATOS['licencias'])})

@app.route('/api/v1/padrones', methods=['GET'])
def get_padrones():
    return jsonify({'success': True, 'data': DATOS['padrones'], 'total': len(DATOS['padrones'])})

@app.route('/api/v1/partidas', methods=['GET'])
def get_partidas():
    return jsonify({'success': True, 'data': DATOS['partidas'], 'total': len(DATOS['partidas'])})

@app.route('/api/v1/buscar', methods=['GET'])
def buscar():
    query = request.args.get('q', '').lower()
    resultados = []
    
    for tipo, items in DATOS.items():
        for item in items:
            if query in str(item).lower():
                item_copy = item.copy()
                item_copy['tipo_tramite'] = tipo
                resultados.append(item_copy)
    
    return jsonify({'success': True, 'data': resultados, 'total': len(resultados), 'query': query})

@app.route('/api/v1/estadisticas', methods=['GET'])
def estadisticas():
    return jsonify({
        'success': True,
        'data': {
            'licencias': len(DATOS['licencias']),
            'padrones': len(DATOS['padrones']),
            'partidas': len(DATOS['partidas']),
            'total': len(DATOS['licencias']) + len(DATOS['padrones']) + len(DATOS['partidas'])
        }
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 API DE DATOS - CABOT")
    print("="*50)
    print(f"📊 Licencias: {len(DATOS['licencias'])} registros")
    print(f"📋 Padrones: {len(DATOS['padrones'])} registros")
    print(f"📄 Partidas: {len(DATOS['partidas'])} registros")
    print("="*50)
    print("🌐 API disponible en: http://localhost:5001")
    print("📌 Endpoints:")
    print("   GET /api/v1/licencias")
    print("   GET /api/v1/padrones")
    print("   GET /api/v1/partidas")
    print("   GET /api/v1/buscar?q=texto")
    print("   GET /api/v1/estadisticas")
    print("="*50 + "\n")
    app.run(debug=True, port=5001)



# Agregar después de los endpoints existentes

@app.route('/api/v1/licencias/paginated', methods=['GET'])
def get_licencias_paginated():
    """Obtener licencias con paginación desde el servidor"""
    pagina = int(request.args.get('page', 1))
    por_pagina = int(request.args.get('limit', 20))
    busqueda = request.args.get('search', '').lower()
    
    # Filtrar datos si hay búsqueda
    datos_filtrados = DATOS['licencias']
    if busqueda:
        datos_filtrados = [item for item in datos_filtrados 
                          if busqueda in str(item).lower()]
    
    # Calcular paginación
    total = len(datos_filtrados)
    total_paginas = (total + por_pagina - 1) // por_pagina
    inicio = (pagina - 1) * por_pagina
    fin = inicio + por_pagina
    
    # Obtener datos de la página actual
    datos_pagina = datos_filtrados[inicio:fin]
    
    return jsonify({
        'success': True,
        'data': datos_pagina,
        'pagination': {
            'current_page': pagina,
            'per_page': por_pagina,
            'total': total,
            'total_pages': total_paginas,
            'has_next': pagina < total_paginas,
            'has_prev': pagina > 1
        }
    })

@app.route('/api/v1/padrones/paginated', methods=['GET'])
def get_padrones_paginated():
    """Obtener padrones con paginación"""
    pagina = int(request.args.get('page', 1))
    por_pagina = int(request.args.get('limit', 20))
    busqueda = request.args.get('search', '').lower()
    
    datos_filtrados = DATOS['padrones']
    if busqueda:
        datos_filtrados = [item for item in datos_filtrados 
                          if busqueda in str(item).lower()]
    
    total = len(datos_filtrados)
    total_paginas = (total + por_pagina - 1) // por_pagina
    inicio = (pagina - 1) * por_pagina
    fin = inicio + por_pagina
    datos_pagina = datos_filtrados[inicio:fin]
    
    return jsonify({
        'success': True,
        'data': datos_pagina,
        'pagination': {
            'current_page': pagina,
            'per_page': por_pagina,
            'total': total,
            'total_pages': total_paginas,
            'has_next': pagina < total_paginas,
            'has_prev': pagina > 1
        }
    })

@app.route('/api/v1/partidas/paginated', methods=['GET'])
def get_partidas_paginated():
    """Obtener partidas con paginación"""
    pagina = int(request.args.get('page', 1))
    por_pagina = int(request.args.get('limit', 20))
    busqueda = request.args.get('search', '').lower()
    
    datos_filtrados = DATOS['partidas']
    if busqueda:
        datos_filtrados = [item for item in datos_filtrados 
                          if busqueda in str(item).lower()]
    
    total = len(datos_filtrados)
    total_paginas = (total + por_pagina - 1) // por_pagina
    inicio = (pagina - 1) * por_pagina
    fin = inicio + por_pagina
    datos_pagina = datos_filtrados[inicio:fin]
    
    return jsonify({
        'success': True,
        'data': datos_pagina,
        'pagination': {
            'current_page': pagina,
            'per_page': por_pagina,
            'total': total,
            'total_pages': total_paginas,
            'has_next': pagina < total_paginas,
            'has_prev': pagina > 1
        }
    })