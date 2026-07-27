/**
 * validaciones.js
 * Módulo con funciones de validación de formularios.
 * Todas las validaciones retornan true (válido) o false (inválido).
 */

// ──────────────────────────────────────────────
// Verificar si un campo de texto está vacío
// ──────────────────────────────────────────────
function campoEstaVacio(valor) {
    if (valor === null || valor === undefined) {
        return true;
    }
    return valor.trim() === "";
}

// ──────────────────────────────────────────────
// Validar formato de correo electrónico
// Usa una expresión regular básica
// ──────────────────────────────────────────────
function correoEsValido(correo) {
    var expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return expresion.test(correo);
}

// ──────────────────────────────────────────────
// Validar que el correo sea institucional ESPE
// ──────────────────────────────────────────────
function correoEsInstitucional(correo) {
    return correo.endsWith("@espe.edu.ec");
}

// ──────────────────────────────────────────────
// Validar longitud mínima y máxima de un campo
// ──────────────────────────────────────────────
function longitudEsValida(valor, minimo, maximo) {
    var longitud = valor.trim().length;
    return longitud >= minimo && longitud <= maximo;
}

// ──────────────────────────────────────────────
// Validar que la cédula ecuatoriana tenga 10 dígitos
// ──────────────────────────────────────────────
function cedulaEsValida(cedula) {
    var soloNumeros = /^\d{10}$/;
    return soloNumeros.test(cedula);
}

// ──────────────────────────────────────────────
// Validar que dos contraseñas coincidan
// ──────────────────────────────────────────────
function contrasenasCoinciden(password1, password2) {
    return password1 === password2;
}

// ──────────────────────────────────────────────
// Validar que el precio sea un número positivo
// ──────────────────────────────────────────────
function precioEsValido(valor) {
    var numero = parseFloat(valor);
    return !isNaN(numero) && numero > 0;
}

// ──────────────────────────────────────────────
// Validar que el stock sea un número entero no negativo
// ──────────────────────────────────────────────
function stockEsValido(valor) {
    var numero = parseInt(valor);
    return !isNaN(numero) && numero >= 0;
}

// ──────────────────────────────────────────────
// Validar que el teléfono tenga formato ecuatoriano
// Acepta: 09XXXXXXXX (10 dígitos)
// ──────────────────────────────────────────────
function telefonoEsValido(telefono) {
    var expresion = /^09\d{8}$/;
    return expresion.test(telefono);
}

// ──────────────────────────────────────────────
// Mostrar error visual en un campo de formulario
// Agrega clase CSS de error y muestra mensaje
// ──────────────────────────────────────────────
function mostrarErrorCampo(idCampo, mensaje) {
    var campo = document.getElementById(idCampo);
    if (campo === null) {
        return;
    }
    campo.classList.add("campo-error");

    // Buscar si ya existe un mensaje de error para este campo
    var idMensaje = "error-" + idCampo;
    var mensajeExistente = document.getElementById(idMensaje);

    if (mensajeExistente !== null) {
        mensajeExistente.textContent = mensaje;
    } else {
        var spanError = document.createElement("span");
        spanError.id = idMensaje;
        spanError.className = "texto-error";
        spanError.textContent = mensaje;
        campo.parentNode.insertBefore(spanError, campo.nextSibling);
    }
}

// ──────────────────────────────────────────────
// Limpiar el error visual de un campo
// ──────────────────────────────────────────────
function limpiarErrorCampo(idCampo) {
    var campo = document.getElementById(idCampo);
    if (campo === null) {
        return;
    }
    campo.classList.remove("campo-error");

    var idMensaje = "error-" + idCampo;
    var mensajeError = document.getElementById(idMensaje);
    if (mensajeError !== null) {
        mensajeError.remove();
    }
}

// ──────────────────────────────────────────────
// Limpiar todos los errores del formulario
// ──────────────────────────────────────────────
function limpiarTodosLosErrores(idFormulario) {
    var formulario = document.getElementById(idFormulario);
    if (formulario === null) {
        return;
    }

    var camposConError = formulario.querySelectorAll(".campo-error");
    for (var campo of camposConError) {
        campo.classList.remove("campo-error");
    }

    var mensajesError = formulario.querySelectorAll(".texto-error");
    for (var mensaje of mensajesError) {
        mensaje.remove();
    }
}

// ──────────────────────────────────────────────
// Validar el formulario de REGISTRO de usuario
// Retorna un objeto: { esValido: bool, errores: [] }
// ──────────────────────────────────────────────
function validarFormularioRegistro(datos) {
    var errores = [];

    if (campoEstaVacio(datos.nombres)) {
        errores.push({ campo: "nombres", mensaje: "El nombre es obligatorio." });
    }

    if (campoEstaVacio(datos.apellidos)) {
        errores.push({ campo: "apellidos", mensaje: "Los apellidos son obligatorios." });
    }

    if (!cedulaEsValida(datos.cedula)) {
        errores.push({ campo: "cedula", mensaje: "La cédula debe tener exactamente 10 dígitos." });
    }

    if (campoEstaVacio(datos.email)) {
        errores.push({ campo: "email", mensaje: "El correo es obligatorio." });
    } else if (!correoEsValido(datos.email)) {
        errores.push({ campo: "email", mensaje: "El formato del correo no es válido." });
    } else if (!correoEsInstitucional(datos.email)) {
        errores.push({ campo: "email", mensaje: "Debe usar un correo institucional @espe.edu.ec" });
    }

    if (!longitudEsValida(datos.password, 8, 16)) {
        errores.push({ campo: "password", mensaje: "La contraseña debe tener entre 8 y 16 caracteres." });
    }

    if (!contrasenasCoinciden(datos.password, datos.confirmPassword)) {
        errores.push({ campo: "confirm_password", mensaje: "Las contraseñas no coinciden." });
    }

    if (campoEstaVacio(datos.fechaNacimiento)) {
        errores.push({ campo: "fecha_nacimiento", mensaje: "La fecha de nacimiento es obligatoria." });
    }

    if (campoEstaVacio(datos.genero)) {
        errores.push({ campo: "genero", mensaje: "Debe seleccionar un género." });
    }

    return {
        esValido: errores.length === 0,
        errores: errores
    };
}

// ──────────────────────────────────────────────
// Validar el formulario de PRODUCTO (agregar/editar)
// ──────────────────────────────────────────────
function validarFormularioProducto(datos) {
    var errores = [];

    if (campoEstaVacio(datos.nombre)) {
        errores.push({ campo: "prod-nombre", mensaje: "El nombre del producto es obligatorio." });
    }

    if (campoEstaVacio(datos.descripcion)) {
        errores.push({ campo: "prod-descripcion", mensaje: "La descripción es obligatoria." });
    }

    if (!precioEsValido(datos.precio)) {
        errores.push({ campo: "prod-precio", mensaje: "El precio debe ser un número mayor a 0." });
    }

    if (!stockEsValido(datos.stock)) {
        errores.push({ campo: "prod-stock", mensaje: "El stock debe ser un número entero mayor o igual a 0." });
    }

    if (campoEstaVacio(String(datos.categoriaId))) {
        errores.push({ campo: "prod-categoria", mensaje: "Debe seleccionar una categoría." });
    }

    return {
        esValido: errores.length === 0,
        errores: errores
    };
}
