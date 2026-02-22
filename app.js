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
// FORMULARIO GASTO
// =======================

function mostrarFormularioGasto(viajeId, gastoId=null){

    let gasto = gastoId ? DB.gastos.find(g=>g.id===gastoId) : null;

    let opciones = CONCEPTOS.map(c=>`<option ${gasto?.concepto===c?"selected":""}>${c}</option>`).join("");

    app.innerHTML = `
        <button onclick="abrirViaje(${viajeId})">← Volver</button>
        <h2>${gasto?"Editar":"Nuevo"} gasto</h2>

        <div class="card">
            Concepto:<br>
            <select id="concepto">${opciones}</select><br><br>

            Pago:<br>
            <select id="pago">
                <option ${gasto?.pago==="TARJETA"?"selected":""}>TARJETA</option>
                <option ${gasto?.pago==="METALICO"?"selected":""}>METALICO</option>
            </select><br><br>

            Importe:<br>
            <input type="number" id="importe" step="0.01" value="${gasto?.importe||""}"><br><br>

            Kilómetros:<br>
            <input type="number" id="km" value="${gasto?.km||""}"><br><br>

            <button onclick="guardarNuevoGasto(${viajeId}, ${gastoId||0})">💾 Guardar</button>
        </div>
    `;
}

// =======================
// GUARDAR GASTO
// =======================

function guardarNuevoGasto(viajeId, gastoId){

    let concepto = document.getElementById("concepto").value;
    let pago = document.getElementById("pago").value;
    let importe = parseFloat(document.getElementById("importe").value) || 0;
    let km = parseInt(document.getElementById("km").value) || 0;

    if(gastoId){
        let g = DB.gastos.find(x=>x.id===gastoId);
        g.concepto = concepto;
        g.pago = pago;
        g.importe = importe;
        g.km = km;
    } else {
        DB.gastos.push({
            id: Date.now(),
            viajeId,
            fecha: new Date().toISOString().split("T")[0],
            concepto,
            pago,
            importe,
            km
        });
    }

    guardarDB();
    abrirViaje(viajeId);
}

// =======================
// DETALLE VIAJE
// =======================

function abrirViaje(id){

    let v = DB.viajes.find(x=>x.id===id);
    let gastos = DB.gastos.filter(x=>x.viajeId===id);

    let html=`
        <button onclick="pantallaInicio()">← Volver</button>
        <h2>${v.nombre}</h2>

        <button onclick="mostrarFormularioGasto(${id})">➕ Gasto</button>
        <button onclick="verInforme(${id})">📊 Informe</button>

        <table>
        <tr><th>Fecha</th><th>Concepto</th><th>Pago</th><th>€</th><th>KM</th><th></th></tr>
    `;

    gastos.forEach(g=>{
        html+=`
        <tr>
            <td>${g.fecha}</td>
            <td>${g.concepto}</td>
            <td>${g.pago}</td>
            <td>${g.importe.toFixed(2)}</td>
            <td>${g.km||""}</td>
            <td>
                <button onclick="mostrarFormularioGasto(${id}, ${g.id})">✏</button>
                <button onclick="borrarGasto(${g.id},${id})">🗑</button>
            </td>
        </tr>`;
    });

    html+="</table>";
    app.innerHTML=html;
}

function borrarGasto(id, viajeId){
    DB.gastos = DB.gastos.filter(g=>g.id!==id);
    guardarDB();
    abrirViaje(viajeId);
}

// =======================
// INFORME + MODO IMPRIMIR
// =======================

function verInforme(viajeId){

    let v = DB.viajes.find(x=>x.id===viajeId);
    let lista = DB.gastos.filter(x=>x.viajeId===viajeId);

    let resumen={}; CONCEPTOS.forEach(c=>resumen[c]={M:0,T:0});

    lista.forEach(g=>{
        if(g.pago==="METALICO") resumen[g.concepto].M+=g.importe;
        else resumen[g.concepto].T+=g.importe;
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

    app.innerHTML=`
        <button onclick="abrirViaje(${viajeId})">← Volver</button>
        <button onclick="modoImprimir()">🖨 Ver para Imprimir</button>

        <div id="zonaPDF">
        <h2>Informe ${v.nombre}</h2>
        <table>
        <tr><th>Concepto</th><th>Metálico</th><th>Tarjeta</th><th>Total</th></tr>
        ${filas}
        <tr><th>TOTALES</th><th>${totalM.toFixed(2)}</th><th>${totalT.toFixed(2)}</th><th>${(totalM+totalT).toFixed(2)}</th></tr>
        </table>
        </div>
    `;
}

// =======================
// MODO IMPRIMIR (FUNCIONA EN APK)
// =======================

function modoImprimir(){

    let contenido = document.getElementById("zonaPDF").innerHTML;

    app.innerHTML = `
        <button onclick="location.reload()">← Volver</button>

        <div style="padding:20px;font-family:Arial">
            ${contenido}
        </div>

        <p style="padding:20px;color:gray">
        Usa el menú del móvil → Compartir → Imprimir o Guardar PDF
        </p>
    `;
}

pantallaInicio();
