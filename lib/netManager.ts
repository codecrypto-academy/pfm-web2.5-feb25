import { exec } from "child_process";
import path from "path";


export function prepararNetwork(){
    const scriptPath = path.resolve(__dirname, "../script/prepararNetwork.sh"); // Ruta absoluta

    return new Promise((resolve, reject) => {
        exec(`bash "${scriptPath}"`, (error, stdout, stderr) => {    
            if (error) {
                reject(`Error ejecutando el script: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}

export function limpiarRedEnDocker(NETWORK_NAME:string){
    const scriptPath = path.resolve(__dirname, "../script/limpiarRedEnDocker.sh"); // Ruta absoluta

    return new Promise((resolve, reject) => {
        exec(`bash "${scriptPath}" ${NETWORK_NAME}`, (error, stdout, stderr) => {    
            if (error) {
                reject(`Error ejecutando el script: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}

export function crearRed(NETWORK_NAME:string, NETWORK:string ): Promise<string> {
    const scriptPath = path.resolve(__dirname, "../script/crearRed.sh"); // Ruta absoluta

    return new Promise((resolve, reject) => {
        exec(`bash "${scriptPath}" ${NETWORK_NAME} ${NETWORK}`, (error, stdout, stderr) => {    
            if (error) {
                reject(`Error ejecutando el script: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}

export function crearBootnode(BOOTNODE_IP:string): Promise<string> {
    const scriptPath = path.resolve(__dirname, "../script/crearBootnode.sh"); // Ruta absoluta

    return new Promise((resolve, reject) => {
        exec(`bash "${scriptPath}" ${BOOTNODE_IP} `, (error, stdout, stderr) => {    
            if (error) {
                reject(`Error ejecutando el script: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}


export function crearArchivosDeConfiguracion(CHAIN_ID:number, ALLOC_ADDRESS:string ): Promise<string> {
    const scriptPath = path.resolve(__dirname, "../script/crearFilesConfig.sh"); // Ruta absoluta

    return new Promise((resolve, reject) => {
        exec(`bash "${scriptPath}" ${CHAIN_ID} ${ALLOC_ADDRESS} `, (error, stdout, stderr) => {    
            if (error) {
                reject(`Error ejecutando el script: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}

export function lanzarBootnode(NETWORK_NAME:string, BOOTNODE_IP:string, BOOTNODE_PUERTO:number): Promise<string> {
    const scriptPath = path.resolve(__dirname, "../script/lanzarBootnode.sh"); // Ruta absoluta

    return new Promise((resolve, reject) => {
        exec(`bash "${scriptPath}" ${NETWORK_NAME} ${BOOTNODE_IP} ${BOOTNODE_PUERTO}`, (error, stdout, stderr) => {    
            if (error) {
                reject(`Error ejecutando el script: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}


export function lanzarNodo(NETWORK_NAME: string, NODO_PUERTO:number): Promise<string> {
    const scriptPath = path.resolve(__dirname, "../script/lanzarNodo.sh"); // Ruta absoluta

    return new Promise((resolve, reject) => {
        exec(`bash "${scriptPath}" ${NETWORK_NAME} ${NODO_PUERTO}`, (error, stdout, stderr) => {    
            if (error) {
                reject(`Error ejecutando el script: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}
