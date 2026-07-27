/**
 * datos.js
 * Módulo encargado de cargar los archivos JSON mediante fetch.
 * Implementa la estrategia: primera carga desde JSON → guardar en localStorage.
 * Las siguientes visitas usan localStorage directamente.
 */

// ──────────────────────────────────────────────
// Rutas de los archivos JSON
// Se usan rutas relativas desde la carpeta js/
// Las páginas en pages/ necesitan "../json/"
// ──────────────────────────────────────────────
var RUTA_BASE_JSON = "../json/";

// ──────────────────────────────────────────────
// Cargar PRODUCTOS desde JSON o localStorage
// Retorna una promesa con el arreglo de productos
// ──────────────────────────────────────────────
function cargarProductos() {
    // Verificamos si ya hay datos en el navegador
    var productosGuardados = obtenerDeStorage(CLAVE_PRODUCTOS);

    if (productosGuardados !== null && productosGuardados.length > 0) {
        // Ya tenemos datos en localStorage, los devolvemos directamente
        return Promise.resolve(productosGuardados);
    }

    // Primera carga: traemos el JSON del servidor
    return fetch(RUTA_BASE_JSON + "productos.json")
        .then(function(respuesta) {
            if (!respuesta.ok) {
                throw new Error("No se pudo cargar productos.json. Código: " + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function(productos) {
            // Guardamos en localStorage para las próximas visitas
            guardarEnStorage(CLAVE_PRODUCTOS, productos);
            return productos;
        })
        .catch(function(error) {
            console.error("Error al cargar productos:", error);
            throw error;
        });
}

// ──────────────────────────────────────────────
// Cargar CATEGORÍAS desde JSON o localStorage
// ──────────────────────────────────────────────
function cargarCategorias() {
    var categoriasGuardadas = obtenerDeStorage(CLAVE_CATEGORIAS);

    if (categoriasGuardadas !== null && categoriasGuardadas.length > 0) {
        return Promise.resolve(categoriasGuardadas);
    }

    return fetch(RUTA_BASE_JSON + "categorias.json")
        .then(function(respuesta) {
            if (!respuesta.ok) {
                throw new Error("No se pudo cargar categorias.json. Código: " + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function(categorias) {
            guardarEnStorage(CLAVE_CATEGORIAS, categorias);
            return categorias;
        })
        .catch(function(error) {
            console.error("Error al cargar categorías:", error);
            throw error;
        });
}

// ──────────────────────────────────────────────
// Cargar USUARIOS desde JSON o localStorage
// ──────────────────────────────────────────────
function cargarUsuarios() {
    var usuariosGuardados = obtenerDeStorage(CLAVE_USUARIOS);

    if (usuariosGuardados !== null && usuariosGuardados.length > 0) {
        return Promise.resolve(usuariosGuardados);
    }

    return fetch(RUTA_BASE_JSON + "usuarios.json")
        .then(function(respuesta) {
            if (!respuesta.ok) {
                throw new Error("No se pudo cargar usuarios.json. Código: " + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function(usuarios) {
            guardarEnStorage(CLAVE_USUARIOS, usuarios);
            return usuarios;
        })
        .catch(function(error) {
            console.error("Error al cargar usuarios:", error);
            throw error;
        });
}

// ──────────────────────────────────────────────
// Restablecer productos desde el JSON original
// Borra localStorage y vuelve a cargar el JSON
// ──────────────────────────────────────────────
function restablecerProductosDesdeJSON() {
    eliminarDeStorage(CLAVE_PRODUCTOS);
    return cargarProductos();
}

// ──────────────────────────────────────────────
// Buscar el nombre de una categoría por su id
// Relaciona productos.json con categorias.json
// ──────────────────────────────────────────────
function obtenerNombreCategoria(categoriaId, listaCategorias) {
    var categoriaEncontrada = null;

    for (var categoria of listaCategorias) {
        if (categoria.id === categoriaId) {
            categoriaEncontrada = categoria;
            break;
        }
    }

    if (categoriaEncontrada !== null) {
        return categoriaEncontrada.nombre;
    }
    return "Sin categoría";
}

// ──────────────────────────────────────────────
// Obtener el objeto categoría completo por id
// ──────────────────────────────────────────────
function obtenerCategoria(categoriaId, listaCategorias) {
    for (var categoria of listaCategorias) {
        if (categoria.id === categoriaId) {
            return categoria;
        }
    }
    return null;
}

// ──────────────────────────────────────────────
// Generar un nuevo ID único para productos
// Busca el ID más alto y le suma 1
// ──────────────────────────────────────────────
function generarNuevoId(arreglo) {
    if (arreglo.length === 0) {
        return 1;
    }
    var idMaximo = 0;
    for (var elemento of arreglo) {
        if (elemento.id > idMaximo) {
            idMaximo = elemento.id;
        }
    }
    return idMaximo + 1;
}
