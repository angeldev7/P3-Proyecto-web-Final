/**
 * almacenamiento.js
 * Módulo encargado de todas las operaciones con localStorage.
 * Centraliza guardar, leer, actualizar y eliminar datos del navegador.
 */

// ──────────────────────────────────────────────
// CLAVES usadas en localStorage
// ──────────────────────────────────────────────
var CLAVE_PRODUCTOS  = "fastmenu_productos";
var CLAVE_CATEGORIAS = "fastmenu_categorias";
var CLAVE_USUARIOS   = "fastmenu_usuarios";
var CLAVE_CARRITO    = "fastmenu_carrito";
var CLAVE_USUARIO_ACTIVO = "fastmenu_usuario_activo";

// ──────────────────────────────────────────────
// GUARDAR un arreglo completo en localStorage
// ──────────────────────────────────────────────
function guardarEnStorage(clave, arreglo) {
    try {
        localStorage.setItem(clave, JSON.stringify(arreglo));
    } catch (error) {
        console.error("Error al guardar en localStorage:", error);
    }
}

// ──────────────────────────────────────────────
// OBTENER un arreglo desde localStorage
// Devuelve null si no existe la clave
// ──────────────────────────────────────────────
function obtenerDeStorage(clave) {
    try {
        var datos = localStorage.getItem(clave);
        if (datos === null) {
            return null;
        }
        return JSON.parse(datos);
    } catch (error) {
        console.error("Error al leer de localStorage:", error);
        return null;
    }
}

// ──────────────────────────────────────────────
// ELIMINAR una clave del localStorage
// ──────────────────────────────────────────────
function eliminarDeStorage(clave) {
    localStorage.removeItem(clave);
}

// ──────────────────────────────────────────────
// LIMPIAR todo el localStorage de la aplicación
// ──────────────────────────────────────────────
function limpiarTodoElStorage() {
    localStorage.removeItem(CLAVE_PRODUCTOS);
    localStorage.removeItem(CLAVE_CATEGORIAS);
    localStorage.removeItem(CLAVE_USUARIOS);
    localStorage.removeItem(CLAVE_CARRITO);
}

// ──────────────────────────────────────────────
// CARRITO — obtener todos los items del carrito
// ──────────────────────────────────────────────
function obtenerCarrito() {
    var carrito = obtenerDeStorage(CLAVE_CARRITO);
    if (carrito === null) {
        return [];
    }
    return carrito;
}

// ──────────────────────────────────────────────
// CARRITO — agregar un producto al carrito
// Si ya existe, incrementa la cantidad
// ──────────────────────────────────────────────
function agregarAlCarrito(producto) {
    var carrito = obtenerCarrito();
    var encontrado = false;

    for (var i = 0; i < carrito.length; i++) {
        if (carrito[i].id === producto.id) {
            carrito[i].cantidad = carrito[i].cantidad + 1;
            encontrado = true;
            break;
        }
    }

    if (!encontrado) {
        // Creamos un nuevo objeto con cantidad inicial de 1
        var itemCarrito = {
            id:       producto.id,
            nombre:   producto.nombre,
            precio:   producto.precio,
            imagen:   producto.imagen,
            cantidad: 1
        };
        carrito.push(itemCarrito);
    }

    guardarEnStorage(CLAVE_CARRITO, carrito);
    return carrito;
}

// ──────────────────────────────────────────────
// CARRITO — eliminar un producto del carrito por su id
// ──────────────────────────────────────────────
function eliminarDelCarrito(idProducto) {
    var carrito = obtenerCarrito();
    var carritoActualizado = carrito.filter(function(item) {
        return item.id !== idProducto;
    });
    guardarEnStorage(CLAVE_CARRITO, carritoActualizado);
    return carritoActualizado;
}

// ──────────────────────────────────────────────
// CARRITO — obtener la cantidad total de items
// ──────────────────────────────────────────────
function contarItemsCarrito() {
    var carrito = obtenerCarrito();
    var total = 0;
    for (var item of carrito) {
        total = total + item.cantidad;
    }
    return total;
}

// ──────────────────────────────────────────────
// CARRITO — calcular el total en dinero
// ──────────────────────────────────────────────
function calcularTotalCarrito() {
    var carrito = obtenerCarrito();
    var total = 0;
    for (var item of carrito) {
        total = total + (item.precio * item.cantidad);
    }
    return total.toFixed(2);
}

// ──────────────────────────────────────────────
// CARRITO — vaciar completamente el carrito
// ──────────────────────────────────────────────
function vaciarCarrito() {
    guardarEnStorage(CLAVE_CARRITO, []);
}

// ──────────────────────────────────────────────
// USUARIO ACTIVO — guardar sesión
// ──────────────────────────────────────────────
function guardarUsuarioActivo(usuario) {
    localStorage.setItem(CLAVE_USUARIO_ACTIVO, JSON.stringify(usuario));
}

// ──────────────────────────────────────────────
// USUARIO ACTIVO — obtener sesión actual
// ──────────────────────────────────────────────
function obtenerUsuarioActivo() {
    try {
        var datos = localStorage.getItem(CLAVE_USUARIO_ACTIVO);
        if (datos === null) {
            return null;
        }
        return JSON.parse(datos);
    } catch (error) {
        return null;
    }
}

// ──────────────────────────────────────────────
// USUARIO ACTIVO — cerrar sesión
// ──────────────────────────────────────────────
function cerrarSesion() {
    localStorage.removeItem(CLAVE_USUARIO_ACTIVO);
}
