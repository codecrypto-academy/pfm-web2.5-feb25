# Hyperledger Besu Network Setup Script

Este script en Bash automatiza la configuración de una red blockchain utilizando **Hyperledger Besu**. Crea una red personalizada con validadores y fullnodes, configurando archivos necesarios, ejecutando contenedores Docker y generando claves de nodos.

## Requisitos

### Dependencias

1. **Docker**: Asegúrate de que Docker esté instalado y configurado.
2. **Hyperledger Besu**: Descárgalo desde el [sitio oficial de Hyperledger Besu](https://besu.hyperledger.org/).
3. **Cuenta Metamask**: Proporciona una dirección válida en formato `0x...`.

### Permisos

Este script puede requerir permisos de administrador para ejecutar comandos relacionados con Docker.

## Instalación

1. **Clona el repositorio o descarga el script**.
2. Asegúrate de que el archivo tiene permisos de ejecución:

   ```bash
   chmod +x script.sh
   ```

3. Ejecuta el script:
   ```bash
   ./script.sh
   ```

## Funcionalidades Principales

### 1. Verificación de Dependencias

El script valida la instalación de Docker y Hyperledger Besu antes de proceder.

### 2. Creación de Red Docker

Crea una red Docker llamada `besu` para la comunicación entre los nodos.

### 3. Configuración de Nodos

- Solicita el número de nodos a crear, asegurándose de que al menos se cree un nodo validador.
- Genera claves y direcciones para cada nodo.

### 4. Archivo `genesis.json`

Crea un archivo `genesis.json` personalizado con:

- Un `chainID` único.
- Configuración de consenso Clique.
- Inclusión de cuentas Metamask con fondos predefinidos.

### 5. Configuración de Validadores y Fullnodes

- Genera archivos `config.toml` y `config-fullnode.toml` para los nodos.
- Configura nodos validadores y fullnodes con los puertos y parámetros necesarios.

### 6. Lanzamiento de Nodos

- Inicia los contenedores Docker para todos los nodos.
- Obtiene la información `enode` del nodo validador.

### 7. Información de la Red

Al finalizar, muestra:

- La cantidad total de nodos.
- Las URLs para acceder a los nodos.
- La cuenta Metamask registrada.
- El `enode` del nodo validador.

## Uso Interactivo

El script es interactivo y solicita la siguiente información:

1. **Número de nodos**: Incluyendo validadores y fullnodes.
2. **Cuenta Metamask**: Dirección válida para asignar balance inicial en el `genesis.json`.

## Salida

Al ejecutar el script, obtendrás:

1. Una red Hyperledger Besu funcional con validadores y fullnodes.
2. Archivos de configuración (`genesis.json`, `config.toml`, `config-fullnode.toml`).
3. Contenedores Docker en ejecución.
4. Información de acceso a los nodos y configuración de la red.

## Estructura del Proyecto

- `script.sh`: El script principal.
- Directorios creados para cada nodo, que contienen claves y datos de configuración.
- Archivos de configuración generados:
  - `genesis.json`
  - `config.toml` (para validadores)
  - `config-fullnode.toml` (para fullnodes)

## Problemas Comunes

1. **Docker no instalado**: Asegúrate de instalar Docker.
2. **Hyperledger Besu no encontrado**: Añade Besu a tu PATH.
3. **Error en la dirección de Metamask**: Proporciona una dirección Ethereum válida.

## Licencia

Este proyecto está bajo una licencia abierta. Siéntete libre de adaptarlo y mejorarlo según tus necesidades.

---

Para más información sobre Hyperledger Besu, visita la [documentación oficial](https://besu.hyperledger.org/).
