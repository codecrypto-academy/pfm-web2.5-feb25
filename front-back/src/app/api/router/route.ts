import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const { action, networkName, chainId, network, recommendedIP, puertoBootnode ,allocAddress, puertoNodo} = await req.json(); // Capturar parámetros

        if (!action) {
            return NextResponse.json({ error: "Falta el parámetro 'action'" }, { status: 400 });
        }

        switch (action) {
            case "prepararNetwork":
                if (!networkName) {
                    return NextResponse.json({ error: "Falta el parámetro 'networkName'" }, { status: 400 });
                }
                return await ejecutarScript("script/prepararNetwork.sh", [networkName]);           
            
            case "crearRed":
                if (!networkName || !chainId || !network || !recommendedIP || !puertoBootnode || !allocAddress){
                    return NextResponse.json({ error: "Faltan parámetros"}, { status: 400 });
                }
                return await ejecutarScript("script/crearRed.sh", [networkName,chainId, network, recommendedIP, puertoBootnode, allocAddress]);

            case "lanzarBootnode":
                if (!networkName || !recommendedIP || !puertoBootnode) {
                    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
                }
                return await ejecutarScript("script/lanzarBootnode.sh", [networkName, recommendedIP, puertoBootnode]);   

            case "lanzarNodo":
                if (!networkName || !puertoNodo) {
                    return NextResponse.json({ error: "Falta el parámetro 'networkName' o 'puertoNodo'" }, { status: 400 });
                }
                return await ejecutarScript("script/lanzarNodo.sh", [networkName, puertoNodo]);

            
            case "testConnect":
                return NextResponse.json({ message: "🚀 Network preparada correctamente" }, { status: 200 });
            
            default:
                return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function ejecutarScript(scriptName: string, args: string[] = []) {
    try {
        const scriptPath = path.resolve(process.cwd(), scriptName);
        const command = `bash "${scriptPath}" ${args.join(" ")}`;
        const { stdout } = await execPromise(command);
        return NextResponse.json({ message: stdout });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
