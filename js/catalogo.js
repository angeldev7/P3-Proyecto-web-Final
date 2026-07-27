/**
 * catalogo.js
 * Lógica de la página de administración del catálogo (catalogo.html).
 * Implementa el CRUD completo: crear, leer, editar y eliminar productos.
 * Conecta con productos.json y categorias.json via localStorage.
 */

// Variables globales de esta página
var productosAdmin  = [];
var categoriasAdmin = [];
var modoEdicion     = false;
var idProductoEditando = null;

// ──────────────────────────────────────────────
// Punto de entrada: esperar a que el DOM esté listo
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
    inicializarCatalogo();
});

// ──────────────────────────────────────────────
// Inicializar el catálogo administrativo
// ──────────────────────────────────────────────
function inicializarCatalogo() {
    var contenedor = document.getElementById("contenedor-catalogo");
    if (contenedor === null) {
        return;
    }

    mostrarIndicadorCarga(contenedor, "Cargando catálogo de productos...");

    var promesaCategorias = cargarCategorias();
    var promesaProductos  = cargarProductos();

    Promise.all([promesaCategorias, promesaProductos])
        .then(function(resultados) {
            categoriasAdmin = resultados[0];
            productosAdmin  = resultados[1];

            renderizarTarjetasCatalogo(productosAdmin, categoriasAdmin, contenedor);
            llenarSelectCategoriasFormulario(categoriasAdmin);
            actualizarContadorCatalogo();
            activarEventosCatalogo(contenedor);
            activarEventosFormulario();
            activarEventosBusquedaCatalogo();
        })
        .catch(function(error) {
            contenedor.innerHTML =
                '<div class="mensaje-error">' +
                    "<p>Error al cargar el catálogo: " + error.message + "</p>" +
                "</div>";
        });
}

// ──────────────────────────────────────────────
// Llenar el select de categorías en el formulario
// ──────────────────────────────────────────────
function llenarSelectCategoriasFormulario(listaCategorias) {
    var selectCategoria = document.getElementById("prod-categoria");
    if (selectCategoria === null) {
        return;
    }

    selectCategoria.innerHTML = '<option value="">-- Selecciona categoría --</option>';

    for (var categoria of listaCategorias) {
        var opcion = document.createElement("option");
        opcion.value       = categoria.id;
        opcion.textContent = categoria.nombre;
        selectCategoria.appendChild(opcion);
    }
}

// ──────────────────────────────────────────────
// Actualizar el contador de productos en la cabecera
// ──────────────────────────────────────────────
function actualizarContadorCatalogo() {
    var contador = document.getElementById("contador-productos-admin");
    if (contador !== null) {
        contador.textContent = productosAdmin.length + " productos registrados";
    }
}

// ──────────────────────────────────────────────
// Activar eventos de las tarjetas del catálogo (delegación)
// ──────────────────────────────────────────────
function activarEventosCatalogo(contenedor) {
    contenedor.removeEventListener("click", manejarClickCatalogo);
    contenedor.addEventListener("click", manejarClickCatalogo);
}

// ──────────────────────────────────────────────
// Manejar clics en botones de las tarjetas del catálogo
// ──────────────────────────────────────────────
function manejarClickCatalogo(evento) {
    var boton = evento.target.closest("button");
    if (boton === null) {
        return;
    }

    var idProducto = parseInt(boton.getAttribute("data-id"));
    if (isNaN(idProducto)) {
        return;
    }

    if (boton.classList.contains("btn-editar")) {
        abrirFormularioEdicion(idProducto);
    } else if (boton.classList.contains("btn-eliminar")) {
        confirmarEliminacion(idProducto);
    }
}

// ──────────────────────────────────────────────
// Abrir el formulario precargado con datos del producto a editar
// ──────────────────────────────────────────────
function abrirFormularioEdicion(idProducto) {
    var productoEditar = null;
    for (var producto of productosAdmin) {
        if (producto.id === idProducto) {
            productoEditar = producto;
            break;
        }
    }

    if (productoEditar === null) {
        mostrarNotificacion("Producto no encontrado", "error");
        return;
    }

    modoEdicion         = true;
    idProductoEditando  = idProducto;

    // Precargar los datos en el formulario
    document.getElementById("prod-nombre").value       = productoEditar.nombre;
    document.getElementById("prod-descripcion").value  = productoEditar.descripcion;
    document.getElementById("prod-precio").value       = productoEditar.precio;
    document.getElementById("prod-stock").value        = productoEditar.stock;
    document.getElementById("prod-categoria").value    = productoEditar.categoriaId;
    document.getElementById("prod-estado").value       = productoEditar.estado;
    document.getElementById("prod-imagen").value       = productoEditar.imagen;

    // Cambiar el texto del botón de envío
    var btnEnviar = document.getElementById("btn-guardar-producto");
    if (btnEnviar !== null) {
        btnEnviar.textContent = "Guardar cambios";
    }

    // Mostrar el título del formulario en modo edición
    var tituloFormulario = document.getElementById("titulo-formulario-prod");
    if (tituloFormulario !== null) {
        tituloFormulario.textContent = "Editar producto";
    }

    // Hacer scroll hasta el formulario
    var formulario = document.getElementById("formulario-producto");
    if (formulario !== null) {
        formulario.scrollIntoView({ behavior: "smooth" });
    }
}

