/**
 * main.js
 * Orquestador de la página principal (principal.html).
 * Coordina la carga de datos, renderizado del menú,
 * búsqueda, filtros, ordenamiento y estadísticas.
 */

// Variables globales de esta página
var todosLosProductos  = [];
var todasLasCategorias = [];

// ──────────────────────────────────────────────
// Punto de entrada: esperar a que el DOM esté listo
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
    inicializarPaginaPrincipal();
});

// ──────────────────────────────────────────────
// Inicializar toda la página principal
// ──────────────────────────────────────────────
function inicializarPaginaPrincipal() {
    var contenedorMenu = document.getElementById("contenedor-menu");
    if (contenedorMenu === null) {
        return;
    }

    mostrarIndicadorCarga(contenedorMenu, "Cargando el menú del día...");

    // Cargar categorías y productos en paralelo
    var promesaCategorias = cargarCategorias();
    var promesaProductos  = cargarProductos();

    Promise.all([promesaCategorias, promesaProductos])
        .then(function(resultados) {
            todasLasCategorias = resultados[0];
            todosLosProductos  = resultados[1];

            // Renderizar el menú completo
            renderizarMenuPorCategorias(todosLosProductos, todasLasCategorias, contenedorMenu);

            // Llenar el selector de categorías para filtrar
            llenarSelectorCategorias(todasLasCategorias);

            // Actualizar el panel de indicadores
            actualizarPanelIndicadores(todosLosProductos, todasLasCategorias);

            // Crear el gráfico de Chart.js
            actualizarGrafico(todosLosProductos, todasLasCategorias);

            // Actualizar contador del carrito en la navbar
            actualizarContadorCarrito();

            // Cargar el clima en el panel correspondiente
            cargarClima("panel-clima");

            // Activar los eventos de interacción
            activarEventosBusqueda();
            activarEventosFiltros();
            activarEventosOrdenamiento();
            activarEventosTarjetas(contenedorMenu);

            // Mostrar saludo al usuario activo si existe
            mostrarSaludoUsuario();
        })
        .catch(function(error) {
            contenedorMenu.innerHTML =
                '<div class="mensaje-error">' +
                    '<i class="fas fa-exclamation-circle fa-2x"></i>' +
                    "<p>Error al cargar el menú. Asegúrate de usar Live Server.</p>" +
                    "<small>" + error.message + "</small>" +
                "</div>";
        });
}

// ──────────────────────────────────────────────
// Llenar el selector de categorías con opciones dinámicas
// ──────────────────────────────────────────────
function llenarSelectorCategorias(listaCategorias) {
    var selectCategoria = document.getElementById("filtro-categoria");
    if (selectCategoria === null) {
        return;
    }

    // Mantener la opción "Todas"
    selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';

    for (var categoria of listaCategorias) {
        var opcion = document.createElement("option");
        opcion.value = categoria.id;
        opcion.textContent = categoria.nombre;
        selectCategoria.appendChild(opcion);
    }
}

// ──────────────────────────────────────────────
// Obtener los valores actuales de los filtros y la búsqueda
// ──────────────────────────────────────────────
function obtenerFiltrosActuales() {
    var textoBusqueda  = "";
    var categoriaId    = "";
    var estadoFiltro   = "";
    var ordenamiento   = "";
    var precioMin      = 0;
    var precioMax      = Infinity;

    var campoBusqueda = document.getElementById("busqueda-menu");
    if (campoBusqueda !== null) {
        textoBusqueda = campoBusqueda.value.toLowerCase().trim();
    }

    var selectCategoria = document.getElementById("filtro-categoria");
    if (selectCategoria !== null) {
        categoriaId = selectCategoria.value;
    }

    var selectEstado = document.getElementById("filtro-estado");
    if (selectEstado !== null) {
        estadoFiltro = selectEstado.value;
    }

    var selectOrden = document.getElementById("filtro-orden");
    if (selectOrden !== null) {
        ordenamiento = selectOrden.value;
    }

    var campoPrecioMin = document.getElementById("filtro-precio-min");
    if (campoPrecioMin !== null && campoPrecioMin.value !== "") {
        precioMin = parseFloat(campoPrecioMin.value);
    }

    var campoPrecioMax = document.getElementById("filtro-precio-max");
    if (campoPrecioMax !== null && campoPrecioMax.value !== "") {
        precioMax = parseFloat(campoPrecioMax.value);
    }

    return {
        texto:       textoBusqueda,
        categoriaId: categoriaId,
        estado:      estadoFiltro,
        orden:       ordenamiento,
        precioMin:   precioMin,
        precioMax:   precioMax
    };
}

