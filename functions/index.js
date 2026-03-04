const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference } = require("mercadopago");

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURACIÓN ---
const DROPI_API_KEY = "PENDIENTE_DE_SOPORTE"; // Pega tu clave de Dropi aquí cuando la tengas
const DROPI_URL = "https://api.dropi.cl/api/v1/orders";

const DROPI_WOOCOMMERCE_TOKEN = "147606"; // ID de Dropi o token acordado para validación

// Token de PRUEBA de Mercado Pago
const client = new MercadoPagoConfig({ accessToken: 'TEST-2437783845936267-021801-89b482c6c28daecf5e5ad6a603c34bd4-3204973335' });
const axios = require('axios');
const cheerio = require('cheerio');

exports.scrapeDropiProduct = onCall(async (request) => {
  try {
    if (!request || !request.data || !request.data.url) {
      throw new HttpsError('invalid-argument', 'Petición sin URL válida');
    }
    const { url } = request.data;
    if (!url || !url.includes('dropi')) {
      throw new HttpsError('invalid-argument', 'URL inválida de Dropi');
    }

    // Usando una cabecera para simular un navegador moderno y saltar bloqueos simples
    const response = await axios.get(url, {
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response || !response.data) throw new Error("Sin respuesta de Dropi");
    const $ = cheerio.load(response.data);

    // Selectors to tune based on Dropi's actual DOM structure
    // Dropi product pages usually have a title, some price, and images in a gallery.

    // We try generic selectors that might work, or specific ones if known.
    // For a generic approach based on standard e-commerce:
    const title = $('h1').first().text().trim() || $('title').text().replace('- Dropi', '').trim();

    const description = $('.description, #tab-description, .product-details').first().text().replace(/\s+/g, ' ').trim() || '';

    // Intento de extraer categoría
    let category = '';
    const breadcrumbText = $('.breadcrumb, .breadcrumbs, .nav-links').text().trim();
    if (breadcrumbText) {
      const parts = breadcrumbText.split(/[\/>-]/).map(p => p.trim()).filter(Boolean);
      category = parts[parts.length - 1] || 'General';
    } else {
      category = 'tecnologia';
    }

    // Images: look for main product image or gallery
    const images = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      // basic filter to avoid 1x1 pixels or logos
      if (src && !src.includes('logo') && !src.includes('icon') && src.startsWith('http')) {
        images.push(src);
      }
    });

    // Try to extract an SKU from URL or DOM
    let dropiSku = '';
    const match = url.match(/product-details\/(\d+)/);
    if (match) dropiSku = match[1];

    return {
      success: true,
      title,
      description: description.substring(0, 1000), // Limit description length
      category,
      images: Array.from(new Set(images)), // All images
      dropiSku,
      originalUrl: url
    };
  } catch (error) {
    console.error("Scraper Error:", error);
    throw new HttpsError('internal', 'Error al hacer scraping de la URL: ' + error.message);
  }
});

/**
 * 1. Crear Preferencia de Pago (Mercado Pago)
 * Se llama desde el Frontend cuando el cliente confirma sus datos.
 */
exports.crearPreferenciaPago = onCall(async (request) => {
  const data = request.data;

  try {
    const preference = new Preference(client);

    // Mapeo de productos para MP
    const items = data.items.map(item => ({
      title: item.title,
      unit_price: Number(item.price),
      quantity: Number(item.quantity),
      currency_id: "CLP"
    }));

    const result = await preference.create({
      body: {
        items: items,
        payer: {
          name: data.customer.nombre,
          email: data.customer.email,
          phone: {
            area_code: "56",
            number: String(data.customer.telefono).replace(/\D/g, "").slice(-8)
          }
        },
        back_urls: {
          success: "https://pimstore.cl/success", // Cambiar por la URL real de éxito
          failure: "https://pimstore.cl/checkout", // Mantiene al usuario en el checkout
          pending: "https://pimstore.cl/checkout"
        },
        auto_return: "approved",
        metadata: {
          customer_rut: data.customer.rut
        }
      }
    });

    return { preferenceId: result.id };

  } catch (error) {
    console.error("Error MercadoPago:", error);
    // Retornamos el error al cliente de forma controlada
    return { error: "No se pudo iniciar el pago. Verifica tus datos o intenta más tarde." };
  }
});

/**
 * 2. Trigger de Logística (Dropi)
 * Se activa automáticamente cuando se crea una orden en Firestore con estado "pagado".
 */
