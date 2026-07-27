/**
 * datos.js
 * Módulo encargado de cargar los archivos JSON mediante fetch.
 * Implementa la estrategia: primera carga/actualización desde JSON → guardar en localStorage.
 * Las siguientes visitas usan localStorage.
 */

// Versión de los datos para forzar refresco del caché en localStorage cuando se actualiza el JSON
var VERSION_DATOS = "11.0";

// Determinar la ruta relativa correcta del directorio json/ dependiendo de la página actual
var RUTA_BASE_JSON = (window.location.pathname.indexOf("/pages/") !== -1) ? "../json/" : "json/";

// Determinar si la página está en el subdirectorio pages/
var EN_SUBCARPETA_PAGES = (window.location.pathname.indexOf("/pages/") !== -1);

// ──────────────────────────────────────────────
// Corregir la ruta de imagen del producto
// Las imágenes en productos.json se guardan relativas a la raíz (ej: imagenes/menu/...)
// Desde pages/ se debe agregar ../ al inicio si la ruta es local
// ──────────────────────────────────────────────
function corregirRutaImagen(rutaImagen) {
    if (!rutaImagen) {
        return EN_SUBCARPETA_PAGES ? "../imagenes/logo/fastfood-logo.jpg" : "imagenes/logo/fastfood-logo.jpg";
    }
    // Si es una URL externa (http/https), se usa tal cual
    if (rutaImagen.indexOf("http") === 0) {
        return rutaImagen;
    }
    // Si ya comienza con ../ no se modifica
    if (rutaImagen.indexOf("../") === 0) {
        return rutaImagen;
    }
    // Si estamos en pages/, agregar prefijo ../
    if (EN_SUBCARPETA_PAGES) {
        return "../" + rutaImagen;
    }
    return rutaImagen;
}

// ──────────────────────────────────────────────
// Verificar versión de datos en localStorage
// ──────────────────────────────────────────────
function verificarVersionDatos() {
    var versionGuardada = localStorage.getItem("fastmenu_version_datos");
    if (versionGuardada !== VERSION_DATOS) {
        localStorage.removeItem(CLAVE_PRODUCTOS);
        localStorage.removeItem(CLAVE_CATEGORIAS);
        localStorage.removeItem(CLAVE_USUARIOS);
        localStorage.setItem("fastmenu_version_datos", VERSION_DATOS);
    }
}

// ──────────────────────────────────────────────
// Cargar PRODUCTOS desde JSON o localStorage
// Retorna una promesa con el arreglo de productos
// ──────────────────────────────────────────────
function cargarProductos() {
    verificarVersionDatos();

    var productosGuardados = obtenerDeStorage(CLAVE_PRODUCTOS);

    if (productosGuardados !== null && productosGuardados.length >= 40) {
        return Promise.resolve(productosGuardados);
    }

    return fetch(RUTA_BASE_JSON + "productos.json")
        .then(function(respuesta) {
            if (!respuesta.ok) {
                throw new Error("No se pudo cargar productos.json. Código: " + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function(productos) {
            guardarEnStorage(CLAVE_PRODUCTOS, productos);
            return productos;
        })
        .catch(function(error) {
            console.error("Error al cargar productos desde " + RUTA_BASE_JSON + "productos.json:", error);
            throw error;
        });
}

// ──────────────────────────────────────────────
// Cargar CATEGORÍAS desde JSON o localStorage
// ──────────────────────────────────────────────
function cargarCategorias() {
    verificarVersionDatos();

    var categoriasGuardadas = obtenerDeStorage(CLAVE_CATEGORIAS);

    if (categoriasGuardadas !== null && categoriasGuardadas.length >= 6) {
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
    verificarVersionDatos();

    var usuariosGuardados = obtenerDeStorage(CLAVE_USUARIOS);

    if (usuariosGuardados !== null && usuariosGuardados.length > 0) {
        var tieneAdmin = false;
        for (var u of usuariosGuardados) {
            if (u.email === "admin@espe.edu.ec") {
                tieneAdmin = true;
                break;
            }
        }
        if (tieneAdmin) {
            return Promise.resolve(usuariosGuardados);
        }
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
// Cargar productos directamente desde la API externa DummyJSON
// ──────────────────────────────────────────────
function cargarProductosDesdeDummyJSON() {
    return fetch("https://dummyjson.com/products?limit=12")
        .then(function(respuesta) {
            if (!respuesta.ok) {
                throw new Error("Error HTTP al consultar DummyJSON: " + respuesta.status);
            }
            return respuesta.json();
        })
        .then(function(datos) {
            var productosAPI = [];
            var items = datos.products || [];

            for (var p of items) {
                productosAPI.push({
                    id: 1000 + p.id,
                    nombre: p.title,
                    descripcion: p.description || "Producto de tienda universitaria",
                    precio: p.price,
                    categoriaId: 4, // Categoría Combos/General
                    stock: p.stock || 10,
                    imagen: p.thumbnail || (p.images ? p.images[0] : "../imagenes/logo/fastfood-logo.jpg"),
                    estado: "disponible",
                    fechaRegistro: new Date().toISOString().split("T")[0]
                });
            }

            return productosAPI;
        })
        .catch(function(error) {
            console.error("Error al consumir DummyJSON:", error);
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
    if (!arreglo || arreglo.length === 0) {
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