// ──────────────────────────────────────────────
// Aplicar búsqueda, filtros y ordenamiento
// ──────────────────────────────────────────────
function aplicarFiltros() {
    var filtros = obtenerFiltrosActuales();
    var productosFiltrados = [];

    // Filtrar cada producto según los criterios actuales
    for (var producto of todosLosProductos) {
        var nombreCategoria = obtenerNombreCategoria(producto.categoriaId, todasLasCategorias);

        // Filtro de texto: busca en nombre, descripción y categoría
        var coincideTexto = true;
        if (filtros.texto !== "") {
            var textoProducto = (producto.nombre + " " + producto.descripcion + " " + nombreCategoria).toLowerCase();
            coincideTexto = textoProducto.includes(filtros.texto);
        }

        // Filtro de categoría
        var coincideCategoria = true;
        if (filtros.categoriaId !== "") {
            coincideCategoria = producto.categoriaId === parseInt(filtros.categoriaId);
        }

        // Filtro de estado
        var coincideEstado = true;
        if (filtros.estado !== "") {
            coincideEstado = producto.estado === filtros.estado;
        }

        // Filtro de precio
        var coincidePrecio = (producto.precio >= filtros.precioMin && producto.precio <= filtros.precioMax);

        if (coincideTexto && coincideCategoria && coincideEstado && coincidePrecio) {
            productosFiltrados.push(producto);
        }
    }

    // Aplicar ordenamiento
    productosFiltrados = ordenarProductos(productosFiltrados, filtros.orden);

    // Renderizar el resultado
    var contenedorMenu = document.getElementById("contenedor-menu");
    if (contenedorMenu !== null) {
        renderizarMenuPorCategorias(productosFiltrados, todasLasCategorias, contenedorMenu);
        activarEventosTarjetas(contenedorMenu);
    }

    // Mostrar cantidad de resultados encontrados
    var contadorResultados = document.getElementById("contador-resultados");
    if (contadorResultados !== null) {
        contadorResultados.textContent = "Se encontraron " + productosFiltrados.length + " producto(s).";
    }
}

// ──────────────────────────────────────────────
// Ordenar el arreglo de productos según el criterio
// ──────────────────────────────────────────────
function ordenarProductos(productos, criterio) {
    // Creamos una copia para no alterar el arreglo original
    var copia = productos.slice();

    if (criterio === "precio-asc") {
        copia.sort(function(a, b) { return a.precio - b.precio; });
    } else if (criterio === "precio-desc") {
        copia.sort(function(a, b) { return b.precio - a.precio; });
    } else if (criterio === "nombre-asc") {
        copia.sort(function(a, b) {
            if (a.nombre < b.nombre) { return -1; }
            if (a.nombre > b.nombre) { return  1; }
            return 0;
        });
    } else if (criterio === "nombre-desc") {
        copia.sort(function(a, b) {
            if (a.nombre > b.nombre) { return -1; }
            if (a.nombre < b.nombre) { return  1; }
            return 0;
        });
    } else if (criterio === "stock-desc") {
        copia.sort(function(a, b) { return b.stock - a.stock; });
    }
    // Si no hay criterio, mantiene el orden original

    return copia;
}

// ──────────────────────────────────────────────
// Activar evento de búsqueda en tiempo real
// ──────────────────────────────────────────────
function activarEventosBusqueda() {
    var campoBusqueda = document.getElementById("busqueda-menu");
    if (campoBusqueda === null) {
        return;
    }

    campoBusqueda.addEventListener("input", function() {
        aplicarFiltros();
    });
}

// ──────────────────────────────────────────────
// Activar eventos de filtros (change)
// ──────────────────────────────────────────────
function activarEventosFiltros() {
    var selectores = ["filtro-categoria", "filtro-estado", "filtro-precio-min", "filtro-precio-max"];

    for (var idSelector of selectores) {
        var elemento = document.getElementById(idSelector);
        if (elemento !== null) {
            elemento.addEventListener("change", function() {
                aplicarFiltros();
            });
        }
    }

    // Botón para limpiar todos los filtros
    var btnLimpiar = document.getElementById("btn-limpiar-filtros");
    if (btnLimpiar !== null) {
        btnLimpiar.addEventListener("click", function() {
            limpiarTodosLosFiltros();
        });
    }
}

// ──────────────────────────────────────────────
// Activar evento de ordenamiento
// ──────────────────────────────────────────────
function activarEventosOrdenamiento() {
    var selectOrden = document.getElementById("filtro-orden");
    if (selectOrden === null) {
        return;
    }

    selectOrden.addEventListener("change", function() {
        aplicarFiltros();
    });
}

