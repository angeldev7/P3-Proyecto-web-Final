/**
 * pedido.js
 * Lógica de la página de pedido (carrito de compras).
 * Carga el carrito desde localStorage, muestra el resumen
 * y permite confirmar o eliminar items.
 */

// ──────────────────────────────────────────────
// Punto de entrada: esperar a que el DOM esté listo
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
    inicializarPaginaPedido();
});

// ──────────────────────────────────────────────
// Inicializar la página del pedido
// ──────────────────────────────────────────────
function inicializarPaginaPedido() {
    renderizarCarrito();
    activarEventosPedido();
}

// ──────────────────────────────────────────────
// Renderizar el contenido del carrito en la tabla
// ──────────────────────────────────────────────
function renderizarCarrito() {
    var carrito     = obtenerCarrito();
    var cuerpTabla  = document.getElementById("cuerpo-carrito");
    var totalTexto  = document.getElementById("total-carrito");
    var seccionVacia = document.getElementById("seccion-carrito-vacio");
    var seccionResumen = document.getElementById("resumen-compra");

    if (cuerpTabla === null) {
        return;
    }

    // Limpiar la tabla
    cuerpTabla.innerHTML = "";

    if (carrito.length === 0) {
        // Mostrar mensaje de carrito vacío
        if (seccionVacia !== null) {
            seccionVacia.style.display = "block";
        }
        if (seccionResumen !== null) {
            seccionResumen.style.display = "none";
        }
        return;
    }

    // Ocultar mensaje de vacío si hay items
    if (seccionVacia !== null) {
        seccionVacia.style.display = "none";
    }
    if (seccionResumen !== null) {
        seccionResumen.style.display = "block";
    }

    // Crear una fila por cada item del carrito
    for (var item of carrito) {
        var subtotal = (item.precio * item.cantidad).toFixed(2);
        var fila     = document.createElement("tr");
        fila.setAttribute("data-id", item.id);

        fila.innerHTML =
            "<td>" +
                '<div class="item-carrito">' +
                    '<img src="' + item.imagen + '" alt="' + item.nombre + '" ' +
                        'onerror="this.src=\'../imagenes/logo/fastfood-logo.jpg\'" width="50">' +
                    "<span>" + item.nombre + "</span>" +
                "</div>" +
            "</td>" +
            "<td>" +
                '<div class="control-cantidad">' +
                    '<button class="btn-reducir" data-id="' + item.id + '">−</button>' +
                    '<span class="cantidad-item">' + item.cantidad + "</span>" +
                    '<button class="btn-aumentar" data-id="' + item.id + '">+</button>' +
                "</div>" +
            "</td>" +
            "<td>$" + item.precio.toFixed(2) + "</td>" +
            "<td>$" + subtotal + "</td>" +
            "<td>" +
                '<button class="btn-quitar-item" data-id="' + item.id + '" title="Eliminar">' +
                    '<i class="fas fa-trash"></i>' +
                "</button>" +
            "</td>";

        cuerpTabla.appendChild(fila);
    }

    // Mostrar el total general
    var totalGeneral = calcularTotalCarrito();
    if (totalTexto !== null) {
        totalTexto.textContent = "$" + totalGeneral;
    }

    // Actualizar la cantidad en el modal de confirmación
    var textoTotalModal = document.getElementById("total-modal-confirmacion");
    if (textoTotalModal !== null) {
        textoTotalModal.textContent = "$" + totalGeneral;
    }

    // Actualizar el contador de la navbar
    actualizarContadorCarrito();
}

// ──────────────────────────────────────────────
// Activar eventos de la página de pedido (delegación)
// ──────────────────────────────────────────────
function activarEventosPedido() {
    var tablaCarrito = document.getElementById("tabla-carrito");
    if (tablaCarrito !== null) {
        tablaCarrito.addEventListener("click", manejarClickCarrito);
    }

    // Botón de confirmación de pago
    var btnConfirmar = document.getElementById("btn-confirmar-pago");
    if (btnConfirmar !== null) {
        btnConfirmar.addEventListener("click", manejarConfirmacionPago);
    }

    // Botón para vaciar el carrito
    var btnVaciar = document.getElementById("btn-vaciar-carrito");
    if (btnVaciar !== null) {
        btnVaciar.addEventListener("click", manejarVaciarCarrito);
    }
}

