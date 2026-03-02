const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference } = require("mercadopago");

admin.initializeApp();

// --- CONFIGURACIÓN ---
const DROPI_API_KEY = "PENDIENTE_DE_SOPORTE"; // Pega tu clave de Dropi aquí cuando la tengas
const DROPI_URL = "https://api.dropi.cl/api/v1/orders";
// Token de PRUEBA de Mercado Pago
const client = new MercadoPagoConfig({ accessToken: 'TEST-2437783845936267-021801-89b482c6c28daecf5e5ad6a603c34bd4-3204973335' });

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
          success: "https://pimstore.cl", // Cambia esto a tu dominio real si difiere
          failure: "https://pimstore.cl",
          pending: "https://pimstore.cl"
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
    throw new HttpsError('internal', 'No se pudo iniciar el pago', error);
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
    
    // Solo enviamos si está pagado y no se ha enviado aún
    if (orderData.status !== 'pagado' || orderData.dropiSync === 'enviado') return null;

    console.log(`Procesando orden para Dropi: ${orderData.orderNumber}`);

    if (DROPI_API_KEY === "PENDIENTE_DE_SOPORTE") {
        console.log("⚠️ API Key de Dropi no configurada. Orden guardada solo en Firebase.");
        return null;
    }

    // Lógica de conexión a Dropi (se descomenta cuando tengas la Key)
    /*
    try {
        const response = await axios.post(DROPI_URL, { ...mapeoDeDatos }, { headers: ... });
        return snap.ref.update({ dropiSync: 'enviado', dropiId: response.data.id });
    } catch (e) {
        console.error(e);
        return snap.ref.update({ dropiSync: 'error', dropiError: e.message });
    }
    */

    return null; 
});