const productosContenedor = document.getElementById("productos-contenedor");
const productosMensaje = document.getElementById("productos-mensaje");
const carritoItemsContenedor = document.getElementById("carrito-items");
const carritoTotal = document.getElementById("carrito-total");
const carritoVacio = document.getElementById("carrito-vacio");
const carritoFeedback = document.getElementById("carrito-feedback");
const carritoEstado = document.getElementById("carrito-estado");
const toastFeedback = document.getElementById("toast-feedback");
const carritoFlotante = document.getElementById("carrito-flotante");
const carritoFlotanteContador = document.getElementById("carrito-flotante-contador");
const vaciarCarritoBtn = document.getElementById("vaciar-carrito");
const finalizarCompraBtn = document.getElementById("finalizar-compra");
const galeriaToggle = document.getElementById("galeria-toggle");
const claveCarrito = "ceramiclab-carrito";
let productos = [];
let carrito = obtenerCarritoInicial();
let feedbackTimeout;
let toastTimeout;

function obtenerCarritoInicial() {
  try {
    const carritoGuardado = localStorage.getItem(claveCarrito);
    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  } catch (error) {
    localStorage.removeItem(claveCarrito);
    return [];
  }
}

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0
  }).format(precio);
}

function guardarCarrito() {
  localStorage.setItem(claveCarrito, JSON.stringify(carrito));
}

function obtenerCantidadTotal() {
  return carrito.reduce((total, item) => total + item.cantidad, 0);
}

function obtenerEnlaceCarrito() {
  return document.querySelector('nav a[href="carrito.html"]');
}

function actualizarContadorCarrito() {
  const enlaceCarrito = obtenerEnlaceCarrito();
  const cantidad = obtenerCantidadTotal();

  if (!enlaceCarrito) {
    if (carritoFlotante && carritoFlotanteContador) {
      carritoFlotanteContador.textContent = String(cantidad);
      carritoFlotante.classList.toggle("visible", cantidad > 0);
    }

    return;
  }

  enlaceCarrito.textContent = `Carrito (${cantidad})`;

  if (carritoFlotante && carritoFlotanteContador) {
    carritoFlotanteContador.textContent = String(cantidad);
    carritoFlotante.classList.toggle("visible", cantidad > 0);
  }
}

function limpiarEstadosFeedback(elemento) {
  if (!elemento) {
    return;
  }

  elemento.classList.remove("visible", "exito", "error", "advertencia");
}

function mostrarFeedback(texto, tipo = "exito", destino = carritoFeedback || carritoEstado) {
  if (toastFeedback) {
    limpiarEstadosFeedback(toastFeedback);
    toastFeedback.textContent = texto;
    toastFeedback.classList.add(tipo, "visible");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastFeedback.textContent = "";
      limpiarEstadosFeedback(toastFeedback);
    }, 2500);
  }

  if (!destino) {
    return;
  }

  limpiarEstadosFeedback(destino);
  destino.textContent = texto;
  destino.classList.add(tipo, "visible");

  clearTimeout(feedbackTimeout);
  feedbackTimeout = setTimeout(() => {
    destino.textContent = "";
    limpiarEstadosFeedback(destino);
  }, 2500);
}