// ──────────────────────────────────────────────
// Manejar clics dentro de la tabla del carrito
// ──────────────────────────────────────────────
function manejarClickCarrito(evento) {
    var boton = evento.target.closest("button");
    if (boton === null) {
        return;
    }

    var idProducto = parseInt(boton.getAttribute("data-id"));
    if (isNaN(idProducto)) {
        return;
    }

    if (boton.classList.contains("btn-quitar-item")) {
        // Eliminar el item del carrito
        eliminarDelCarrito(idProducto);
        renderizarCarrito();
        mostrarNotificacion("Producto eliminado del carrito", "advertencia");

    } else if (boton.classList.contains("btn-aumentar")) {
        // Aumentar la cantidad del item
        var carrito = obtenerCarrito();
        for (var i = 0; i < carrito.length; i++) {
            if (carrito[i].id === idProducto) {
                carrito[i].cantidad = carrito[i].cantidad + 1;
                break;
            }
        }
        guardarEnStorage(CLAVE_CARRITO, carrito);
        renderizarCarrito();

    } else if (boton.classList.contains("btn-reducir")) {
        // Reducir la cantidad — si llega a 0, eliminar el item
        var carritoActual = obtenerCarrito();
        for (var j = 0; j < carritoActual.length; j++) {
            if (carritoActual[j].id === idProducto) {
                carritoActual[j].cantidad = carritoActual[j].cantidad - 1;
                if (carritoActual[j].cantidad <= 0) {
                    carritoActual.splice(j, 1);
                }
                break;
            }
        }
        guardarEnStorage(CLAVE_CARRITO, carritoActual);
        renderizarCarrito();
    }
}

// ──────────────────────────────────────────────
// Confirmar el pago con SweetAlert2
// ──────────────────────────────────────────────
function manejarConfirmacionPago() {
    var carrito = obtenerCarrito();

    if (carrito.length === 0) {
        Swal.fire({
            icon:              "info",
            title:             "Carrito vacío",
            text:              "Agrega productos al carrito antes de confirmar el pedido.",
            confirmButtonColor: "#e74c3c"
        });
        return;
    }

    var totalPagar = calcularTotalCarrito();

    Swal.fire({
        icon:              "question",
        title:             "Confirmar pedido",
        html:
            "<p>Tu total a pagar es: <strong>$" + totalPagar + "</strong></p>" +
            "<p>¿Confirmas el pago en efectivo al retirar tu pedido?</p>",
        showCancelButton:   true,
        confirmButtonColor: "#27ae60",
        cancelButtonColor:  "#7f8c8d",
        confirmButtonText:  "Sí, confirmar pedido",
        cancelButtonText:   "Cancelar"
    }).then(function(resultado) {
        if (resultado.isConfirmed) {
            // Vaciar el carrito después de confirmar
            vaciarCarrito();
            renderizarCarrito();

            Swal.fire({
                icon:              "success",
                title:             "¡Pedido confirmado!",
                html:
                    "<p>Tu pedido por <strong>$" + totalPagar + "</strong> ha sido registrado.</p>" +
                    "<p>Acércate a la garita principal en <strong>15-20 minutos</strong>.</p>" +
                    "<p>Lleva efectivo para el pago al retirar.</p>",
                confirmButtonText:  "Entendido",
                confirmButtonColor: "#e74c3c"
            });

            mostrarNotificacion("Pedido confirmado por $" + totalPagar, "exito");
        }
    });
}

// ──────────────────────────────────────────────
// Vaciar todo el carrito con confirmación
// ──────────────────────────────────────────────
function manejarVaciarCarrito() {
    var carrito = obtenerCarrito();

    if (carrito.length === 0) {
        mostrarNotificacion("El carrito ya está vacío", "info");
        return;
    }

    Swal.fire({
        icon:              "warning",
        title:             "¿Vaciar el carrito?",
        text:              "Se eliminarán todos los productos del carrito.",
        showCancelButton:   true,
        confirmButtonColor: "#e74c3c",
        cancelButtonColor:  "#7f8c8d",
        confirmButtonText:  "Sí, vaciar",
        cancelButtonText:   "Cancelar"
    }).then(function(resultado) {
        if (resultado.isConfirmed) {
            vaciarCarrito();
            renderizarCarrito();
            mostrarNotificacion("El carrito ha sido vaciado", "advertencia");
        }
    });
}
