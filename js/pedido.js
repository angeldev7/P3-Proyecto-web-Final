/**
 * pedido.js
 * Lógica de la página de pedido (carrito de compras).
 * Carga el carrito desde localStorage, muestra el resumen,
 * gestiona la barra de progreso dinámica del estado del pedido
 * y permite confirmar o eliminar items.
 */

// Variable global para controlar el intervalo del progreso
var intervaloProgresoPedido = null;

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
    actualizarEstadoPedidoDinamico();
}

// ──────────────────────────────────────────────
// Renderizar el contenido del carrito en la tabla
// ──────────────────────────────────────────────
function renderizarCarrito() {
    var carrito        = obtenerCarrito();
    var cuerpTabla     = document.getElementById("cuerpo-carrito");
    var tablaCarrito   = document.getElementById("tabla-carrito");
    var totalTexto     = document.getElementById("total-carrito");
    var seccionVacia   = document.getElementById("seccion-carrito-vacio");
    var seccionResumen = document.getElementById("resumen-compra");
    var btnContenedor  = document.querySelector(".confirm-btn-container");

    if (cuerpTabla === null) {
        return;
    }

    // Limpiar filas anteriores de la tabla antes de renderizar
    cuerpTabla.innerHTML = "";

    // Mantener la sección principal visible
    if (seccionResumen !== null) {
        seccionResumen.style.display = "block";
    }

    if (carrito.length === 0) {
        // Mostrar mensaje de carrito vacío dentro del contenedor
        if (seccionVacia !== null) {
            seccionVacia.style.display = "flex";
        }
        if (tablaCarrito !== null) {
            tablaCarrito.style.display = "none";
        }
        if (btnContenedor !== null) {
            btnContenedor.style.display = "none";
        }
        actualizarContadorCarrito();
        return;
    }

    // Mostrar tabla y botones si hay productos
    if (seccionVacia !== null) {
        seccionVacia.style.display = "none";
    }
    if (tablaCarrito !== null) {
        tablaCarrito.style.display = "table";
    }
    if (btnContenedor !== null) {
        btnContenedor.style.display = "flex";
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
// BARRA DE PROGRESO DINÁMICA DEL ESTADO DEL PEDIDO
// ──────────────────────────────────────────────
function actualizarEstadoPedidoDinamico() {
    var elemTitulo    = document.getElementById("estado-pedido-titulo");
    var elemTiempo    = document.getElementById("estado-pedido-tiempo");
    var elemBarra     = document.getElementById("barra-progreso-pedido");
    var elemTextoProg = document.getElementById("texto-porcentaje-pedido");

    if (elemBarra === null) {
        return;
    }

    var pedidoActivo = obtenerDeStorage(CLAVE_PEDIDO_ACTIVO);

    // Caso 1: NO hay pedido activo (Estado de espera)
    if (pedidoActivo === null) {
        if (elemTitulo !== null)    elemTitulo.textContent = "Sin pedidos activos";
        if (elemTiempo !== null)    elemTiempo.textContent = "(Agrega productos al carrito y confirma tu compra)";
        if (elemTextoProg !== null) elemTextoProg.textContent = "0% completado — En espera de pedido";

        elemBarra.style.width = "0%";
        elemBarra.setAttribute("aria-valuenow", "0");
        elemBarra.textContent = "0%";
        elemBarra.className = "progress-bar progress-bar-striped progress-bar-animated bg-secondary";

        if (intervaloProgresoPedido !== null) {
            clearInterval(intervaloProgresoPedido);
            intervaloProgresoPedido = null;
        }
        return;
    }

    // Caso 2: SI HAY UN PEDIDO ACTIVO
    var porcentaje = pedidoActivo.porcentaje || 10;
    var total      = pedidoActivo.total || "0.00";

    function aplicarProgreso(pct) {
        var tituloFase = "";
        var tiempoFase = "";
        var claseColor = "";

        if (pct <= 0) {
            tituloFase = "Sin pedidos activos";
            tiempoFase = "(Agrega productos al carrito y confirma tu compra)";
            claseColor = "bg-secondary";
        } else if (pct < 25) {
            tituloFase = "¡Pedido recibido! Enviando orden a cocina...";
            tiempoFase = "(Tiempo estimado: 15-20 minutos | Total: $" + total + ")";
            claseColor = "bg-info text-dark";
        } else if (pct < 65) {
            tituloFase = "Preparando tu pedido en cocina...";
            tiempoFase = "(Cocinando platillos | Total: $" + total + ")";
            claseColor = "bg-primary";
        } else if (pct < 100) {
            tituloFase = "Empacando y enviando a garita...";
            tiempoFase = "(En camino al punto de retiro en garita principal)";
            claseColor = "bg-warning text-dark";
        } else {
            tituloFase = "¡Pedido listo para retirar!";
            tiempoFase = "(Acércate a la garita principal con tu pago de $" + total + ")";
            claseColor = "bg-success";
        }

        if (elemTitulo !== null)    elemTitulo.textContent = tituloFase;
        if (elemTiempo !== null)    elemTiempo.textContent = tiempoFase;
        if (elemTextoProg !== null) elemTextoProg.textContent = pct + "% completado";

        elemBarra.style.width = pct + "%";
        elemBarra.setAttribute("aria-valuenow", pct);
        elemBarra.textContent = pct + "%";
        elemBarra.className = "progress-bar progress-bar-striped progress-bar-animated " + claseColor;
    }

    aplicarProgreso(porcentaje);

    // Si ya llegó al 100%, detener
    if (porcentaje >= 100) {
        if (intervaloProgresoPedido !== null) {
            clearInterval(intervaloProgresoPedido);
            intervaloProgresoPedido = null;
        }
        return;
    }

    // Avanzar dinámicamente el porcentaje
    if (intervaloProgresoPedido === null) {
        intervaloProgresoPedido = setInterval(function() {
            var pedidoActual = obtenerDeStorage(CLAVE_PEDIDO_ACTIVO);
            if (pedidoActual === null) {
                clearInterval(intervaloProgresoPedido);
                intervaloProgresoPedido = null;
                return;
            }

            var nuevoPorcentaje = (pedidoActual.porcentaje || 10) + 5;

            if (nuevoPorcentaje >= 100) {
                nuevoPorcentaje = 100;
                clearInterval(intervaloProgresoPedido);
                intervaloProgresoPedido = null;

                if (typeof mostrarNotificacion === "function") {
                    mostrarNotificacion("¡Tu pedido está listo en la garita principal!", "exito");
                }
            }

            pedidoActual.porcentaje = nuevoPorcentaje;
            guardarEnStorage(CLAVE_PEDIDO_ACTIVO, pedidoActual);
            aplicarProgreso(nuevoPorcentaje);
        }, 2000);
    }
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
            // Guardar nuevo pedido activo para la barra dinámica
            var nuevoPedido = {
                id: Date.now(),
                total: totalPagar,
                porcentaje: 10,
                fechaInicio: new Date().toISOString()
            };
            guardarEnStorage(CLAVE_PEDIDO_ACTIVO, nuevoPedido);

            // Vaciar el carrito después de confirmar
            vaciarCarrito();
            renderizarCarrito();

            // Iniciar la barra de progreso inmediatamente
            actualizarEstadoPedidoDinamico();

            Swal.fire({
                icon:              "success",
                title:             "¡Pedido confirmado!",
                html:
                    "<p>Tu pedido por <strong>$" + totalPagar + "</strong> ha sido registrado.</p>" +
                    "<p>Puedes seguir el avance en la barra de estado en tiempo real.</p>" +
                    "<p>Acércate a la garita principal cuando llegue al 100%.</p>",
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