exports.enviarOrdenADropi = onDocumentCreated({
  document: "artifacts/{appId}/public/data/orders/{orderId}",
  retry: true
}, async (event) => {
  const snap = event.data;
  if (!snap) return null;

  const orderData = snap.data();

  // VERIFICACIÓN CRÍTICA: Solo enviamos a Dropi si el estado es explícitamente 'pagado' (Mercado Pago 'approved')
  // y si no se ha sincronizado previamente.
  if (orderData.status !== 'pagado' || orderData.dropiSync === 'enviado') {
    console.log(`Orden ${orderData.orderNumber} ignorada. Estado: ${orderData.status}, Sync: ${orderData.dropiSync}`);
    return null;
  }

  console.log(`Procesando orden confirmada para Dropi: ${orderData.orderNumber}`);

  if (DROPI_API_KEY === "PENDIENTE_DE_SOPORTE") {
    console.log("⚠️ API Key de Dropi no configurada. Orden guardada solo en Firebase.");
    return null; // Opcional: podrías marcar dropiSync: 'pendiente' en la orden
  }

  // Mapeo detallado de datos para Dropi
  const mapeoDeDatos = {
    number: orderData.orderNumber,
    customer_name: orderData.customer.nombre,
    customer_email: orderData.customer.email,
    customer_phone: orderData.customer.telefono,
    customer_address: orderData.customer.direccion, // Aquí ya va "Calle Numero Depto"
    customer_city: orderData.customer.comuna,
    customer_province: orderData.customer.region,
    customer_rut: orderData.customer.rut,
    // Dropi suele usar 'comments', 'reference' o 'observations' para la información adicional del repartidor
    comments: orderData.customer.notasEnvio || "Sin instrucciones adicionales",
    products: orderData.items.map(item => ({
      name: item.title,
      quantity: item.quantity,
      price: item.price,
      sku: item.dropiSku || ""
    }))
  };

  // Lógica de conexión a Dropi (se descomenta cuando tengas la Key)
  /*
  try {
      const response = await axios.post(DROPI_URL, mapeoDeDatos, { 
          headers: { 
              "Authorization": `Bearer ${DROPI_API_KEY}`,
              "Content-Type": "application/json"
          } 
      });
      return snap.ref.update({ dropiSync: 'enviado', dropiId: response.data.id });
  } catch (e) {
      console.error(e);
      return snap.ref.update({ dropiSync: 'error', dropiError: e.message });
  }
  return null;
});

/**
 * 3. Webhook emulando WooCommerce API (/wp-json/wc/v3/orders)
 * Recibe actualizaciones de estado desde Dropi y actualiza la base de datos de PiMStore.
 */
  exports.wcWebhook = onRequest(async (req, res) => {
    // 1. Dropi hace un GET inicial para verificar que la tienda es un WooCommerce válido
    if (req.method === 'GET') {
      return res.status(200).json({
        name: "PiMStore",
        description: "Tienda PiMStore",
        url: "https://pimstore.web.app",
        home: "https://pimstore.web.app",
        routes: {
          "/wc/v3": { endpoints: [{ methods: ["GET", "POST"] }] },
          "/wc/v3/orders": { endpoints: [{ methods: ["GET", "POST"] }] }
        }
      });
    }

    // 2. Para POST/PUT, procesamos la actualización de la orden
    if (req.method !== 'POST' && req.method !== 'PUT') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const authHeader = req.headers.authorization || '';
      const tokenParts = authHeader.split(' ');
      let token = '';

      if (tokenParts.length === 2 && tokenParts[0] === 'Bearer') {
        token = tokenParts[1];
      } else if (req.query.token) {
        token = req.query.token;
      } else {
        // Algunas veces en WooCommerce se envía vía query o basic auth. Por ahora asumimos Bearer o Header custom.
        token = req.headers['x-dropi-token'] || req.headers['x-wc-webhook-signature'] || '';
      }

      // Autenticación por Consumer Key de WooCommerce (Dropi)
      const consumerKey = req.query.consumer_key || '';
      const consumerSecret = req.query.consumer_secret || '';

      let isAuthenticated = false;

      // a) Verificamos si pasaron las credenciales exactas (por Query param)
      if (consumerKey === 'ck_pimstore_dropi' && consumerSecret === 'cs_pimstore_dropi') {
        isAuthenticated = true;
      }
      // b) Verificamos Basic Auth (común en WooCommerce)
      else if (authHeader.startsWith('Basic ')) {
        const b64auth = authHeader.split(' ')[1] || '';
        const [user, pwd] = Buffer.from(b64auth, 'base64').toString().split(':');
        if (user === 'ck_pimstore_dropi' && pwd === 'cs_pimstore_dropi') {
          isAuthenticated = true;
        }
      }
      // c) Dropi Token o variables fallback
      else if (token === DROPI_WOOCOMMERCE_TOKEN || token.includes('tEwJ5B1c')) {
        isAuthenticated = true;
      }
      // d) Permiso excepcional si en el body viene desde Dropi (algunas veces no mandan token visible pero sí payload de Dropi)
      else if (req.body && req.body.status && req.headers['user-agent']?.includes('Dropi')) {
        isAuthenticated = true;
      }

      if (!isAuthenticated) {
        console.warn("Intento de acceso webhook sin token válido");
        return res.status(401).send('Unauthorized');
      }

      const payload = req.body;
      console.log("Recibido Webhook WooCommerce (Dropi):", JSON.stringify(payload));

      const orderIdOrNumber = payload.id || payload.number || payload.order_id;
      const newStatus = payload.status; // ej. 'processing', 'completed', 'cancelled'

      if (!orderIdOrNumber || !newStatus) {
        return res.status(400).send('Bad Request: Missing order id or status');
      }

      // Mapeo básico de estados comunes de WooCommerce a PiMStore
      let pimstoreStatus = newStatus;
      switch (newStatus.toLowerCase()) {
        case 'processing': pimstoreStatus = 'Preparando'; break;
        case 'completed': pimstoreStatus = 'Entregado'; break;
        case 'cancelled': pimstoreStatus = 'Cancelado'; break;
        case 'refunded': pimstoreStatus = 'Pendiente de Reembolso'; break;
        case 'shipped': pimstoreStatus = 'Enviado'; break;
        case 'returned': pimstoreStatus = 'Producto Devuelto'; break;
        // Dropi might send specific Spanish statuses. Just pass them if unmatched.
        default:
          if (newStatus.toLowerCase().includes('enviad')) pimstoreStatus = 'Enviado';
          else if (newStatus.toLowerCase().includes('entregad')) pimstoreStatus = 'Entregado';
          break;
      }

      // Necesitamos encontrar la orden en Firestore usando el orderNumber.
      // Como functions index.js no usa un appId fijo (o lo usa si lo defines), 
      // asumimos que puedes tener múltiples apps o buscar globalmente.
      // Por diseño actual de tu BD: artifacts/{appId}/public/data/orders/{orderId}
      // Como es Firebase Functions, usaremos un CollectionGroup (requiere índice en Firestore) 
      // o consultaremos de forma estricta si conocemos el AppId.
      // Usaremos un collectionGroup ya que "orderNumber" debe ser único.

      const ordersSnapshot = await db.collectionGroup('orders')
        .where('orderNumber', '==', String(orderIdOrNumber))
        .limit(1)
        .get();

      if (ordersSnapshot.empty) {
        console.warn(`Webhook: No se encontró orden con orderNumber ${orderIdOrNumber}`);
        return res.status(404).send('Order not found');
      }

      const orderDoc = ordersSnapshot.docs[0];
      const orderData = orderDoc.data();

      const currentStatus = orderData.orderStatus || orderData.status || 'Pendiente';

      // Si el estado es distinto, lo actualizamos y añadimos al historial
      if (currentStatus !== pimstoreStatus) {
        const newHistory = [
          ...(orderData.statusHistory || [{ status: currentStatus, date: orderData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString() }]),
          { status: pimstoreStatus, date: new Date().toISOString(), source: 'dropi_webhook' }
        ];

        await orderDoc.ref.update({
          orderStatus: pimstoreStatus,
          statusHistory: newHistory,
          dropiUpdated: new Date().toISOString()
        });
        console.log(`Orden ${orderIdOrNumber} actualizada al estado ${pimstoreStatus}`);
      } else {
        console.log(`Orden ${orderIdOrNumber} ya tenía el estado ${pimstoreStatus}. Ignorando.`);
      }

    } catch (error) {
      console.error("Error en Webhook WooCommerce:", error);
      return res.status(500).send('Internal Server Error');
    }
  });