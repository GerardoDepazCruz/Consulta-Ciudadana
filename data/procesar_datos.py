import pandas as pd
import json
import os
import csv

def leer_csv_seguro(archivo_csv):
    """Lee CSV manejando errores de formato"""
    
    try:
        # Intentar UTF-8 primero
        try:
            df = pd.read_csv(
                archivo_csv,
                sep=None,
                encoding='utf-8-sig',
                engine='python',
                on_bad_lines='skip',
                dtype=str
            )
        except:
            # Si falla, usar cp1252
            df = pd.read_csv(
                archivo_csv,
                sep=None,
                encoding='cp1252',
                engine='python',
                on_bad_lines='skip',
                dtype=str
            )
            
        # Reemplazar NaN por vacío
        df = df.fillna('')

        # Limpiar nombres de columnas
        df.columns = [str(col).strip().replace(';', '_').replace(' ', '_') for col in df.columns]
        
        return df.to_dict(orient='records')
        
    except Exception as e:
        print(f"Error con pandas: {e}")
        print("Intentando lectura manual...")
        
        datos = []
        
        with open(archivo_csv, 'r', encoding='cp1252', errors='ignore') as f:
            # Leer cabeceras
            primera_linea = f.readline().strip()
            
            if ';' in primera_linea:
                delim = ';'
            else:
                delim = ','
            
            # Dividir cabeceras
            columnas = [c.strip().replace(' ', '_') for c in primera_linea.split(delim)]
            print(f"   Columnas detectadas: {len(columnas)}")
            print(f"   Primeras columnas: {columnas[:5]}")
            
            # Leer el resto de líneas
            leidas = 0
            for num_linea, linea in enumerate(f, start=2):
                    
                try:
                    valores = linea.strip().split(delim)
                    
                    # Si la línea tiene datos
                    if len(valores) > 1 and any(v.strip() for v in valores if v):
                        fila = {}
                        for i, col in enumerate(columnas):
                            if i < len(valores):
                                valor = valores[i].strip()
                                fila[col] = valor if valor else None
                            else:
                                fila[col] = None
                        
                        datos.append(fila)
                        leidas += 1
                        
                except Exception as ex:
                    continue
        
        print(f"   Registros cargados: {len(datos)} (limitado a 200 para prueba)")
        return datos

def convertir_csv_a_json():
    """Convierte CSV a JSON con límite para pruebas"""
    
    if not os.path.exists('data'):
        os.makedirs('data')
        print("📁 Carpeta data creada")
    
    archivos = ['licencias', 'padrones', 'partidas']
    resultados = {}
    
    for archivo in archivos:
        csv_path = f'data/{archivo}.csv'
        json_path = f'data/{archivo}.json'
        
        if os.path.exists(csv_path):
            print(f"\n📖 Procesando {archivo}.csv...")
            datos = leer_csv_seguro(csv_path)
            
            if datos:
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(datos, f, ensure_ascii=False, indent=2)
                print(f"   ✅ {len(datos)} registros guardados en {archivo}.json")
                resultados[archivo] = len(datos)
            else:
                print(f"   ⚠️ No se encontraron datos en {archivo}.csv")
                resultados[archivo] = 0
        else:
            print(f"⚠️ No se encontró {csv_path}")
            resultados[archivo] = 0
    
    return resultados

if __name__ == "__main__":
    print("🔄 CONVIRTIENDO CSV A JSON")
    print("="*40)
    resultados = convertir_csv_a_json()
    print("="*40)
    print("✅ Proceso completado")