function renderizarCarrito() {
  if (!carritoItemsContenedor || !carritoTotal || !carritoVacio) {
    actualizarContadorCarrito();
    return;
  }

  carritoItemsContenedor.innerHTML = "";

  if (!carrito.length) {
    carritoVacio.style.display = "block";
    carritoTotal.textContent = formatearPrecio(0);

    if (vaciarCarritoBtn) {
      vaciarCarritoBtn.disabled = true;
    }

    if (finalizarCompraBtn) {
      finalizarCompraBtn.disabled = true;
    }

    actualizarContadorCarrito();
    return;
  }

  carritoVacio.style.display = "none";

  if (vaciarCarritoBtn) {
    vaciarCarritoBtn.disabled = false;
  }

  if (finalizarCompraBtn) {
    finalizarCompraBtn.disabled = false;
  }

  let total = 0;

  carrito.forEach((item) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const fila = document.createElement("article");
    fila.className = "carrito-item";
    fila.innerHTML = `
      <div class="carrito-producto">
        <img src="${item.imagen}" alt="${item.nombre}" loading="lazy">
        <div>
          <h3>${item.nombre}</h3>
          <p>${item.descripcion}</p>
        </div>
      </div>
      <div class="carrito-cantidad">
        <button type="button" class="cantidad-btn" data-accion="restar" data-id="${item.id}" aria-label="Restar una unidad de ${item.nombre}">-</button>
        <span>${item.cantidad}</span>
        <button type="button" class="cantidad-btn" data-accion="sumar" data-id="${item.id}" aria-label="Sumar una unidad de ${item.nombre}">+</button>
      </div>
      <p class="carrito-precio">${formatearPrecio(item.precio)}</p>
      <p class="carrito-subtotal">${formatearPrecio(subtotal)}</p>
      <button type="button" class="eliminar-btn" data-id="${item.id}">Eliminar</button>
    `;

    carritoItemsContenedor.appendChild(fila);
  });

  carritoTotal.textContent = formatearPrecio(total);
  actualizarContadorCarrito();
}

function agregarAlCarrito(idProducto) {
  const producto = productos.find((item) => item.id === idProducto);

  if (!producto) {
    return;
  }

  const existente = carrito.find((item) => item.id === idProducto);

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  guardarCarrito();
  renderizarCarrito();
  mostrarFeedback("Taza agregada al carrito", "exito");
}

function cambiarCantidad(idProducto, accion) {
  carrito = carrito
    .map((item) => {
      if (item.id !== idProducto) {
        return item;
      }

      const nuevaCantidad = accion === "sumar" ? item.cantidad + 1 : item.cantidad - 1;
      return { ...item, cantidad: nuevaCantidad };
    })
    .filter((item) => item.cantidad > 0);

  guardarCarrito();
  renderizarCarrito();
  mostrarFeedback("Cantidad actualizada", "exito", carritoEstado);
}

function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter((item) => item.id !== idProducto);
  guardarCarrito();
  renderizarCarrito();
  mostrarFeedback("Producto eliminado del carrito", "advertencia", carritoEstado);
}

function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  renderizarCarrito();
  mostrarFeedback("Carrito vacío", "advertencia", carritoEstado);
}

function finalizarCompra() {
  if (!carrito.length) {
    return;
  }

  carrito = [];
  guardarCarrito();
  renderizarCarrito();
  mostrarFeedback("Compra finalizada con éxito", "exito", carritoEstado);
}

function renderizarProductos() {
  if (!productosContenedor) {
    return;
  }

  productosContenedor.innerHTML = productos
    .map((producto) => `
      <article class="card-producto">
        <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
        <h3>${producto.nombre}</h3>
        <p>${producto.descripcion}</p>
        <span class="precio">${formatearPrecio(producto.precio)}</span>
        <button type="button" class="agregar-carrito-btn" data-id="${producto.id}">Agregar al carrito</button>
      </article>
    `)
    .join("");
}

function renderizarInfoGaleria() {
  const galeriaItems = document.querySelectorAll(".galeria-item[data-producto-id]");

  if (!galeriaItems.length || !productos.length) {
    return;
  }

  galeriaItems.forEach((item) => {
    const info = item.querySelector(".galeria-info");
    const producto = productos.find((entrada) => String(entrada.id) === item.dataset.productoId);

    if (!info || !producto) {
      return;
    }

    info.innerHTML = `
      <strong>${producto.nombre}</strong>
      <span>${formatearPrecio(producto.precio)}</span>
    `;
  });
}

function obtenerProductoDesdeGaleria(item) {
  if (!item) {
    return null;
  }

  return productos.find((entrada) => String(entrada.id) === item.dataset.productoId) || null;
}

function actualizarVistaGaleria(expandida) {
  const galeriaItems = Array.from(document.querySelectorAll(".galeria-item"));

  if (!galeriaItems.length || !galeriaToggle) {
    return;
  }

  galeriaItems.forEach((item, index) => {
    item.classList.toggle("galeria-item-oculto", !expandida && index >= 3);
  });

  galeriaToggle.textContent = expandida ? "Ver menos" : "Ver más";
  galeriaToggle.setAttribute("aria-expanded", expandida ? "true" : "false");
}

