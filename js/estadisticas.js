/**
 * estadisticas.js
 * Módulo para calcular y mostrar el panel de indicadores
 * y el gráfico de Chart.js con productos por categoría.
 */

// Variable global para guardar la instancia del gráfico
var graficoProductos = null;

// ──────────────────────────────────────────────
// Calcular y mostrar el PANEL DE INDICADORES
// ──────────────────────────────────────────────
function actualizarPanelIndicadores(productos, listaCategorias) {
    if (!productos || productos.length === 0) {
        return;
    }

    // Total de productos registrados
    var totalProductos = productos.length;

    // Total de categorías usando map() y Set()
    var categoriasIds = productos.map(function(p) { return p.categoriaId; });
    var totalCategorias = new Set(categoriasIds).size;

    // Productos disponibles usando filter()
    var listaDisponibles = productos.filter(function(p) {
        return p.estado === "disponible" && p.stock > 0;
    });
    var disponibles = listaDisponibles.length;

    // Productos agotados usando filter()
    var listaAgotados = productos.filter(function(p) {
        return p.estado === "agotado" || p.stock === 0;
    });
    var agotados = listaAgotados.length;

    // Precio promedio del menú usando reduce()
    var sumaPrecios = productos.reduce(function(acumulador, p) {
        return acumulador + p.precio;
    }, 0);
    var precioPromedio = (sumaPrecios / productos.length).toFixed(2);

    // Producto más caro usando reduce()
    var masCaro = productos.reduce(function(max, p) {
        return (p.precio > max.precio) ? p : max;
    }, productos[0]);

    // Producto más barato usando reduce()
    var masBarato = productos.reduce(function(min, p) {
        return (p.precio < min.precio) ? p : min;
    }, productos[0]);

    // Verificación con some(): ¿Hay productos agotados?
    var hayAgotados = productos.some(function(p) { return p.stock === 0; });

    // Verificación con every(): ¿Todos tienen precio válido?
    var todosPreciosValidos = productos.every(function(p) { return p.precio > 0; });

    // Búsqueda con find(): Ejemplo de producto disponible
    var primerDisponible = productos.find(function(p) { return p.stock > 0; });

    // Total de usuarios registrados en localStorage
    var usuariosGuardados = obtenerDeStorage(CLAVE_USUARIOS);
    var totalUsuarios = (usuariosGuardados !== null) ? usuariosGuardados.length : 0;

    // Total items en el carrito actual
    var totalCarrito = contarItemsCarrito();

    // Actualizar los elementos del DOM
    actualizarIndicador("ind-total-productos",  totalProductos);
    actualizarIndicador("ind-total-categorias", totalCategorias);
    actualizarIndicador("ind-disponibles",      disponibles);
    actualizarIndicador("ind-agotados",         agotados);
    actualizarIndicador("ind-precio-promedio",  "$" + precioPromedio);
    actualizarIndicador("ind-mas-caro",         masCaro.nombre + " ($" + masCaro.precio.toFixed(2) + ")");
    actualizarIndicador("ind-mas-barato",       masBarato.nombre + " ($" + masBarato.precio.toFixed(2) + ")");
    actualizarIndicador("ind-usuarios",         totalUsuarios);
    actualizarIndicador("ind-carrito",          totalCarrito);
}

// ──────────────────────────────────────────────
// Actualizar el texto de un indicador por su id
// ──────────────────────────────────────────────
function actualizarIndicador(idElemento, valor) {
    var elemento = document.getElementById(idElemento);
    if (elemento !== null) {
        elemento.textContent = valor;
    }
}

// ──────────────────────────────────────────────
// Contar productos por categoría
// Devuelve un objeto: { nombreCategoria: cantidad }
// ──────────────────────────────────────────────
function contarPorCategoria(productos, listaCategorias) {
    var resultado = {};

    for (var categoria of listaCategorias) {
        resultado[categoria.nombre] = 0;
    }

    for (var producto of productos) {
        var nombreCategoria = obtenerNombreCategoria(producto.categoriaId, listaCategorias);
        if (resultado[nombreCategoria] !== undefined) {
            resultado[nombreCategoria] = resultado[nombreCategoria] + 1;
        }
    }

    return resultado;
}

// ──────────────────────────────────────────────
// Crear o actualizar el gráfico de Chart.js
// Muestra un gráfico de dona con productos por categoría
// ──────────────────────────────────────────────
function actualizarGrafico(productos, listaCategorias) {
    var canvas = document.getElementById("grafico-categorias");
    if (canvas === null) {
        return; // El canvas no existe en esta página
    }

    var conteo  = contarPorCategoria(productos, listaCategorias);
    var etiquetas = Object.keys(conteo);
    var valores   = Object.values(conteo);

    var coloresFondos = [
        "rgba(231, 76, 60, 0.85)",   // Rojo — Almuerzos
        "rgba(41, 128, 185, 0.85)",  // Azul — Bebidas
        "rgba(243, 156, 18, 0.85)",  // Naranja — Snacks
        "rgba(39, 174, 96, 0.85)",   // Verde — Combos
        "rgba(211, 84, 0, 0.85)",    // Naranja Oscuro — Desayunos
        "rgba(142, 68, 173, 0.85)"   // Púrpura — Postres
    ];
    var coloresBorde = [
        "rgba(231, 76, 60, 1)",
        "rgba(41, 128, 185, 1)",
        "rgba(243, 156, 18, 1)",
        "rgba(39, 174, 96, 1)",
        "rgba(211, 84, 0, 1)",
        "rgba(142, 68, 173, 1)"
    ];

    // Si ya existe un gráfico, lo destruimos antes de crear uno nuevo
    if (graficoProductos !== null) {
        graficoProductos.destroy();
    }

    var contexto = canvas.getContext("2d");
    graficoProductos = new Chart(contexto, {
        type: "doughnut",
        data: {
            labels:   etiquetas,
            datasets: [
                {
                    label:           "Productos por categoría",
                    data:            valores,
                    backgroundColor: coloresFondos,
                    borderColor:     coloresBorde,
                    borderWidth:     2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color:    "#333333",
                        font:     { size: 13, weight: "bold", family: "'Inter', sans-serif" },
                        padding:  16
                    }
                },
                title: {
                    display: true,
                    text:    "Distribución de productos por categoría",
                    color:   "#8b0000",
                    font:    { size: 16, weight: "bold", family: "'Inter', sans-serif" }
                },
                tooltip: {
                    callbacks: {
                        label: function(contextoTooltip) {
                            var valor = contextoTooltip.parsed;
                            var total = 0;
                            for (var v of contextoTooltip.dataset.data) {
                                total = total + v;
                            }
                            var porcentaje = ((valor / total) * 100).toFixed(1);
                            return " " + valor + " productos (" + porcentaje + "%)";
                        }
                    }
                }
            }
        }
    });
}
