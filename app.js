const app = document.getElementById("app");

let DB = {
    viajes: JSON.parse(localStorage.getItem("viajes")) || [],
    gastos: JSON.parse(localStorage.getItem("gastos")) || []
};

function guardarDB(){
    localStorage.setItem("viajes", JSON.stringify(DB.viajes));
    localStorage.setItem("gastos", JSON.stringify(DB.gastos));
}

const CONCEPTOS = ["GAS","SOLRED","HOTEL","RESTAURACION","TAXI","COCHE ALQUILER","VUELOS","OTROS"];

// =======================
// INICIO
// =======================

function pantallaInicio(){
    let html=`<button onclick="nuevoViaje()">➕ Nuevo Viaje</button>`;

    DB.viajes.forEach(v=>{
        html+=`<div class="card">
            <b>${v.nombre}</b><br>
            ${v.fechaInicio} - ${v.fechaFin}<br>
            KM inicio: ${v.kmInicio}<br>
            <button onclick="abrirViaje(${v.id})">Abrir</button>
            <button onclick="borrarViaje(${v.id})">Eliminar</button>
        </div>`;
    });

    app.innerHTML = html;
}

// =======================
// VIAJES
// =======================

function nuevoViaje(){
    let nombre=prompt("Nombre viaje");
    if(!nombre) return;

    DB.viajes.push({
        id:Date.now(),
        nombre,
        fechaInicio:prompt("Fecha inicio"),
        fechaFin:prompt("Fecha fin"),
        kmInicio:parseInt(prompt("KM inicio"))||0
    });

    guardarDB();
    pantallaInicio();
}

function borrarViaje(id){
    DB.viajes = DB.viajes.filter(v=>v.id!==id);
    DB.gastos = DB.gastos.filter(g=>g.viajeId!==id);
    guardarDB();
    pantallaInicio();
}

// =======================
// GUARDAR GASTO
// =======================

function guardarNuevoGasto(viajeId){

    let concepto = document.getElementById("concepto").value;
    let pago = document.getElementById("pago").value;
    let importe = parseFloat(document.getElementById("importe").value) || 0;
    let km = parseInt(document.getElementById("km").value) || 0;

    DB.gastos.push({
        id: Date.now(),
        viajeId,
        fecha: new Date().toISOString().split("T")[0],
        concepto,
        pago,
        importe,
        km
    });

    guardarDB();
    abrirViaje(viajeId);
}

// =======================
// INFORME
// =======================

function verInforme(viajeId){

    let v = DB.viajes.find(x=>x.id===viajeId);
    let lista = DB.gastos.filter(x=>x.viajeId===viajeId);

    let resumen={}; CONCEPTOS.forEach(c=>resumen[c]={M:0,T:0});
    let kms=[];

    lista.forEach(g=>{
        if(g.pago==="METALICO") resumen[g.concepto].M+=g.importe;
        else resumen[g.concepto].T+=g.importe;

        if((g.concepto==="GAS"||g.concepto==="SOLRED") && g.km){
            kms.push(g.km);
        }
    });

    let filas="",totalM=0,totalT=0;

    CONCEPTOS.forEach(c=>{
        let M=resumen[c].M,T=resumen[c].T,total=M+T;

        filas+=`<tr>
            <td>${c}</td>
            <td>${M.toFixed(2)}</td>
            <td>${T.toFixed(2)}</td>
            <td>${total.toFixed(2)}</td>
        </tr>`;

        if(c!=="SOLRED" && c!=="HOTEL"){
            totalM+=M;
            totalT+=T;
        }
    });

    kms.sort((a,b)=>a-b);

    let listaKm=`<p><b>KM inicio:</b> ${v.kmInicio}</p>`;
    kms.forEach((k,i)=>listaKm+=`<p>Repostaje ${i+1}: ${k}</p>`);

    app.innerHTML=`
        <button onclick="abrirViaje(${viajeId})">← Volver</button>

        <h2>Informe ${v.nombre}</h2>

        <table>
        <tr><th>Concepto</th><th>Metálico</th><th>Tarjeta</th><th>Total</th></tr>
        ${filas}
        <tr><th>TOTALES</th><th>${totalM.toFixed(2)}</th><th>${totalT.toFixed(2)}</th><th>${(totalM+totalT).toFixed(2)}</th></tr>
        </table>

        <h3>Kilómetros</h3>
        ${listaKm}
    `;
}

pantallaInicio();
