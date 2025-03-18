
# Proyecto: Ferrancgg-pfm-web2.5-feb25

Este proyecto tiene como objetivo desplegar y gestionar una red Hyperledger Besu utilizando una arquitectura backend basada en Node.js y TypeScript. Permite la creación, administración y expansión de la red de nodos Besu a través de una API REST.

## 📌 Características principales
- 🚀 **Despliegue de la red Besu** con configuración personalizada.
- ➕ **Adición de nuevos nodos** de forma dinámica.
- 🛑 **Parada y reinicio** de la red Besu.
- 🗑️ **Eliminación de la red** completamente.
- 📡 **Conexión con RPC** para interactuar con la red.
- 🔧 **Facilidad de configuración mediante archivos `.env`.**

---
## 🛠️ Instalación

### 1️⃣ Clonar el repositorio
```sh
git clone https://github.com/Ferrancgg-pfm-web2.5-feb25.git
cd Ferrancgg-pfm-web2.5-feb25
```

### 2️⃣ Configurar el entorno

#### 📂 Configuración del Backend
Crear el archivo `.env` dentro de `backend/` con el siguiente contenido:
```ini
PORT=3001
BESU_RPC_URL=http://localhost:8545
```

#### 📂 Configuración de la Librería
Crear el archivo `.env` dentro de `lib/` con el siguiente contenido:
```ini
DEFAULT_NUM_NODES=3
DEFAULT_CHAIN_ID=13371337
DEFAULT_METAMASK_ACCOUNT=0xEc405D1D3984345644d36653d42ad16E79f7D41F
RPC_PORT=8545
```

---
## 🚀 Puesta en marcha del proyecto

### 1️⃣ Instalar dependencias
Ejecutar estos comandos en la raíz del proyecto:
```sh
cd lib
npm install
npm run build
cd ../backend
npm install
npm run build
```

### 2️⃣ Desplegar la red Besu
```sh
npm run deploy
```

### 3️⃣ Iniciar el backend
```sh
npm run dev
```
Si el puerto `3001` ya está en uso, detener la instancia anterior:
```sh
lsof -i :3001  # Ver los procesos en uso en el puerto
kill -9 <PID>  # Reemplaza <PID> con el número del proceso
```

---
## 📡 Pruebas de la API con `curl`

### ✅ Verificar que el backend está funcionando
```sh
curl -X GET http://localhost:3001/
```

### 🚀 Desplegar la red Besu
```sh
curl -X POST http://localhost:3001/besu/deploy
```

### 🛑 Detener la red Besu
```sh
curl -X POST http://localhost:3001/besu/stop
```

### ▶️ Iniciar la red Besu
```sh
curl -X POST http://localhost:3001/besu/start
```

### ➕ Agregar un nuevo nodo
```sh
curl -X POST http://localhost:3001/besu/add-node
```

### 🗑️ Eliminar la red Besu
```sh
curl -X POST http://localhost:3001/besu/delete
```

---
## 🛠️ Mantenimiento y Debugging

### 📌 Reiniciar la librería
Si se hacen cambios en `lib/`, se debe recompilar antes de ejecutar el backend:
```sh
cd lib
npm run build
cd ../backend
npm run build
```

### 🔍 Verificar el estado de la red
```sh
docker ps
```

### 🛑 Detener contenedores y limpiar la red
```sh
npm run clean
```

### 📂 Revisar los logs del backend
```sh
npm run dev
```

---
## 🚀 Próximos pasos
- 📌 Integración de un frontend.
- 📊 Panel de administración para visualizar los nodos de la red.
- 🔐 Seguridad mejorada para las API.

¡Con esto, ya deberías tener la red Besu corriendo sin problemas! 🎉