// ──────────────────────────────────────────────
// Confirmar y ejecutar la eliminación de un producto
// ──────────────────────────────────────────────
function confirmarEliminacion(idProducto) {
    var productoEliminar = null;
    for (var producto of productosAdmin) {
        if (producto.id === idProducto) {
            productoEliminar = producto;
            break;
        }
    }

    if (productoEliminar === null) {
        return;
    }

    Swal.fire({
        icon:              "warning",
        title:             "¿Eliminar producto?",
        html:
            "<p>¿Seguro que deseas eliminar <strong>" + productoEliminar.nombre + "</strong>?</p>" +
            "<p class='text-muted'>Esta acción no se puede deshacer.</p>",
        showCancelButton:   true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor:  "#7f8c8d",
        confirmButtonText:  "Sí, eliminar",
        cancelButtonText:   "Cancelar"
    }).then(function(resultado) {
        if (resultado.isConfirmed) {
            // Eliminar usando filter() — crea nuevo arreglo sin el producto
            productosAdmin = productosAdmin.filter(function(p) {
                return p.id !== idProducto;
            });

            guardarEnStorage(CLAVE_PRODUCTOS, productosAdmin);

            var contenedor = document.getElementById("contenedor-catalogo");
            renderizarTarjetasCatalogo(productosAdmin, categoriasAdmin, contenedor);
            actualizarContadorCatalogo();
            activarEventosCatalogo(contenedor);

            mostrarNotificacion(productoEliminar.nombre + " eliminado correctamente", "advertencia");
        }
    });
}

// ──────────────────────────────────────────────
// Activar los eventos del formulario de productos
// ──────────────────────────────────────────────
function activarEventosFormulario() {
    var formulario = document.getElementById("formulario-producto");
    if (formulario === null) {
        return;
    }

    formulario.addEventListener("submit", manejarEnvioProducto);

    // Botón para cancelar la edición
    var btnCancelar = document.getElementById("btn-cancelar-edicion");
    if (btnCancelar !== null) {
        btnCancelar.addEventListener("click", cancelarEdicion);
    }

    // Botón de restablecimiento de datos
    var btnRestablecer = document.getElementById("btn-restablecer-catalogo");
    if (btnRestablecer !== null) {
        btnRestablecer.addEventListener("click", restablecerCatalogo);
    }
}

