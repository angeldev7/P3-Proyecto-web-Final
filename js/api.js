/**
 * api.js
 * Módulo para consumir las APIs externas:
 * 1. countries.dev — lista de países con bandera para el registro
 * 2. Open-Meteo  — clima actual en Santo Domingo (sede ESPE)
 */

// ──────────────────────────────────────────────
// CONFIGURACIÓN de las APIs
// ──────────────────────────────────────────────

// API de países (sin clave requerida)
var URL_PAISES = "https://countries.dev/api/countries";

// API de clima Open-Meteo — coordenadas ESPE Santo Domingo de los Tsáchilas
var URL_CLIMA = "https://api.open-meteo.com/v1/forecast" +
    "?latitude=-0.25&longitude=-79.15" +
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
    "&timezone=auto";

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
// CARGAR PAÍSES desde la API countries.dev
// Retorna una promesa con el arreglo de países
// ──────────────────────────────────────────────
function cargarPaises() {
    return fetch(URL_PAISES)
        .then(function(respuesta) {
            if (!respuesta.ok) {
                throw new Error("Error al consultar la API de países. Código: " + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function(datos) {
            // Ordenamos los países por nombre para facilitar la búsqueda
            var paises = [];
            for (var pais of datos) {
                paises.push({
                    codigo:  pais.cca2  || pais.code || "",
                    nombre:  pais.name  || pais.nombre || "",
                    bandera: pais.emoji || pais.flag || ""
                });
            }
            // Ordenar alfabéticamente por nombre
            paises.sort(function(a, b) {
                if (a.nombre < b.nombre) { return -1; }
                if (a.nombre > b.nombre) { return  1; }
                return 0;
            });
            return paises;
        })
        .catch(function(error) {
            console.error("Error al cargar países:", error);
            throw error;
        });
}

// ──────────────────────────────────────────────
// INICIALIZAR el selector de países en registro.html
// Conecta el campo de búsqueda con la lista desplegable
// ──────────────────────────────────────────────
function inicializarSelectorPaises(listaPaises) {
    var campoBusqueda     = document.getElementById("buscar-pais");
    var listaDropdown     = document.getElementById("lista-paises");
    var campoPaisSeleccionado = document.getElementById("pais-seleccionado");
    var inputPaisOculto   = document.getElementById("nacionalidad");

    if (campoBusqueda === null || listaDropdown === null) {
        return; // Los elementos no existen en esta página
    }

    // Función para renderizar los países en el dropdown
    function renderizarDropdown(paisesFiltrados) {
        listaDropdown.innerHTML = "";

        if (paisesFiltrados.length === 0) {
            var itemVacio = document.createElement("li");
            itemVacio.className = "pais-item pais-vacio";
            itemVacio.textContent = "No se encontraron países";
            listaDropdown.appendChild(itemVacio);
            return;
        }

        for (var pais of paisesFiltrados) {
            var item = document.createElement("li");
            item.className = "pais-item";
            item.setAttribute("data-codigo", pais.codigo);
            item.setAttribute("data-nombre", pais.nombre);
            item.setAttribute("data-bandera", pais.bandera);
            item.innerHTML = '<span class="pais-bandera">' + pais.bandera + "</span> " + pais.nombre;

            // Evento click para seleccionar un país
            item.addEventListener("click", function() {
                var codigoPais  = this.getAttribute("data-codigo");
                var nombrePais  = this.getAttribute("data-nombre");
                var banderaPais = this.getAttribute("data-bandera");

                campoBusqueda.value     = banderaPais + " " + nombrePais;
                campoPaisSeleccionado.value = nombrePais;
                inputPaisOculto.value = JSON.stringify({
                    nombre:     nombrePais,
                    codigoPais: codigoPais,
                    bandera:    banderaPais
                });

                listaDropdown.classList.remove("dropdown-visible");
            });

            listaDropdown.appendChild(item);
        }
    }

    // Mostrar todos los países al hacer focus en el campo
    campoBusqueda.addEventListener("focus", function() {
        renderizarDropdown(listaPaises);
        listaDropdown.classList.add("dropdown-visible");
    });

    // Filtrar países mientras el usuario escribe
    campoBusqueda.addEventListener("input", function() {
        var textoBusqueda = this.value.toLowerCase().trim();
        var paisesFiltrados = [];

        for (var pais of listaPaises) {
            if (pais.nombre.toLowerCase().includes(textoBusqueda)) {
                paisesFiltrados.push(pais);
            }
        }

        renderizarDropdown(paisesFiltrados);
        listaDropdown.classList.add("dropdown-visible");
    });

    // Cerrar el dropdown al hacer clic fuera de él
    document.addEventListener("click", function(evento) {
        if (!campoBusqueda.contains(evento.target) && !listaDropdown.contains(evento.target)) {
            listaDropdown.classList.remove("dropdown-visible");
        }
    });
}

// ──────────────────────────────────────────────
// CARGAR CLIMA desde Open-Meteo
// Actualiza el panel de clima en la página
// ──────────────────────────────────────────────
function cargarClima(idContenedor) {
    var contenedor = document.getElementById(idContenedor);
    if (contenedor === null) {
        return;
    }

    // Mostrar indicador de carga
    contenedor.innerHTML =
        '<div class="clima-cargando">' +
            '<i class="fas fa-spinner fa-spin"></i>' +
            " Consultando el clima actual..." +
        "</div>";

    fetch(URL_CLIMA)
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

            contenedor.innerHTML =
                '<div class="clima-panel">' +
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
                    '<p class="clima-ubicacion"><i class="fas fa-map-marker-alt"></i> Santo Domingo, Ecuador</p>' +
                    '<button id="btn-actualizar-clima" class="btn-clima-actualizar">' +
                        '<i class="fas fa-sync-alt"></i> Actualizar' +
                    "</button>" +
                "</div>";

            // Botón para actualizar el clima manualmente
            var btnActualizar = document.getElementById("btn-actualizar-clima");
            if (btnActualizar !== null) {
                btnActualizar.addEventListener("click", function() {
                    cargarClima(idContenedor);
                });
            }
        })
        .catch(function(error) {
            console.error("Error al cargar el clima:", error);
            contenedor.innerHTML =
                '<div class="clima-error">' +
                    '<i class="fas fa-exclamation-triangle"></i>' +
                    "<p>No se pudo obtener el clima. Verifica tu conexión a internet.</p>" +
                    '<button onclick="cargarClima(\'' + idContenedor + '\')" class="btn-clima-actualizar">' +
                        "Reintentar" +
                    "</button>" +
                "</div>";
        });
}
