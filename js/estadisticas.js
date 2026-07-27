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
    // Total de productos registrados
    var totalProductos = productos.length;

    // Total de categorías que tienen al menos un producto
    var categoriasConProductos = new Set();
    for (var producto of productos) {
        categoriasConProductos.add(producto.categoriaId);
    }
    var totalCategorias = categoriasConProductos.size;

    // Productos disponibles y agotados
    var disponibles = 0;
    var agotados    = 0;
    for (var prod of productos) {
        if (prod.estado === "disponible" && prod.stock > 0) {
            disponibles++;
        } else {
            agotados++;
        }
    }

    // Precio promedio del menú
    var sumaPrecios = 0;
    for (var p of productos) {
        sumaPrecios = sumaPrecios + p.precio;
    }
    var precioPromedio = (sumaPrecios / productos.length).toFixed(2);

    // Producto más caro
    var masCaro = productos[0];
    for (var item of productos) {
        if (item.precio > masCaro.precio) {
            masCaro = item;
        }
    }

    // Producto más barato
    var masBarato = productos[0];
    for (var item2 of productos) {
        if (item2.precio < masBarato.precio) {
            masBarato = item2;
        }
    }

    // Total de usuarios registrados
    var usuariosGuardados = obtenerDeStorage(CLAVE_USUARIOS);
    var totalUsuarios = 0;
    if (usuariosGuardados !== null) {
        totalUsuarios = usuariosGuardados.length;
    }

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
        "rgba(231, 76, 60, 0.8)",   // Rojo — Almuerzos
        "rgba(41, 128, 185, 0.8)",  // Azul — Bebidas
        "rgba(243, 156, 18, 0.8)",  // Naranja — Snacks
        "rgba(39, 174, 96, 0.8)"    // Verde — Combos
    ];
    var coloresBorde = [
        "rgba(231, 76, 60, 1)",
        "rgba(41, 128, 185, 1)",
        "rgba(243, 156, 18, 1)",
        "rgba(39, 174, 96, 1)"
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
                        color:    "#ecf0f1",
                        font:     { size: 13, family: "'Inter', sans-serif" },
                        padding:  16
                    }
                },
                title: {
                    display: true,
                    text:    "Distribución de productos por categoría",
                    color:   "#ecf0f1",
                    font:    { size: 15, family: "'Inter', sans-serif" }
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