// ──────────────────────────────────────────────
// Manejar el envío del formulario (crear o editar producto)
// ──────────────────────────────────────────────
function manejarEnvioProducto(evento) {
    evento.preventDefault();

    // Recoger los datos del formulario
    var datosProducto = {
        nombre:      document.getElementById("prod-nombre").value,
        descripcion: document.getElementById("prod-descripcion").value,
        precio:      document.getElementById("prod-precio").value,
        stock:       document.getElementById("prod-stock").value,
        categoriaId: document.getElementById("prod-categoria").value,
        estado:      document.getElementById("prod-estado").value,
        imagen:      document.getElementById("prod-imagen").value
    };

    // Validar los datos
    var resultadoValidacion = validarFormularioProducto(datosProducto);

    if (!resultadoValidacion.esValido) {
        for (var errorItem of resultadoValidacion.errores) {
            mostrarErrorCampo(errorItem.campo, errorItem.mensaje);
        }
        mostrarNotificacion("Revisa los campos del formulario", "advertencia");
        return;
    }

    if (modoEdicion) {
        // EDITAR producto existente
        for (var i = 0; i < productosAdmin.length; i++) {
            if (productosAdmin[i].id === idProductoEditando) {
                productosAdmin[i].nombre      = datosProducto.nombre.trim();
                productosAdmin[i].descripcion = datosProducto.descripcion.trim();
                productosAdmin[i].precio      = parseFloat(datosProducto.precio);
                productosAdmin[i].stock       = parseInt(datosProducto.stock);
                productosAdmin[i].categoriaId = parseInt(datosProducto.categoriaId);
                productosAdmin[i].estado      = datosProducto.estado;
                productosAdmin[i].imagen      = datosProducto.imagen.trim();
                break;
            }
        }

        guardarEnStorage(CLAVE_PRODUCTOS, productosAdmin);
        mostrarNotificacion("Producto actualizado correctamente", "exito");

    } else {
        // CREAR nuevo producto
        var nuevoProducto = {
            id:            generarNuevoId(productosAdmin),
            nombre:        datosProducto.nombre.trim(),
            descripcion:   datosProducto.descripcion.trim(),
            precio:        parseFloat(datosProducto.precio),
            categoriaId:   parseInt(datosProducto.categoriaId),
            stock:         parseInt(datosProducto.stock),
            imagen:        datosProducto.imagen.trim() || "../imagenes/logo/fastfood-logo.jpg",
            estado:        datosProducto.estado,
            fechaRegistro: new Date().toISOString().split("T")[0]
        };

        productosAdmin.push(nuevoProducto);
        guardarEnStorage(CLAVE_PRODUCTOS, productosAdmin);
        mostrarNotificacion(nuevoProducto.nombre + " agregado al catálogo", "exito");
    }

    // Actualizar la vista
    var contenedor = document.getElementById("contenedor-catalogo");
    renderizarTarjetasCatalogo(productosAdmin, categoriasAdmin, contenedor);
    actualizarContadorCatalogo();
    activarEventosCatalogo(contenedor);

    // Limpiar el formulario
    cancelarEdicion();
}

// ──────────────────────────────────────────────
// Cancelar edición y resetear el formulario
// ──────────────────────────────────────────────
function cancelarEdicion() {
    modoEdicion        = false;
    idProductoEditando = null;

    var formulario = document.getElementById("formulario-producto");
    if (formulario !== null) {
        formulario.reset();
    }

    var btnEnviar = document.getElementById("btn-guardar-producto");
    if (btnEnviar !== null) {
        btnEnviar.textContent = "Agregar producto";
    }

    var tituloFormulario = document.getElementById("titulo-formulario-prod");
    if (tituloFormulario !== null) {
        tituloFormulario.textContent = "Agregar nuevo producto";
    }
}

// ──────────────────────────────────────────────
// Restablecer el catálogo desde el JSON original
// ──────────────────────────────────────────────
function restablecerCatalogo() {
    Swal.fire({
        icon:              "warning",
        title:             "¿Restablecer catálogo?",
        text:              "Se eliminarán todos los cambios y se cargarán los datos originales del JSON.",
        showCancelButton:   true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor:  "#7f8c8d",
        confirmButtonText:  "Sí, restablecer",
        cancelButtonText:   "Cancelar"
    }).then(function(resultado) {
        if (resultado.isConfirmed) {
            var contenedor = document.getElementById("contenedor-catalogo");
            mostrarIndicadorCarga(contenedor, "Restableciendo datos originales...");

            restablecerProductosDesdeJSON()
                .then(function(productos) {
                    productosAdmin = productos;
                    renderizarTarjetasCatalogo(productosAdmin, categoriasAdmin, contenedor);
                    actualizarContadorCatalogo();
                    activarEventosCatalogo(contenedor);
                    mostrarNotificacion("Catálogo restablecido correctamente", "info");
                })
                .catch(function() {
                    mostrarNotificacion("Error al restablecer el catálogo", "error");
                });
        }
    });
}

// ──────────────────────────────────────────────
// Búsqueda en tiempo real en el catálogo
// ──────────────────────────────────────────────
function activarEventosBusquedaCatalogo() {
    var campoBusqueda = document.getElementById("busqueda-catalogo");
    if (campoBusqueda === null) {
        return;
    }

    campoBusqueda.addEventListener("input", function() {
        var texto = this.value.toLowerCase().trim();
        var productosFiltrados = [];

        for (var producto of productosAdmin) {
            var nombreCategoria = obtenerNombreCategoria(producto.categoriaId, categoriasAdmin);
            var textoProducto   = (producto.nombre + " " + producto.descripcion + " " + nombreCategoria).toLowerCase();

            if (textoProducto.includes(texto)) {
                productosFiltrados.push(producto);
            }
        }

        var contenedor = document.getElementById("contenedor-catalogo");
        renderizarTarjetasCatalogo(productosFiltrados, categoriasAdmin, contenedor);
        activarEventosCatalogo(contenedor);
    });
}
