# 🏗️ BesuManager - Librería para gestionar la red Hyperledger Besu

BesuManager es una librería en TypeScript diseñada para gestionar una red privada de **Hyperledger Besu** mediante Docker. Permite desplegar, detener, arrancar y eliminar la red de forma sencilla.

---

## 🚀 Instalación

Ejecuta el siguiente comando en la carpeta `lib`:

```bash
npm install
```

Si deseas usar la librería en otro proyecto:

```bash
npm install ../lib
```

---

## 📌 Configuración
Antes de usar la librería, configura las variables de entorno en `.env`:

```ini
DEFAULT_NUM_NODES=3
DEFAULT_CHAIN_ID=13371337
DEFAULT_METAMASK_ACCOUNT=0xEc405D1D3984345644d36653d42ad16E79f7D41F
RPC_PORT=8545
```

También puedes editar `src/config.ts` para definir valores predeterminados:

```typescript
import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
    DEFAULT_NUM_NODES: process.env.DEFAULT_NUM_NODES ? parseInt(process.env.DEFAULT_NUM_NODES, 10) : 3,
    DEFAULT_CHAIN_ID: process.env.DEFAULT_CHAIN_ID ? parseInt(process.env.DEFAULT_CHAIN_ID, 10) : 13371337,
    DEFAULT_METAMASK_ACCOUNT: process.env.DEFAULT_METAMASK_ACCOUNT || "0xEc405D1D3984345644d36653d42ad16E79f7D41F",
    RPC_PORT: process.env.RPC_PORT ? parseInt(process.env.RPC_PORT, 10) : 8545
};
```

---

## 📖 Uso de la librería
### 🛠️ Importar la librería
```typescript
import { deployNetwork, stopNetwork, startNetwork, deleteNetwork } from "lib";
```

### 📌 Funciones disponibles
#### 🚀 Desplegar la red Besu
```typescript
await deployNetwork(3, 13371337, "0xEc405D1D3984345644d36653d42ad16E79f7D41F");
```
Este comando lanza una red Besu con **3 nodos**, **Chain ID 13371337** y **una cuenta pre-asignada**.

#### 🛑 Detener la red Besu
```typescript
await stopNetwork();
```
Detiene los nodos en ejecución sin eliminarlos.

#### ▶️ Arrancar la red Besu
```typescript
await startNetwork();
```
Reinicia los nodos previamente detenidos.

#### 🗑️ Eliminar completamente la red Besu
```typescript
await deleteNetwork();
```
Borra todos los nodos, la red de Docker y la carpeta de datos `besu`.

---

## 🧪 Ejecutar pruebas
Para verificar el correcto funcionamiento de la librería:

```bash
npm run test
```

Las pruebas están en `tests/BesuManager.test.ts` y validan:

✅ Creación y eliminación de la red  
✅ Gestión de nodos  
✅ Manejo de errores

---

## 🛠️ Estructura del Proyecto
```
lib/
│── src/
│   ├── BesuManager.ts      # Implementación de la librería
│   ├── config.ts           # Configuración y variables de entorno
│   ├── runDeploy.ts        # Script para probar el despliegue
│── tests/
│   ├── BesuManager.test.ts # Pruebas unitarias con Jest
│── scripts/
│   ├── deployBesuNet.sh    # Script Bash para desplegar la red
│── .env                    # Variables de entorno
│── tsconfig.json           # Configuración de TypeScript
│── package.json            # Configuración de la librería
│── README.md               # Este archivo ✨
```

---

## 🎯 Próximos pasos
🔹 Integración con un backend en Node.js  
🔹 Implementación de una interfaz web con React  
🔹 Gestión avanzada de permisos y cuentas  

🚀 **¡Colabora con el proyecto!** Cualquier mejora o sugerencia es bienvenida. 😃

---

### 📝 Autor
📌 **Nombre:** Ferran Gómez  
📌 **Proyecto:** Gestión descentralizada de redes Besu  
📌 **LinkedIn/GitHub:** *[Añadir enlace]*  

---

📢 **¡Gracias por usar BesuManager!** 🎉  
Si tienes dudas, no dudes en preguntar. 😃

