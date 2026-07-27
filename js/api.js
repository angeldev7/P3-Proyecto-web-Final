/**
 * api.js
 * Módulo para consumir la API externa de clima:
 * Open-Meteo — clima actual en las sedes de la Universidad ESPE (Santo Domingo y Sangolquí)
 */

// ──────────────────────────────────────────────
// Mapa de códigos de clima (weather_code) de Open-Meteo
// a descripción en español e ícono FontAwesome
// ──────────────────────────────────────────────
var ESTADOS_CLIMA = {
    0:  { descripcion: "Despejado",            icono: "fa-sun" },
    1:  { descripcion: "Mayormente despejado", icono: "fa-sun" },
    2:  { descripcion: "Parcialmente nublado", icono: "fa-cloud-sun" },
    3:  { descripcion: "Nublado",              icono: "fa-cloud" },
    45: { descripcion: "Niebla",               icono: "fa-smog" },
    48: { descripcion: "Niebla helada",        icono: "fa-smog" },
    51: { descripcion: "Llovizna leve",        icono: "fa-cloud-drizzle" },
    61: { descripcion: "Lluvia ligera",        icono: "fa-cloud-rain" },
    63: { descripcion: "Lluvia moderada",      icono: "fa-cloud-showers-heavy" },
    65: { descripcion: "Lluvia intensa",       icono: "fa-cloud-showers-heavy" },
    80: { descripcion: "Chubascos",            icono: "fa-cloud-rain" },
    95: { descripcion: "Tormenta eléctrica",   icono: "fa-bolt" }
};

// ──────────────────────────────────────────────
// Coordenadas de las 2 sedes principales de la ESPE para Open-Meteo
// ──────────────────────────────────────────────
var CIUDADES_CLIMA = {
    "santo-domingo": { nombre: "Santo Domingo (Luz de América)", lat: -0.25, lon: -79.15 },
    "sangolqui":     { nombre: "Sede Matriz (Quito - Sangolquí)",  lat: -0.31, lon: -78.44 }
};