function inicializarToggleGaleria() {
  if (!galeriaToggle) {
    return;
  }

  let expandida = false;
  actualizarVistaGaleria(expandida);

  galeriaToggle.addEventListener("click", () => {
    expandida = !expandida;
    actualizarVistaGaleria(expandida);
  });
}

function inicializarGaleria() {
  const galeriaItems = Array.from(document.querySelectorAll(".galeria-item"));
  const galeriaModal = document.getElementById("galeria-modal");

  if (!galeriaItems.length || !galeriaModal) {
    return;
  }

  const galeriaModalImagen = galeriaModal.querySelector(".galeria-modal-imagen");
  const lightboxTitulo = galeriaModal.querySelector(".lightbox-titulo");
  const lightboxPrecio = galeriaModal.querySelector(".lightbox-precio");
  const lightboxDescripcion = galeriaModal.querySelector(".lightbox-descripcion");
  const galeriaCerrar = galeriaModal.querySelector(".galeria-modal-cerrar");
  const galeriaPrev = galeriaModal.querySelector(".galeria-modal-prev");
  const galeriaNext = galeriaModal.querySelector(".galeria-modal-next");
  let galeriaActual = 0;

  function renderizarImagen(index) {
    const item = galeriaItems[index];
    const imagen = item.querySelector("img");
    const producto = obtenerProductoDesdeGaleria(item);
    galeriaModalImagen.src = item.getAttribute("href");
    galeriaModalImagen.alt = imagen.alt;

    if (producto) {
      lightboxTitulo.textContent = producto.nombre;
      lightboxPrecio.textContent = formatearPrecio(producto.precio);
      lightboxDescripcion.textContent = producto.descripcion || "Taza artesanal destacada de CeramicLab.";
    } else {
      lightboxTitulo.textContent = "Taza destacada";
      lightboxPrecio.textContent = "";
      lightboxDescripcion.textContent = "Diseño artesanal seleccionado de CeramicLab.";
    }

    galeriaActual = index;
  }

  function abrirModal(index) {
    renderizarImagen(index);
    galeriaModal.classList.add("activo");
    galeriaModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function cerrarModal() {
    galeriaModal.classList.remove("activo");
    galeriaModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function mostrarSiguiente() {
    const siguiente = (galeriaActual + 1) % galeriaItems.length;
    renderizarImagen(siguiente);
  }

  function mostrarAnterior() {
    const anterior = (galeriaActual - 1 + galeriaItems.length) % galeriaItems.length;
    renderizarImagen(anterior);
  }

  galeriaItems.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      abrirModal(index);
    });
  });

  galeriaCerrar.addEventListener("click", cerrarModal);
  galeriaNext.addEventListener("click", mostrarSiguiente);
  galeriaPrev.addEventListener("click", mostrarAnterior);

  galeriaModal.addEventListener("click", (event) => {
    if (event.target.dataset.closeModal === "true") {
      cerrarModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!galeriaModal.classList.contains("activo")) {
      return;
    }

    if (event.key === "Escape") {
      cerrarModal();
    }

    if (event.key === "ArrowRight") {
      mostrarSiguiente();
    }

    if (event.key === "ArrowLeft") {
      mostrarAnterior();
    }
  });
}

async function cargarProductos() {
  try {
    const respuesta = await fetch("productos.json");

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar los productos.");
    }

    productos = await respuesta.json();
    renderizarProductos();
    renderizarInfoGaleria();

    if (productosMensaje) {
      productosMensaje.textContent = "";
    }
  } catch (error) {
    if (productosContenedor) {
      productosContenedor.innerHTML = "";
    }

    if (productosMensaje) {
      productosMensaje.textContent = "No fue posible cargar el catálogo. Abrí el proyecto desde un servidor local para probar la tienda.";
    }
  }
}