// ──────────────────────────────────────────────
// Limpiar todos los filtros y mostrar el menú completo
// ──────────────────────────────────────────────
function limpiarTodosLosFiltros() {
    var idsAClear = ["busqueda-menu", "filtro-precio-min", "filtro-precio-max"];
    for (var id of idsAClear) {
        var campo = document.getElementById(id);
        if (campo !== null) {
            campo.value = "";
        }
    }

    var selectores = ["filtro-categoria", "filtro-estado", "filtro-orden"];
    for (var idSelect of selectores) {
        var select = document.getElementById(idSelect);
        if (select !== null) {
            select.selectedIndex = 0;
        }
    }

    var contenedorMenu = document.getElementById("contenedor-menu");
    if (contenedorMenu !== null) {
        renderizarMenuPorCategorias(todosLosProductos, todasLasCategorias, contenedorMenu);
        activarEventosTarjetas(contenedorMenu);
    }

    var contadorResultados = document.getElementById("contador-resultados");
    if (contadorResultados !== null) {
        contadorResultados.textContent = "";
    }
}

// ──────────────────────────────────────────────
// Activar eventos en las tarjetas del menú (delegación de eventos)
// Se usa delegación para que funcione con elementos generados dinámicamente
// ──────────────────────────────────────────────
function activarEventosTarjetas(contenedor) {
    // Remover el listener anterior para evitar duplicados
    contenedor.removeEventListener("click", manejarClickTarjeta);
    contenedor.addEventListener("click", manejarClickTarjeta);
}

// ──────────────────────────────────────────────
// Manejar el clic en botones de las tarjetas
// ──────────────────────────────────────────────
function manejarClickTarjeta(evento) {
    var boton = evento.target.closest("button");
    if (boton === null) {
        return;
    }

    var idProducto = parseInt(boton.getAttribute("data-id"));
    if (isNaN(idProducto)) {
        return;
    }

    // Buscar el producto por id
    var productoEncontrado = null;
    for (var producto of todosLosProductos) {
        if (producto.id === idProducto) {
            productoEncontrado = producto;
            break;
        }
    }

    if (productoEncontrado === null) {
        return;
    }

    if (boton.classList.contains("btn-agregar")) {
        // Agregar al carrito
        agregarAlCarrito(productoEncontrado);
        actualizarContadorCarrito();
        mostrarNotificacion("✓ " + productoEncontrado.nombre + " añadido al carrito", "exito");

    } else if (boton.classList.contains("btn-detalles")) {
        // Mostrar detalles del producto
        mostrarDetallesProducto(productoEncontrado, todasLasCategorias);
    }
}

// ──────────────────────────────────────────────
// Mostrar el saludo al usuario que inició sesión
// ──────────────────────────────────────────────
function mostrarSaludoUsuario() {
    var usuario = obtenerUsuarioActivo();
    var seccionSaludo = document.getElementById("saludo-usuario");
    if (seccionSaludo === null) {
        return;
    }

    if (usuario !== null) {
        var rolTexto = (usuario.rol === "administrador") ? " [Administrador]" : "";
        seccionSaludo.textContent = "¡Bienvenido/a, " + usuario.nombres + rolTexto + "!";
        seccionSaludo.style.display = "block";
        seccionSaludo.style.opacity = "1";
        seccionSaludo.style.transition = "opacity 0.8s ease";

        // Desaparecer automáticamente después de 5 segundos (5000 ms)
        setTimeout(function() {
            seccionSaludo.style.opacity = "0";
            setTimeout(function() {
                seccionSaludo.style.display = "none";
            }, 800);
        }, 5000);
    }
}

// ──────────────────────────────────────────────
// Botón para restablecer datos originales desde JSON
// ──────────────────────────────────────────────
var btnRestablecer = document.getElementById("btn-restablecer-datos");
if (btnRestablecer !== null) {
    btnRestablecer.addEventListener("click", function() {
        Swal.fire({
            title:              "¿Restablecer datos originales?",
            text:               "Esto eliminará todos los productos que hayas agregado o editado y cargará los datos originales del JSON.",
            icon:               "warning",
            showCancelButton:   true,
            confirmButtonColor: "#8b0000",
            cancelButtonColor:  "#7f8c8d",
            confirmButtonText:  "Sí, restablecer",
            cancelButtonText:   "Cancelar"
        }).then(function(resultado) {
            if (resultado.isConfirmed) {
                var contenedorMenu = document.getElementById("contenedor-menu");
                mostrarIndicadorCarga(contenedorMenu, "Restableciendo datos...");

                restablecerProductosDesdeJSON()
                    .then(function(productos) {
                        todosLosProductos = productos;
                        renderizarMenuPorCategorias(todosLosProductos, todasLasCategorias, contenedorMenu);
                        activarEventosTarjetas(contenedorMenu);
                        actualizarPanelIndicadores(todosLosProductos, todasLasCategorias);
                        actualizarGrafico(todosLosProductos, todasLasCategorias);
                        mostrarNotificacion("Datos restablecidos correctamente", "info");
                    })
                    .catch(function() {
                        mostrarNotificacion("Error al restablecer los datos", "error");
                    });
            }
        });
    });
}


