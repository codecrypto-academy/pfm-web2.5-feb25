"use client";

import { useState } from "react";
import { FaSyncAlt } from "react-icons/fa"; // Icono para el botón de calcular

export default function NetworkPage() {
  const [status, setStatus] = useState<string>("");
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);
  const [isLoadingClean, setIsLoadingClean] = useState(false);
  const [isLoadingNet, setIsLoadingNet] = useState(false);
  const [isLoadingBootnode, setIsLoadingBootnode] = useState(false);
  const [isLoadingNewNode, setIsLoadingNewNode] = useState(false);

  const [networkName, setNetworkName] = useState("");
  const [chainId, setChainId] = useState("");
  const [allocAddress, setAllocAddress] = useState("e0fa3AB82068b8BE514F75179182b7409b1dA51C");
  const [puertoBootnode, setPuertoBootnode] = useState("");
  const [puertoNodo, setPuertoNodo] = useState("");
  
  const [network, setNetwork] = useState<string>(""); 
  const [recommendedIP, setRecommendedIP] = useState<string>(""); 
  const [error, setError] = useState<string>(""); 

   // Función para calcular una IP dentro de la subred ingresada
   const calcularIPRecomendada = () => {
    setError("");
    setRecommendedIP("");

    if (!network) {
      setError("Ingresa una dirección de red.");
      return;
    }

    const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(16|24|32)$/;
    const match = network.match(regex);

    if (!match) {
      setError("Formato inválido. Usa IPv4 con /16, /24 o /32.");
      return;
    }

    const baseIP = match[1];
    const mask = parseInt(match[2]);

    const ipParts = baseIP.split(".").map(Number);
    if (ipParts.some(part => part < 0 || part > 255)) {
      setError("IP fuera de rango.");
      return;
    }

    let ipValida = "";
    if (mask === 16) {
      ipValida = `${ipParts[0]}.${ipParts[1]}.1.100`;
    } else if (mask === 24) {
      ipValida = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.100`;
    } else if (mask === 32) {
      ipValida = baseIP;
    }

    setRecommendedIP(ipValida);
  };

 
  async function ejecutarAccion(body: any, setLoading: (value: boolean) => void) {
    setStatus("");
    setLoading(true);

    try {
      const response = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Error executing the action");
      }
      const data = await response.json();
      setStatus(`${data.message}`);
    } catch (error) {
      setStatus(`❌ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  function prepararNetwork() {
    if (!networkName) {
      setStatus("❌ Error: You must enter the network name.");
      return;
    }
    ejecutarAccion({ action: "prepararNetwork", networkName }, setIsLoadingClean);
  }

  function crearRed() {
    if (!networkName || !chainId || !network || !recommendedIP || !puertoBootnode || !allocAddress) {
      setStatus("❌ Error: You must enter all required parameters.");
      return;
    }
    ejecutarAccion({ action: "crearRed", networkName, chainId, network, recommendedIP,puertoBootnode, allocAddress }, setIsLoadingNet);
  }

  function lanzarBootnode(){
    if (!networkName || !recommendedIP || !puertoBootnode) {
      setStatus("❌ Error: You must enter the network name and bootnode");
      return;
    }
    ejecutarAccion({ action: "lanzarBootnode", networkName, recommendedIP, puertoBootnode}, setIsLoadingBootnode);
  }

  function lanzarNodo() {
    if (!networkName || !puertoNodo ) {
      setStatus("❌ Error: You must enter the network name.");
      return;
    }
    ejecutarAccion({ action: "lanzarNodo", networkName, puertoNodo}, setIsLoadingNewNode);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Network Management</h1>
      <p>Manage blockchain networks here</p>
      <br />

      <div className="grid grid-cols-4 gap-8">
        <div>
          <h2 className="text-xl font-semibold">Entering parameters</h2>
          <label className="text-xs text-gray-500">Network name</label>
          <input
            type="text"
            placeholder="Ej: MyNetwork"
            className="border p-2 w-full my-1"
            value={networkName}
            onChange={(e) => setNetworkName(e.target.value)}
          />

          <label className="text-xs text-gray-500">Chain ID</label>
          <input
            type="number"
            placeholder="Ej: 1337"
            className="border p-2 w-full my-1"
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
          />

        <label className="text-xs text-gray-500">Network address</label>
        <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Ej: 192.168.1.0/24"
          className="border p-2 w-full my-2 pr-10"
          value={network}
          onChange={(e) => setNetwork(e.target.value || "")} // Evita undefined
        />
        <button
          onClick={calcularIPRecomendada}
          className="absolute right-3 text-gray-500 hover:text-black"
          title="Calcular IP"
        >
        <FaSyncAlt />
        </button>
        </div> 
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {recommendedIP && (
            <p className="mt-2 text-green-600 font-semibold">
              Bootnode: valid IP {recommendedIP}
            </p>

        )}

        <label className="text-xs text-gray-500">Bootnode port</label>
        <input
            type="number"
            placeholder="Puerto bootnode"
            className="border p-2 w-full my-2"
            value={puertoBootnode}
            onChange={(e) => setPuertoBootnode(e.target.value)}
          />


        <label className="text-xs text-gray-500">Alloc Address</label>
          <input
            type="text"
            placeholder="0x..."
            className="w-full p-2 border my-1"
            value={allocAddress}
            onChange={(e) => setAllocAddress(e.target.value)}
        />

       <button className="bg-blue-200 text-black px-4 py-2 rounded w-full mt-2" disabled={isLoadingParameters}>
            {isLoadingParameters ? "Running...." : "Validate parameters"}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Preliminary cleaning steps</h2>
          <br/>
          <p>🔹 Clean the network folder</p>
          <p>🔹 Clean the bootnode subfolder</p>
          <p>🔹 Create them if they don't exist</p>
          <p>🔹 Clean network in <b>Docker</b> if it exists</p>
          <p>🔹 Clean nodes in <b>Docker</b> if it exists</p>
          <br/> <br/>
          <p className="text-sm italic">Requires: network name</p>
          <button
            onClick={prepararNetwork}
            className="bg-purple-200 text-black px-4 py-2 rounded w-full mt-2"
            disabled={isLoadingClean}
          >
            {isLoadingClean ? "Running...." : "Start cleaning"}
          </button>     
        </div>

        <div>
          <h2 className="text-xl font-semibold">Create network</h2>
          <br/>
          <p>🔹 Create a <b>Docker</b> network</p>
          <p>🔹 Create the bootnode</p>
          <p>🔹 Create genesis.json</p>
          <p>🔹 Create config.toml</p>
          <p>🔹 Launch the bootnode</p>
          <br/> <br/>

          <p className="text-sm italic">Requires: Validate parameters</p>
          <button
            onClick={crearRed}
            className="bg-green-200 text-black px-4 py-2 rounded w-full mt-2"
            disabled={isLoadingNet}
          >
            {isLoadingNet ? "Running...." : "Network Setup"}
          </button>
          
          <button
            onClick={lanzarBootnode}
            className="bg-green-200 text-black px-4 py-2 rounded w-full mt-2"
            disabled={isLoadingBootnode}
          >
            {isLoadingBootnode ? "Running...." : "Launch the bootnode"}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Lanch Nodes</h2>
          <label className="text-xs text-gray-500">Node port</label>
          <input
            type="number"
            placeholder="Puerto de nodo"
            className="border p-2 w-full my-2"
            value={puertoNodo}
            onChange={(e) => setPuertoNodo(e.target.value)}
          />
          <button
            onClick={lanzarNodo}
            className="bg-orange-200 text-black px-4 py-2 rounded w-full mt-2"
            disabled={isLoadingNewNode}
          >
            {isLoadingNewNode ? "Running...." : "Launch Node"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
      <div>
          <h2 className="text-xl font-semibold text-right">Results Board</h2>
          <p className="mt-4 p-4 border border-gray-300 bg-gray-100 rounded-md shadow-sm min-h-[50px]">
          {status || "Waiting for actions..."}
        </p>
      </div>
      </div>  
    </div>
  );
}