function crearMensajeFormulario(formulario) {
  let mensaje = formulario.querySelector(".formulario-mensaje");

  if (!mensaje) {
    mensaje = document.createElement("p");
    mensaje.className = "formulario-mensaje";
    mensaje.setAttribute("aria-live", "polite");
    formulario.appendChild(mensaje);
  }

  return mensaje;
}

function mostrarErrorCampo(campo, texto) {
  campo.classList.add("campo-invalido");
  let error = campo.parentElement.querySelector(`[data-error="${campo.id}"]`);

  if (!error) {
    error = document.createElement("p");
    error.className = "campo-error";
    error.dataset.error = campo.id;
    campo.insertAdjacentElement("afterend", error);
  }

  error.textContent = texto;
}

function limpiarErrorCampo(campo) {
  campo.classList.remove("campo-invalido");
  const error = campo.parentElement.querySelector(`[data-error="${campo.id}"]`);

  if (error) {
    error.remove();
  }
}

function inicializarFormulario() {
  const formulario = document.querySelector("#contacto form");

  if (!formulario) {
    return;
  }

  const nombre = document.getElementById("nombre");
  const email = document.getElementById("email");
  const mensaje = document.getElementById("mensaje");
  const mensajeFormulario = crearMensajeFormulario(formulario);
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  [nombre, email, mensaje].forEach((campo) => {
    campo.addEventListener("input", () => {
      limpiarErrorCampo(campo);
      mensajeFormulario.textContent = "";
      mensajeFormulario.classList.remove("exito", "error", "advertencia");
    });
  });

  formulario.addEventListener("submit", (event) => {
    let formularioValido = true;

    if (!nombre.value.trim()) {
      mostrarErrorCampo(nombre, "Ingresá tu nombre.");
      formularioValido = false;
    } else {
      limpiarErrorCampo(nombre);
    }

    if (!email.value.trim()) {
      mostrarErrorCampo(email, "Ingresá tu correo electrónico.");
      formularioValido = false;
    } else if (!emailValido.test(email.value.trim())) {
      mostrarErrorCampo(email, "Ingresá un email válido.");
      formularioValido = false;
    } else {
      limpiarErrorCampo(email);
    }

    if (!mensaje.value.trim()) {
      mostrarErrorCampo(mensaje, "Escribí tu mensaje.");
      formularioValido = false;
    } else {
      limpiarErrorCampo(mensaje);
    }

    if (!formularioValido) {
      event.preventDefault();
      mensajeFormulario.textContent = "Revisá los campos marcados antes de enviar.";
      mensajeFormulario.classList.add("error");
      mensajeFormulario.classList.remove("exito", "advertencia");
      return;
    }

    if (formulario.action.includes("TU_CODIGO")) {
      event.preventDefault();
      mensajeFormulario.textContent = "Formulario validado correctamente. Para enviarlo, reemplazá el código de Formspree en el atributo action.";
      mensajeFormulario.classList.add("exito");
      mensajeFormulario.classList.remove("error", "advertencia");
      formulario.reset();
      return;
    }

    mensajeFormulario.textContent = "";
    mensajeFormulario.classList.remove("error", "exito", "advertencia");
  });
}

function inicializarAccionesCarrito() {
  if (vaciarCarritoBtn) {
    vaciarCarritoBtn.addEventListener("click", vaciarCarrito);
  }

  if (finalizarCompraBtn) {
    finalizarCompraBtn.addEventListener("click", finalizarCompra);
  }
}

document.addEventListener("click", (event) => {
  const botonAgregar = event.target.closest(".agregar-carrito-btn");
  const botonCantidad = event.target.closest(".cantidad-btn");
  const botonEliminar = event.target.closest(".eliminar-btn");

  if (botonAgregar) {
    agregarAlCarrito(Number(botonAgregar.dataset.id));
  }

  if (botonCantidad) {
    cambiarCantidad(Number(botonCantidad.dataset.id), botonCantidad.dataset.accion);
  }

  if (botonEliminar) {
    eliminarDelCarrito(Number(botonEliminar.dataset.id));
  }
});

inicializarGaleria();
inicializarToggleGaleria();
inicializarFormulario();
inicializarAccionesCarrito();
cargarProductos();
renderizarCarrito();
actualizarContadorCarrito();
