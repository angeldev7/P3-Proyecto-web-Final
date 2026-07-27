/**
 * componentes.js
 * Módulo encargado de generar los elementos HTML dinámicamente.
 * Crea tarjetas de productos, filas de tablas y otros componentes visuales.
 */

// ──────────────────────────────────────────────
// Crear una TARJETA de producto para el menú
// Recibe un producto y la lista de categorías
// Devuelve el elemento div con la tarjeta completa
// ──────────────────────────────────────────────
function crearTarjetaProducto(producto, listaCategorias) {
    var nombreCategoria = obtenerNombreCategoria(producto.categoriaId, listaCategorias);
    var estaAgotado    = producto.estado === "agotado" || producto.stock === 0;

    // Contenedor principal de la tarjeta
    var tarjetaItem = document.createElement("div");
    tarjetaItem.className = "tarjeta-item";
    tarjetaItem.setAttribute("data-id", producto.id);

    // Estructura interna de la tarjeta
    tarjetaItem.innerHTML =
        '<div class="card tarjeta' + (estaAgotado ? " tarjeta-agotada" : "") + '">' +
            '<div class="tarjeta-imagen-contenedor">' +
                '<img src="' + producto.imagen + '" class="card-img-top" alt="' + producto.nombre + '" ' +
                    'onerror="this.src=\'../imagenes/logo/fastfood-logo.jpg\'">' +
                (estaAgotado ? '<span class="badge-agotado">Agotado</span>' : "") +
            "</div>" +
            '<div class="card-body p-0 d-flex flex-column">' +
                '<span class="badge-categoria">' + nombreCategoria + "</span>" +
                '<h4 class="card-title mt-0">' + producto.nombre + "</h4>" +
                '<p class="card-text">' + producto.descripcion + "</p>" +
                '<div class="precio-accion">' +
                    '<strong class="precio-texto">$' + producto.precio.toFixed(2) + "</strong>" +
                    '<div class="botones-tarjeta">' +
                        '<button class="btn-detalles" ' +
                            'data-id="' + producto.id + '" ' +
                            'title="Ver detalles">' +
                            '<i class="fas fa-eye"></i>' +
                        "</button>" +
                        (estaAgotado
                            ? '<button class="btn-agregar btn-deshabilitado" disabled>Agotado</button>'
                            : '<button class="btn-agregar" data-id="' + producto.id + '">Añadir <i class="fas fa-cart-plus"></i></button>'
                        ) +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>";

    return tarjetaItem;
}

// ──────────────────────────────────────────────
// Renderizar todas las tarjetas en el contenedor del menú
// Agrupa los productos por categoría
// ──────────────────────────────────────────────
function renderizarMenuPorCategorias(productos, listaCategorias, contenedor) {
    // Limpiar el contenedor antes de renderizar
    contenedor.innerHTML = "";

    if (productos.length === 0) {
        contenedor.innerHTML =
            '<div class="mensaje-vacio">' +
                '<i class="fas fa-search fa-3x"></i>' +
                "<p>No se encontraron productos con los filtros seleccionados.</p>" +
            "</div>";
        return;
    }

    // Recorremos cada categoría para agrupar los productos
    for (var categoria of listaCategorias) {
        // Filtrar productos que pertenecen a esta categoría
        var productosDeCategoria = [];
        for (var producto of productos) {
            if (producto.categoriaId === categoria.id) {
                productosDeCategoria.push(producto);
            }
        }

        // Si la categoría no tiene productos, la omitimos
        if (productosDeCategoria.length === 0) {
            continue;
        }

        // Crear la columna de categoría
        var columnaCategoria = document.createElement("div");
        columnaCategoria.className = "categoria-columna";

        // Título de la categoría
        var tituloCategoria = document.createElement("h3");
        tituloCategoria.className = "categoria-titulo";
        tituloCategoria.innerHTML = '<i class="' + categoria.icono + '"></i> ' + categoria.nombre;

        // Contenedor de tarjetas
        var listaTarjetas = document.createElement("div");
        listaTarjetas.className = "tarjetas-lista";

        // Crear cada tarjeta de la categoría
        for (var prod of productosDeCategoria) {
            var tarjeta = crearTarjetaProducto(prod, listaCategorias);
            listaTarjetas.appendChild(tarjeta);
        }

        columnaCategoria.appendChild(tituloCategoria);
        columnaCategoria.appendChild(listaTarjetas);
        contenedor.appendChild(columnaCategoria);
    }
}

// ──────────────────────────────────────────────
// Renderizar tarjetas en cuadrícula plana (sin agrupar por categoría)
// Se usa en el catálogo de administración
// ──────────────────────────────────────────────
function renderizarTarjetasCatalogo(productos, listaCategorias, contenedor) {
    contenedor.innerHTML = "";

    if (productos.length === 0) {
        contenedor.innerHTML =
            '<div class="mensaje-vacio">' +
                '<i class="fas fa-box-open fa-3x"></i>' +
                "<p>No hay productos registrados todavía.</p>" +
            "</div>";
        return;
    }

    for (var producto of productos) {
        var tarjeta = crearTarjetaCatalogo(producto, listaCategorias);
        contenedor.appendChild(tarjeta);
    }
}

