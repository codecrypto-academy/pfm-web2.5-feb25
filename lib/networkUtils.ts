// Utilidades

//Convierte una dirección IPv4 en un número entero para comparaciones.
export function ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

//Verifica si una IP pertenece a una red en formato CIDR.
export function isIpInNetwork(ip: string, network: string): boolean {
    const [networkIp, prefix] = network.split('/');
    if (!networkIp || !prefix) return false; // Validación básica

    const networkNum = ipToNumber(networkIp);
    const ipNum = ipToNumber(ip);
    const mask = ~((1 << (32 - parseInt(prefix, 10))) - 1);
    
    return (ipNum & mask) === (networkNum & mask);
}
