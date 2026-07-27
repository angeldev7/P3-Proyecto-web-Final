/**
 * registro.js
 * Lógica completa del formulario de registro de usuario.
 * Conecta con la API de países, valida el formulario
 * y guarda el usuario en localStorage.
 */

// Variable global para guardar los países cargados
var listaPaisesGlobal = [];

// ──────────────────────────────────────────────
// Punto de entrada: esperar a que el DOM esté listo
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
    inicializarPaginaRegistro();
});

// ──────────────────────────────────────────────
// Inicializar la página de registro
// ──────────────────────────────────────────────
function inicializarPaginaRegistro() {
    // Cargar los países para el selector de nacionalidad
    var campoBusqueda = document.getElementById("buscar-pais");
    if (campoBusqueda !== null) {
        campoBusqueda.placeholder = "Cargando países...";
        campoBusqueda.disabled    = true;

        cargarPaises()
            .then(function(paises) {
                listaPaisesGlobal             = paises;
                campoBusqueda.placeholder = "Escribe para buscar tu país...";
                campoBusqueda.disabled    = false;
                inicializarSelectorPaises(listaPaisesGlobal);
                mostrarNotificacion(paises.length + " países cargados correctamente", "info");
            })
            .catch(function(error) {
                campoBusqueda.placeholder = "Error al cargar países. Reintenta.";
                console.error("Error al cargar países:", error);

                // Notificar al usuario del error
                mostrarNotificacion("No se pudo cargar la lista de países. Verifica tu conexión.", "error");
            });
    }

    // Precargar los usuarios en localStorage si no existen
    cargarUsuarios().catch(function(error) {
        console.error("Error al precargar usuarios:", error);
    });

    // Activar la validación y el envío del formulario
    var formulario = document.getElementById("formulario-registro");
    if (formulario !== null) {
        formulario.addEventListener("submit", manejarEnvioRegistro);
    }

    // Validación en tiempo real de la cédula
    var campoCedula = document.getElementById("cedula");
    if (campoCedula !== null) {
        campoCedula.addEventListener("input", function() {
            limpiarErrorCampo("cedula");
        });
    }

    // Validación en tiempo real del correo
    var campoEmail = document.getElementById("email");
    if (campoEmail !== null) {
        campoEmail.addEventListener("input", function() {
            limpiarErrorCampo("email");
        });
    }
}

// ──────────────────────────────────────────────
// Manejar el envío del formulario de registro
// ──────────────────────────────────────────────
function manejarEnvioRegistro(evento) {
    evento.preventDefault();

    // Limpiar errores previos
    limpiarTodosLosErrores("formulario-registro");

    // Recoger los datos del formulario
    var datosFormulario = {
        nombres:         document.getElementById("nombres").value,
        apellidos:       document.getElementById("apellidos").value,
        cedula:          document.getElementById("cedula").value,
        email:           document.getElementById("email").value,
        password:        document.getElementById("password").value,
        fechaNacimiento: document.getElementById("fecha_nacimiento").value,
        genero:          document.getElementById("genero").value,
        telefono:        document.getElementById("telefono") ? document.getElementById("telefono").value : "",
        nacionalidad:    document.getElementById("nacionalidad") ? document.getElementById("nacionalidad").value : "{}"
    };

    // Validar los datos
    var resultadoValidacion = validarFormularioRegistro(datosFormulario);

    if (!resultadoValidacion.esValido) {
        // Mostrar errores en los campos correspondientes
        for (var errorItem of resultadoValidacion.errores) {
            mostrarErrorCampo(errorItem.campo, errorItem.mensaje);
        }

        mostrarNotificacion("Por favor corrige los errores del formulario.", "advertencia");
        return;
    }

    // Verificar que no exista una cédula o correo duplicado
    var usuarios = obtenerDeStorage(CLAVE_USUARIOS);
    if (usuarios === null) {
        usuarios = [];
    }

    var yaExisteCedula = false;
    var yaExisteEmail  = false;

    for (var usuarioExistente of usuarios) {
        if (usuarioExistente.cedula === datosFormulario.cedula) {
            yaExisteCedula = true;
        }
        if (usuarioExistente.email === datosFormulario.email) {
            yaExisteEmail = true;
        }
    }

    if (yaExisteCedula) {
        mostrarErrorCampo("cedula", "Ya existe un usuario con esta cédula.");
        mostrarNotificacion("La cédula ya está registrada en el sistema.", "error");
        return;
    }

    if (yaExisteEmail) {
        mostrarErrorCampo("email", "Ya existe una cuenta con este correo.");
        mostrarNotificacion("El correo ya está registrado en el sistema.", "error");
        return;
    }

    // Parsear la nacionalidad seleccionada
    var objetoNacionalidad = { nombre: "No especificada", codigoPais: "", bandera: "" };
    try {
        if (datosFormulario.nacionalidad !== "" && datosFormulario.nacionalidad !== "{}") {
            objetoNacionalidad = JSON.parse(datosFormulario.nacionalidad);
        }
    } catch (errorParseo) {
        console.warn("No se pudo parsear la nacionalidad:", errorParseo);
    }

    // Crear el objeto del nuevo usuario
    var nuevoUsuario = {
        id:              generarNuevoId(usuarios),
        nombres:         datosFormulario.nombres.trim(),
        apellidos:       datosFormulario.apellidos.trim(),
        email:           datosFormulario.email.trim(),
        password:        datosFormulario.password,
        cedula:          datosFormulario.cedula.trim(),
        fechaNacimiento: datosFormulario.fechaNacimiento,
        genero:          datosFormulario.genero,
        telefono:        datosFormulario.telefono.trim(),
        nacionalidad:    objetoNacionalidad,
        fechaRegistro:   new Date().toISOString().split("T")[0],
        rol:             "estudiante"
    };

    // Agregar el usuario al arreglo y guardar
    usuarios.push(nuevoUsuario);
    guardarEnStorage(CLAVE_USUARIOS, usuarios);

    // Mostrar confirmación de éxito con SweetAlert2
    Swal.fire({
        icon:              "success",
        title:             "¡Registro exitoso!",
        html:
            "<p>Bienvenido/a <strong>" + nuevoUsuario.nombres + " " + nuevoUsuario.apellidos + "</strong></p>" +
            "<p>Tu cuenta ha sido creada con éxito.</p>" +
            "<p>Nacionalidad: " + nuevoUsuario.nacionalidad.bandera + " " + nuevoUsuario.nacionalidad.nombre + "</p>",
        confirmButtonText:  "Ir a iniciar sesión",
        confirmButtonColor: "#e74c3c"
    }).then(function(resultado) {
        if (resultado.isConfirmed) {
            window.location.href = "../index.html";
        }
    });
}
