# Consulta-Ciudadana

- Python 3.11
- MySQL Workbench 8.0 CE

### Para compilar (ejecutar)

Activar entorno virtual y ejecutar:
```bash
venv\Scripts\activate
```
```bash
python app.py
```

### Si es que les pide importaciones

- pip install -r requirements.txt
- pip install opencv-python opencv-contrib-python face-recognition numpy
- pip install -r requirements.txt


# Instrucciones de ejecución

- Terminal 1 - Convertir CSV a JSON (solo la primera vez):
```bash
python data/procesar_datos.py
```
- Terminal 1 - Ejecutar la API de datos:
```bash
python data_api.py
```
Terminal 2 - Ejecutar la app principal:
```bash
python app.py
```


# Flujo de Trabajo del Proyecto - GitHub

## Estructura del Proyecto

```text
main (estable)
 ├── rama-gerardo
 ├── rama-juan
 ├── rama-maria
 └── rama-carlos
```

⚠️ Nadie trabaja directamente en `main`.

---

# Flujo de Trabajo para Todo el Equipo

## 1. Clonar el proyecto (solo la primera vez)

```bash
git clone URL_DEL_REPOSITORIO
```

Entrar al proyecto:

```bash
cd nombre-del-proyecto
```

---

## Configurar Git (solo la primera vez)

Si Git muestra el error:

```text
Author identity unknown
```

Configurar nombre y correo:

```bash
git config --global user.name "Gerardo Depaz"
git config --global user.email "TU_CORREO_GITHUB"
```

Ejemplo:

```bash
git config --global user.name "Gerardo Depaz"
git config --global user.email "gerardo@gmail.com"
```

Verificar configuración:

```bash
git config --global --list
```

---

# 2. Antes de trabajar SIEMPRE

Todos deben ejecutar primero:

```bash
git checkout main
git pull origin main
```

Esto actualiza el proyecto con los últimos cambios.

---

# 3. Crear su rama personal

Cada integrante crea UNA SOLA rama personal y siempre trabaja ahí.

Ejemplos:

```bash
git checkout -b rama-gerardo
```

```bash
git checkout -b rama-juan
```

---

# 4. Trabajar normalmente

Realizar modificaciones en el proyecto.

---

# 5. Ver cambios realizados

```bash
git status
```

---

# 6. Guardar cambios localmente

Agregar archivos:

```bash
git add .
```

Guardar commit:

```bash
git commit -m "Agregado login facial"
```

---

# 7. Subir cambios a GitHub

```bash
git push origin rama-gerardo
```

---

# 8. Crear Pull Request

En GitHub aparecerá:

```text
Compare & Pull Request
```

Dar click y enviar:

```text
rama-gerardo → main
```

El líder del proyecto revisará y aprobará los cambios.

---

# 9. Después de aprobar el Pull Request

Todos deben actualizar nuevamente:

```bash
git checkout main
git pull origin main
```

Luego regresar a su rama:

```bash
git checkout rama-gerardo
```

Actualizar la rama personal:

```bash
git merge main
```

---

# Flujo Diario Resumido

## 1. Actualizar proyecto

```bash
git checkout main
git pull origin main
```

---

## 2. Entrar a su rama

```bash
git checkout rama-nombre
```

---

## 3. Actualizar su rama

```bash
git merge main
```

---

## 4. Trabajar

Realizar cambios necesarios.

---

## 5. Guardar cambios

```bash
git add .
git commit -m "mensaje"
```

---

## 6. Subir cambios

```bash
git push origin rama-nombre
```

---

## 7. Crear Pull Request

Siempre hacia `main`.

---

# Comandos Importantes para el Líder

## Ver ramas

```bash
git branch
```

---

## Cambiar de rama

```bash
git checkout main
```

---

## Descargar cambios

```bash
git pull origin main
```

---

## Ver commits

```bash
git log --oneline
```

---

# Reglas Importantes del Equipo

## ❌ Nunca hacer esto

```bash
git push origin main
```

Porque pueden romper el proyecto principal.

---

## ✅ Siempre trabajar en ramas

Ejemplos:

```text
rama-login
rama-backend
rama-frontend
rama-juan
```

---


# Flujo Visual Sencillo

```text
1. main actualizado
       ↓
2. entrar a rama personal
       ↓
3. trabajar
       ↓
4. git add .
       ↓
5. git commit
       ↓
6. git push
       ↓
7. Pull Request
       ↓
8. líder aprueba
       ↓
9. main actualizado
```

---

# Recomendaciones Extras en GitHub

Se recomienda activar:

- Protección de rama `main`
- Bloquear pushes directos a `main`
- Revisiones obligatorias
- Historial limpio del proyecto

Esto ayuda a mantener el proyecto organizado y estable.