// ──────────────────────────────────────────────
// CARGAR CLIMA desde Open-Meteo
// Permite seleccionar la ciudad dinámicamente
// ──────────────────────────────────────────────
function cargarClima(idContenedor, claveCiudad) {
    if (!claveCiudad || !CIUDADES_CLIMA[claveCiudad]) {
        claveCiudad = "santo-domingo";
    }

    var ciudadObj = CIUDADES_CLIMA[claveCiudad];
    var urlClimaCiudad = "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + ciudadObj.lat + "&longitude=" + ciudadObj.lon +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
        "&timezone=auto";

    var contenedor = document.getElementById(idContenedor);
    if (contenedor === null) {
        return;
    }

    contenedor.innerHTML =
        '<div class="clima-cargando">' +
            '<i class="fas fa-spinner fa-spin"></i>' +
            " Consultando el clima de " + ciudadObj.nombre + "..." +
        "</div>";

    fetch(urlClimaCiudad)
        .then(function(respuesta) {
            if (!respuesta.ok) {
                throw new Error("Error al consultar el clima. Código: " + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function(datos) {
            var actual       = datos.current;
            var temperatura  = actual.temperature_2m;
            var humedad      = actual.relative_humidity_2m;
            var viento       = actual.wind_speed_10m;
            var codigoClima  = actual.weather_code;

            var estadoClima  = ESTADOS_CLIMA[codigoClima] || { descripcion: "Variable", icono: "fa-cloud" };

            // Construir opciones del selector de ciudades
            var opcionesCiudad = "";
            var clavesCiudades = Object.keys(CIUDADES_CLIMA);
            for (var cKey of clavesCiudades) {
                var selectedAttr = (cKey === claveCiudad) ? "selected" : "";
                opcionesCiudad = opcionesCiudad + '<option value="' + cKey + '" ' + selectedAttr + '>' + CIUDADES_CLIMA[cKey].nombre + '</option>';
            }

            // Lógica de negocio: Recomendación de menú según el clima actual
            var recomendacionMenu = "";
            var esLluviaOFrio = (codigoClima >= 51 && codigoClima <= 95) || temperatura < 21;

            if (esLluviaOFrio) {
                recomendacionMenu = '<div class="clima-recomendacion clima-rec-frio">' +
                    '<i class="fas fa-mug-hot"></i> <strong>Recomendación FastMenu:</strong> El clima está fresco/lluvioso (' + temperatura + '°C). ¡Te sugerimos un <em>Caldo de Gallina caliente</em> o un <em>Café pasado con tostada</em>!' +
                    '</div>';
            } else {
                recomendacionMenu = '<div class="clima-recomendacion clima-rec-calor">' +
                    '<i class="fas fa-ice-cream"></i> <strong>Recomendación FastMenu:</strong> ¡Hace buen clima en el campus (' + temperatura + '°C)! Te sugerimos acompañar tu almuerzo con una <em>Gaseosa Helada</em> o un <em>Helado de Paila</em>.' +
                    '</div>';
            }

            contenedor.innerHTML =
                '<div class="clima-panel">' +
                    '<div class="clima-selector-ciudad">' +
                        '<label for="select-ciudad-' + idContenedor + '"><i class="fas fa-city"></i> Ciudad:</label>' +
                        '<select id="select-ciudad-' + idContenedor + '">' + opcionesCiudad + '</select>' +
                    '</div>' +
                    '<div class="clima-principal">' +
                        '<i class="fas ' + estadoClima.icono + ' clima-icono-grande"></i>' +
                        '<div class="clima-temperatura">' +
                            "<span>" + temperatura + "°C</span>" +
                            "<p>" + estadoClima.descripcion + "</p>" +
                        "</div>" +
                    "</div>" +
                    '<div class="clima-detalles">' +
                        '<div class="clima-dato">' +
                            '<i class="fas fa-tint"></i>' +
                            "<span>Humedad</span>" +
                            "<strong>" + humedad + "%</strong>" +
                        "</div>" +
                        '<div class="clima-dato">' +
                            '<i class="fas fa-wind"></i>' +
                            "<span>Viento</span>" +
                            "<strong>" + viento + " km/h</strong>" +
                        "</div>" +
                    "</div>" +
                    recomendacionMenu +
                    '<p class="clima-ubicacion"><i class="fas fa-map-marker-alt"></i> ' + ciudadObj.nombre + ', Ecuador</p>' +
                    '<button id="btn-actualizar-clima-' + idContenedor + '" class="btn-clima-actualizar">' +
                        '<i class="fas fa-sync-alt"></i> Actualizar clima' +
                    "</button>" +
                "</div>";

            // Evento para cambiar de ciudad
            var selectCiudadEl = document.getElementById("select-ciudad-" + idContenedor);
            if (selectCiudadEl !== null) {
                selectCiudadEl.addEventListener("change", function() {
                    cargarClima(idContenedor, this.value);
                });
            }

            // Botón para actualizar el clima manualmente
            var btnActualizar = document.getElementById("btn-actualizar-clima-" + idContenedor);
            if (btnActualizar !== null) {
                btnActualizar.addEventListener("click", function() {
                    cargarClima(idContenedor, claveCiudad);
                });
            }
        })
        .catch(function(error) {
            console.error("Error al cargar el clima:", error);
            contenedor.innerHTML =
                '<div class="clima-error">' +
                    '<i class="fas fa-exclamation-triangle"></i>' +
                    "<p>No se pudo obtener el clima. Verifica tu conexión.</p>" +
                    '<button id="btn-reintentar-clima-' + idContenedor + '" class="btn-clima-actualizar">' +
                        "Reintentar" +
                    "</button>" +
                "</div>";

            var btnReintentar = document.getElementById("btn-reintentar-clima-" + idContenedor);
            if (btnReintentar !== null) {
                btnReintentar.addEventListener("click", function() {
                    cargarClima(idContenedor, claveCiudad);
                });
            }
        });
}
