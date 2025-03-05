# pfm-web2.5-feb25
Este proyecto automatiza el proceso de creación y gestión de una red blockchain utilizando Hyperledger Besu.

## Estructura del proyecto
El proyecto tiene la siguiente estructura de archivos:

```
📂 pfm-web2.5-feb25
 ├── 📂 script        
 │    └── createBESUnetwork.sh    # Script para la automatización de la creación de una red BESU
 │    └── createPrivatePublicKeys.mjs    # Script para la creación de llaves públicas y privadas
 │    └── txTest.js    # Script para realizar una transaccion de prueba
 ├── 📂 lib           # Biblioteca en TypeScript
 │    └── index.ts  
 ├── 📂 frontback     # Framework NextJS
 │    ├── 📂 src 
 │    │    └── 
 │    ...
 ├── README.md
 └── ...
```
## Tecnologías usadas

## Requisitos

- **Sistema operativo**: El script está diseñado para funcionar en sistemas operativos basados en Linux y macOS (también se puede ejecutar en Windows si tienes un entorno compatible con Bash, como WSL).
- **Dependencias**:
  - **Node.js**
  - **Docker**: Utilizado para la creación de contenedores y redes.
  - **Git**: Para clonar el repositorio.

## Instalación

### Clonar el repositorio

Primero, clona el repositorio en tu máquina local:

```bash
git clone https://github.com/davidGalaviz/pfm-web2.5-feb25.git
```

### Instalar las dependencias

Asegúrate de tener Docker instalado en tu sistema. Si no lo tienes, puedes seguir las instrucciones de instalación [aquí](https://docs.docker.com/get-docker/).

# Script
## createBESUnetwork.sh
El script `createBESUnetwork.sh` automatiza la creación de una red BESU (Ethereum client compatible con la red de pruebas y Mainnet).

### Ejecutar el script

Una vez que hayas clonado el repositorio, navega a la carpeta del proyecto y haz el script ejecutable:

```bash
cd pfm-web2.5-feb25
chmod +x createBESUnetwork.sh
```

### Ejecución del script

El script acepta los siguientes comandos
- **createBesuNetwork** | Crea una red de BESU
- **deleteBesuNetwork** | Elimina una red BESU !Aún no implementada
- **addBesuNode** | Añade un nodo a una red BESU existente !Aún no implementada
- **deleteBesuNode** | Elimina un nodo de una red BESU existente !Aún no implementada

#### Ejemplo de uso:
```bash
./createBESUnetwork.sh createBesuNetwork
```

### Comando createBesuNetwork
El script solicita parámetros clave que incluyen:

- **Chain ID**: 
- **Número de nodos**: La cantidad de nodos que deseas tener en la red BESU.
- **Nombre de la red**: El nombre que deseas asignar a la red que se está creando.
- **IP de network**: 
- **Número de bootnodes**:
- **directory**: El directorio donde se va a crear un directorio para la red

### Ejemplo de uso:

Este comando creará una red BESU llamada "TEST" con 4 nodos.
*Video

## createPrivatePublicKeys.mjs
![CodeCrypto (1)](https://github.com/user-attachments/assets/6957b154-1bd2-4162-98c2-1815688fee51)