// ──────────────────────────────────────────────
// Crear tarjeta para la vista de catálogo (con botones de admin)
// ──────────────────────────────────────────────
function crearTarjetaCatalogo(producto, listaCategorias) {
    var nombreCategoria = obtenerNombreCategoria(producto.categoriaId, listaCategorias);
    var estaAgotado    = producto.estado === "agotado" || producto.stock === 0;

    var tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-catalogo";
    tarjeta.setAttribute("data-id", producto.id);

    tarjeta.innerHTML =
        '<img src="' + producto.imagen + '" alt="' + producto.nombre + '" class="img-catalogo" ' +
            'onerror="this.src=\'../imagenes/logo/fastfood-logo.jpg\'">' +
        '<div class="catalogo-info">' +
            '<span class="badge-categoria">' + nombreCategoria + "</span>" +
            '<h4>' + producto.nombre + "</h4>" +
            '<p>' + producto.descripcion + "</p>" +
            '<div class="catalogo-meta">' +
                '<strong class="precio-texto">$' + producto.precio.toFixed(2) + "</strong>" +
                '<span class="stock-texto ' + (estaAgotado ? "stock-agotado" : "stock-ok") + '">' +
                    "Stock: " + producto.stock +
                "</span>" +
                '<span class="estado-badge estado-' + producto.estado + '">' + producto.estado + "</span>" +
            "</div>" +
        "</div>" +
        '<div class="catalogo-acciones">' +
            '<button class="btn-editar" data-id="' + producto.id + '" title="Editar">' +
                '<i class="fas fa-edit"></i> Editar' +
            "</button>" +
            '<button class="btn-eliminar" data-id="' + producto.id + '" title="Eliminar">' +
                '<i class="fas fa-trash"></i> Eliminar' +
            "</button>" +
        "</div>";

    return tarjeta;
}

// ──────────────────────────────────────────────
// Mostrar indicador de CARGA en un contenedor
// ──────────────────────────────────────────────
function mostrarIndicadorCarga(contenedor, mensaje) {
    if (mensaje === undefined) {
        mensaje = "Cargando...";
    }
    contenedor.innerHTML =
        '<div class="indicador-carga">' +
            '<div class="spinner"></div>' +
            "<p>" + mensaje + "</p>" +
        "</div>";
}

// ──────────────────────────────────────────────
// Actualizar el contador del carrito en la barra de navegación
// ──────────────────────────────────────────────
function actualizarContadorCarrito() {
    var totalItems = contarItemsCarrito();
    var contadores = document.querySelectorAll(".contador-carrito");

    for (var contador of contadores) {
        contador.textContent = totalItems;
        if (totalItems > 0) {
            contador.style.display = "inline-block";
        } else {
            contador.style.display = "none";
        }
    }
}

// ──────────────────────────────────────────────
// Mostrar una NOTIFICACIÓN tipo toast con Toastify
// ──────────────────────────────────────────────
function mostrarNotificacion(mensaje, tipo) {
    if (tipo === undefined) {
        tipo = "exito";
    }

    var colores = {
        exito:      "linear-gradient(to right, #27ae60, #2ecc71)",
        error:      "linear-gradient(to right, #e74c3c, #c0392b)",
        advertencia:"linear-gradient(to right, #f39c12, #e67e22)",
        info:       "linear-gradient(to right, #2980b9, #3498db)"
    };

    var fondo = colores[tipo] || colores.exito;

    Toastify({
        text:     mensaje,
        duration: 3000,
        gravity:  "bottom",
        position: "right",
        style: {
            background: fondo,
            borderRadius: "8px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px"
        }
    }).showToast();
}

// ──────────────────────────────────────────────
// Mostrar DETALLES de un producto con SweetAlert2
// ──────────────────────────────────────────────
function mostrarDetallesProducto(producto, listaCategorias) {
    var nombreCategoria = obtenerNombreCategoria(producto.categoriaId, listaCategorias);
    var estaAgotado    = producto.estado === "agotado" || producto.stock === 0;

    Swal.fire({
        title:           producto.nombre,
        html:
            '<div class="swal-detalle">' +
                '<img src="' + producto.imagen + '" alt="' + producto.nombre + '" ' +
                    'class="swal-imagen" onerror="this.src=\'../imagenes/logo/fastfood-logo.jpg\'">' +
                '<p class="swal-descripcion">' + producto.descripcion + "</p>" +
                '<table class="swal-tabla">' +
                    "<tr><td><strong>Categoría:</strong></td><td>" + nombreCategoria + "</td></tr>" +
                    "<tr><td><strong>Precio:</strong></td><td>$" + producto.precio.toFixed(2) + "</td></tr>" +
                    "<tr><td><strong>Stock:</strong></td><td>" + producto.stock + " unidades</td></tr>" +
                    "<tr><td><strong>Estado:</strong></td><td>" + (estaAgotado ? "Agotado" : "Disponible") + "</td></tr>" +
                    "<tr><td><strong>Registrado:</strong></td><td>" + producto.fechaRegistro + "</td></tr>" +
                "</table>" +
            "</div>",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#e74c3c",
        showClass: { popup: "animate__animated animate__fadeInDown" }
    });
}
