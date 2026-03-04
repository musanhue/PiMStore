import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Novedades from './pages/Novedades';
import Seguimiento from './pages/Seguimiento';
import Devoluciones from './pages/Devoluciones';
import Soporte from './pages/Soporte';
import SobreNosotros from './pages/SobreNosotros';
import PerfilDatos from './pages/PerfilDatos';
import PerfilPedidos from './pages/PerfilPedidos';
import PerfilDirecciones from './pages/PerfilDirecciones';
import ProductoDetalle from './pages/ProductoDetalle';
import {
  ShoppingCart, X, Plus, Minus, CreditCard, Truck, ShieldCheck,
  ArrowRight, Lock, Package, DollarSign, Trash2, Zap, Star,
  CheckCircle2, AlertCircle, ChevronRight, Search, Mail, Phone,
  MapPin, Globe, ArrowLeft, LogIn, LogOut, LayoutGrid, Clock,
  PlusCircle, ListFilter, BarChart3, Settings, Trash, User, UserPlus,
  ChevronDown, Edit2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, updateProfile
} from 'firebase/auth';
import {
  getFirestore, collection, addDoc, getDocs, serverTimestamp,
  doc, deleteDoc, query, orderBy, updateDoc, increment,
  where, limit, onSnapshot, setDoc, getDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const functions = getFunctions(firebaseApp);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pimstore-prod';

// --- HELPERS Y UTILIDADES ---
// Función para validar que un RUT chileno sea real (Módulo 11)
const validateRut = (rut) => {
  // Limpiar puntos, guiones y pasar a mayúsculas
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (cleanRut.length < 8) return false;

  // Separar el cuerpo numérico y el dígito verificador
  const num = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  // Calcular módulo 11
  let s = 0, m = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    s += parseInt(num[i]) * m;
    m = m === 7 ? 2 : m + 1;
  }

  const res = 11 - (s % 11);
  const dvr = res === 11 ? '0' : res === 10 ? 'K' : String(res);

  // Retornar verdadero si el dígito calculado coincide con el ingresado
  return dvr === dv;
};

// Función para formatear el RUT chileno automáticamente (ej: 12.345.678-9)
const formatRut = (value) => {
  // Remover todo lo que no sea número o la letra K
  let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!rut) return '';
  if (rut.length <= 1) return rut;

  // Separar cuerpo y dígito verificador
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);

  // Agregar puntos cada 3 dígitos
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
};

const generateNumericOrder = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${datePart}-${randomPart}`;
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Export locations so PerfilDirecciones can use them
export const regionesYComunas = [
  { region: "Arica y Parinacota", comunas: ["Arica", "Camarones", "Putre", "General Lagos"] },
  { region: "Tarapacá", comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"] },
  { region: "Antofagasta", comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"] },
  { region: "Atacama", comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"] },
  { region: "Coquimbo", comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paihuano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"] },
  { region: "Valparaíso", comunas: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "La Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"] },
  { region: "Metropolitana", comunas: ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"] },
  { region: "O'Higgins", comunas: ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"] },
  { region: "Maule", comunas: ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"] },
  { region: "Ñuble", comunas: ["Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Quirihue", "Ránquil", "Treguaco", "Bulnes", "Chillán Viejo", "Chillán", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Coihueco", "Ñiquén", "San Carlos", "San Fabián", "San Nicolás"] },
  { region: "Biobío", comunas: ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Alto Biobío"] },
  { region: "La Araucanía", comunas: ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"] },
  { region: "Los Ríos", comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"] },
  { region: "Los Lagos", comunas: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"] },
  { region: "Aysén", comunas: ["Coihaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"] },
  { region: "Magallanes", comunas: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos (Ex Navarino)", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"] }
];

// --- COMPONENTE WALLET (MERCADO PAGO) ---
const MercadoPagoButton = ({ preferenceId }) => {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!preferenceId || !window.MercadoPago) return;
    const mp = new window.MercadoPago('TEST-342a64b1-3b53-4449-b476-27ddabd73346', { locale: 'es-CL' });
    const bricksBuilder = mp.bricks();
    const renderWallet = async () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      await bricksBuilder.create('wallet', 'wallet_container', {
        initialization: { preferenceId: preferenceId },
        customization: { texts: { valueProp: 'smart_option' } }
      });
    };
    renderWallet();
  }, [preferenceId]);
  return <div id="wallet_container" ref={containerRef} className="w-full"></div>;
};

// --- APP PRINCIPAL ---
export default function App() {
  const location = useLocation();
  // Estados de Navegación y UI
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const userMenuRef = useRef(null);

  // Estados de Datos
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]); // Para admin
  const [customers, setCustomers] = useState([]); // Para admin
  const [loading, setLoading] = useState(true);

  // Estados Admin
  const [adminTab, setAdminTab] = useState('dashboard');
  const [newProd, setNewProd] = useState({ title: '', price: '', precioNormal: '', category: '', image: '', description: '', stock: 0, dropiSku: '', isFeatured: false });
  const [editingProductId, setEditingProductId] = useState(null);

  // Estados Tracking
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState(null);

  // Inicialización
  useEffect(() => {
    // Inject MP SDK
    if (!document.querySelector('#mp-sdk')) {
      const script = document.createElement('script');
      script.id = 'mp-sdk';
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      document.body.appendChild(script);
    }
    document.title = "PiMStore | Innovación";

    const init = async () => {
      onAuthStateChanged(auth, (u) => {
        if (u) setUser(u);
        else signInAnonymously(auth).then((cred) => setUser(cred.user));
      });

      // Escuchar productos en tiempo real
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'products'), orderBy('createdAt', 'desc'));
      const unsubscribeProds = onSnapshot(q, (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      return () => unsubscribeProds();
    };
    init();

    // Close user menu on outside click
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Escuchar el perfil del usuario activo para saber su rol rápidamente
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), (docsnap) => {
        if (docsnap.exists()) setUserProfile(docsnap.data());
      });
      return () => unsub();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // -- LOGICA DEL CARRITO --
  const addToCart = (product, availableStock) => {
    // If availableStock is undefined (e.g., from old calls), calculate it
    const stockMostrado = availableStock !== undefined ? availableStock : Math.max(0, Math.round((product.stock || 0) * 0.8));

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);

      if (existing) {
        if (existing.quantity >= stockMostrado) {
          alert(`Solo puedes añadir hasta ${stockMostrado} unidades de este producto.`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }

      if (stockMostrado <= 0) {
        alert("Este producto está agotado.");
        return prev;
      }

      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta, productRef) => {
    // Need product info to check stock limit. First find item in cart.
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      // Find product from master products list if possible to get true current stock
      const masterProduct = products.find(p => p.id === id) || item;
      const stockMostrado = Math.max(0, Math.round((masterProduct.stock || 0) * 0.8));

      const newQuant = item.quantity + delta;
      if (newQuant > stockMostrado) {
        alert(`Stock máximo local alcanzado (${stockMostrado} unidades).`);
        return prev;
      }
      return prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, newQuant) } : i);
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

  // -- LOGICA ADMIN --
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (newProd.isFeatured) {
        const featuredCount = products.filter(p => p.isFeatured && p.id !== editingProductId).length;
        if (featuredCount >= 3) {
          alert('Máximo 3 productos destacados permitidos.');
          return;
        }
      }

      if (editingProductId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', editingProductId), {
          ...newProd,
          price: Number(newProd.price),
          precioNormal: newProd.precioNormal ? Number(newProd.precioNormal) : '',
          stock: Number(newProd.stock || 0),
          updatedAt: serverTimestamp()
        });
        alert('Producto actualizado correctamente');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
          ...newProd,
          price: Number(newProd.price),
          precioNormal: newProd.precioNormal ? Number(newProd.precioNormal) : '',
          stock: Number(newProd.stock || 0),
          createdAt: serverTimestamp()
        });
        alert("Producto agregado correctamente");
      }
      setNewProd({ title: '', price: '', precioNormal: '', category: '', image: '', description: '', stock: 0, dropiSku: '', isFeatured: false });
      setEditingProductId(null);
      setAdminTab('inventory');
    } catch (e) {
      alert("Error al guardar: " + e.message);
    }
  };

  const deleteProduct = async (id) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
    }
  };

  // Cargar órdenes y usuarios solo si se abre el panel admin
  useEffect(() => {
    if (isAdminOpen && user && !user.isAnonymous) {
      const qOrders = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('createdAt', 'desc'));
      const qUsers = query(collection(db, 'artifacts', appId, 'public', 'data', 'users'));

      const unsubscribeOrders = onSnapshot(qOrders, (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubscribeUsers = onSnapshot(qUsers, (snap) => {
        setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubscribeOrders(); unsubscribeUsers(); };
    }
  }, [isAdminOpen, user]);


  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans text-black overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-[#f5f5f7]/80 backdrop-blur-md z-[60] border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center cursor-pointer group">
              <img src="/pimstore-extended-logo.svg" alt="PiMStore Logo" className="h-7 md:h-8 w-auto group-hover:opacity-80 transition-opacity" />
            </Link>
            <div className="hidden md:flex gap-6 text-[12px] font-medium text-gray-500">
              <Link to="/" className={`hover:text-black transition-colors ${location.pathname === '/' ? 'text-black font-bold' : ''}`}>Tienda</Link>
              <Link to="/novedades" className={`hover:text-black transition-colors ${location.pathname === '/novedades' ? 'text-black font-bold' : ''}`}>Novedades</Link>
              <Link to="/seguimiento" className={`hover:text-black transition-colors ${location.pathname === '/seguimiento' ? 'text-black font-bold' : ''}`}>Seguimiento</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => user && !user.isAnonymous ? setIsUserMenuOpen(!isUserMenuOpen) : setIsAuthModalOpen(true)}
                className="hover:text-black text-gray-500 transition-colors flex items-center gap-2"
              >
                {user && !user.isAnonymous ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {user.email[0].toUpperCase()}
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                ) : (
                  <User size={20} />
                )}
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && user && !user.isAnonymous && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in slide-in-from-top-2 fade-in duration-200 z-[100]">
                  <div className="px-4 py-3 border-b border-gray-50 mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Conectado como</p>
                    <p className="text-sm font-bold text-indigo-900 truncate">{user.email}</p>
                  </div>
                  <Link to="/perfil/datos" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[#f5f5f7] transition-colors"><User size={16} className="text-gray-400" /> Mis Datos</Link>
                  <Link to="/perfil/pedidos" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[#f5f5f7] transition-colors"><Package size={16} className="text-gray-400" /> Mis Pedidos</Link>
                  <Link to="/perfil/direcciones" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-[#f5f5f7] transition-colors"><MapPin size={16} className="text-gray-400" /> Mis Direcciones</Link>
                  <div className="h-[1px] bg-gray-50 my-2"></div>
                  <button onClick={() => { signOut(auth); setIsUserMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"><LogOut size={16} /> Cerrar Sesión</button>
                </div>
              )}
            </div>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-all">
              <ShoppingCart size={18} strokeWidth={2} />
              {cart.length > 0 && <span className="absolute top-0 right-0 h-4 w-4 bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full text-white ring-2 ring-[#f5f5f7]">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* RENDERIZADO DE VISTAS */}

      {/* RENDERIZADO DE VISTAS */}
      <Routes>
        <Route path="/" element={<Home loading={loading} products={products} />} />
        <Route path="/novedades" element={<Novedades products={products} />} />
        <Route path="/seguimiento" element={<Seguimiento onSearch={async (trackId) => {
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), where("orderNumber", "==", trackId), limit(1));
          const s = await getDocs(q);
          return s.empty ? 'not_found' : s.docs[0].data();
        }} />} />
        <Route path="/devoluciones" element={<Devoluciones />} />
        <Route path="/soporte" element={<Soporte />} />
        <Route path="/sobre-nosotros" element={<SobreNosotros />} />
        <Route path="/perfil/datos" element={<PerfilDatos user={user} appId={appId} />} />
        <Route path="/perfil/pedidos" element={<PerfilPedidos user={user} appId={appId} />} />
        <Route path="/perfil/direcciones" element={<PerfilDirecciones user={user} appId={appId} />} />
        <Route path="/producto/:sku" element={<ProductoDetalle addToCart={addToCart} appId={appId} />} />
      </Routes>







      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 pt-20 pb-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-[12px] font-medium text-gray-500">
          <div className="md:col-span-2 space-y-4">
            <div className="mb-4">
              <img src="/pimstore-extended-logo.svg" alt="PiMStore Logo" className="h-8 md:h-10 w-auto" />
            </div>
            <p className="max-w-sm leading-relaxed">Diseño minimalista, tecnología excepcional.</p>
          </div>
          <div className="space-y-3">
            <p className="text-black font-bold uppercase tracking-widest text-[10px] mb-4">Cliente</p>
            <Link to="/seguimiento" className="block hover:text-black">Seguimiento</Link>
            <Link to="/devoluciones" className="block hover:text-black">Devoluciones</Link>
            <Link to="/soporte" className="block hover:text-black">Soporte</Link>
          </div>
          <div className="space-y-3">
            <p className="text-black font-bold uppercase tracking-widest text-[10px] mb-4">Empresa</p>
            <Link to="/sobre-nosotros" className="block hover:text-black">Sobre Nosotros</Link>
            <button onClick={() => setIsAdminOpen(true)} className="block hover:text-black flex items-center gap-2">
              {user && !user.isAnonymous && user.email !== 'musanhue@gmail.com' && (!userProfile || userProfile.role !== 'admin')
                ? <><User size={12} /> Mi Perfil</>
                : <><Lock size={12} /> {user && user.email === 'musanhue@gmail.com' ? 'Superadmin' : 'Staff / Perfil'}</>}
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL AUTH CLIENTES */}
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} auth={auth} />
      )}

      {/* CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-3xl shadow-2xl h-full p-10 flex flex-col animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-10"><h2 className="text-[32px] font-bold tracking-tight">Bolsa</h2><button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={28} /></button></div>
            <div className="flex-grow overflow-y-auto space-y-8">
              {cart.length === 0 ? <p className="text-center text-gray-400 font-medium py-20">Tu bolsa está vacía.</p> : cart.map(item => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="w-24 h-24 bg-[#f5f5f7] rounded-[24px] overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" /></div>
                  <div className="flex-1 py-1">
                    <div className="flex justify-between font-bold"><h4>{item.title}</h4><button onClick={() => removeFromCart(item.id)}><Trash size={16} className="text-gray-300 hover:text-red-500" /></button></div>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm"><button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button><span className="w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button></div>
                      <div className="ml-auto text-right flex flex-col items-end">
                        <p className="font-bold text-indigo-600">${(item.price * item.quantity).toLocaleString('es-CL')}</p>
                        {item.precioNormal && Number(item.precioNormal) > Number(item.price) && (
                          <p className="text-[10px] text-gray-400 line-through font-bold mt-0.5">${(Number(item.precioNormal) * item.quantity).toLocaleString('es-CL')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="pt-10 mt-6 border-t border-gray-100">
                <div className="flex justify-between mb-8 items-end"><span className="text-gray-500">Subtotal</span><span className="font-bold text-[28px]">${cartTotal.toLocaleString('es-CL')}</span></div>
                <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-indigo-600 text-white py-5 rounded-[20px] font-bold hover:bg-indigo-700 transition-all shadow-xl">Comprar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT */}
      {isCheckoutOpen && <CheckoutModal onClose={() => setIsCheckoutOpen(false)} cart={cart} total={cartTotal} onComplete={(num) => { setCompletedOrder(num); setIsCheckoutOpen(false); setCart([]); }} user={user} />}

      {/* ÉXITO */}
      {completedOrder && <SuccessModal orderNum={completedOrder} onClose={() => setCompletedOrder(null)} />}

      {/* PANEL ADMIN STAFF */}
      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} user={user} userProfile={userProfile} auth={auth} products={products} orders={orders} customers={customers} newProd={newProd} setNewProd={setNewProd} handleAddProduct={handleAddProduct} deleteProduct={deleteProduct} tab={adminTab} setTab={setAdminTab} functions={functions} editingProductId={editingProductId} setEditingProductId={setEditingProductId} />}

    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

const AuthModal = ({ onClose, auth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);

  const handleGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      // Al registrarse con Google, también podemos guardarlos
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', cred.user.uid), {
        email: cred.user.email,
        consentimiento: true, // Google login implies consent mostly, or ask later
        lastLogin: serverTimestamp()
      }, { merge: true });
      onClose();
    } catch (e) { setError(e.message); }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        if (!validateEmail(email)) throw new Error("Email inválido");
        if (!consentimiento) throw new Error("Debes aceptar los términos para registrarte.");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        // Guardar usuario en Firestore
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', cred.user.uid), {
          email: cred.user.email,
          consentimiento: true,
          createdAt: serverTimestamp()
        });
        await sendEmailVerification(cred.user);
        alert("Cuenta creada. Revisa tu correo para verificar.");
      }
      onClose();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] p-10 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white"><X size={20} /></button>
        <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        <button onClick={handleGoogle} className="w-full bg-white border border-gray-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 mb-6"><Globe size={18} /> Continuar con Google</button>
        <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O con correo</span></div></div>
        <form onSubmit={handleEmail} className="space-y-4">
          <input className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none" type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} />
          {!isLogin && (
            <label className="flex items-start gap-3 mt-4 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={consentimiento} onChange={e => setConsentimiento(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded" />
              <span>Concedo explícitamente el consentimiento legal a PiMStore para almacenar mis datos de contacto y dirección para facturación, envíos y recibir futuras promociones, de acuerdo con las normativas locales.</span>
            </label>
          )}
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors">{isLogin ? 'Entrar' : 'Registrarse'}</button>
        </form>
        <p className="text-center mt-6 text-sm text-gray-500 cursor-pointer hover:text-black" onClick={() => setIsLogin(!isLogin)}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}</p>
      </div>
    </div>
  );
};

const AdminPanel = ({ onClose, user, userProfile, auth, functions, products, orders, customers, newProd, setNewProd, handleAddProduct, deleteProduct, tab, setTab, editingProductId, setEditingProductId }) => {
  const [isScraping, setIsScraping] = useState(false);
  const [dropiUrlInput, setDropiUrlInput] = useState('');

  const handleLogin = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { } };

  const handleScrapeDropi = async () => {
    if (!dropiUrlInput) return alert("Ingresa un enlace de Dropi primero.");
    setIsScraping(true);
    try {
      const scrapeDropiProduct = httpsCallable(functions, 'scrapeDropiProduct');
      const result = await scrapeDropiProduct({ url: dropiUrlInput });
      const data = result.data;
      if (data.success) {
        setNewProd(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          image: data.images?.length > 0 ? data.images[0] : prev.image,
          dropiSku: data.dropiSku || prev.dropiSku
        }));
        setDropiUrlInput('');
        alert("Datos extraídos correctamente. ¡Revisa y completa el precio!");
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo extraer la información automáticamente. " + error.message);
    } finally {
      setIsScraping(false);
    }
  };

  if (!user || user.isAnonymous) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#f5f5f7] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[40px] shadow-sm max-w-md w-full text-center">
          <Lock size={48} className="mx-auto mb-6 text-gray-300" />
          <h3 className="text-2xl font-bold mb-4">Acceso a tu Cuenta</h3>
          <p className="text-gray-500 mb-8">Inicia sesión para ver tus pedidos o administrar.</p>
          <button onClick={handleLogin} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"><Globe size={18} /> Acceso con Google</button>
          <button onClick={onClose} className="mt-4 text-gray-400 text-sm hover:text-black">Volver a la tienda</button>
        </div>
      </div>
    );
  }

  const isSuperadmin = user.email === 'musanhue@gmail.com';
  const isAdmin = isSuperadmin || (userProfile && userProfile.role === 'admin');
  const activeTab = !isAdmin && tab !== 'orders' ? 'orders' : tab;
  const userOrders = isAdmin ? orders : orders.filter(o => o.userId === user.uid);

  return (
    <div className="fixed inset-0 z-[200] bg-[#f5f5f7] flex flex-col animate-in slide-in-from-bottom duration-500">
      <div className="bg-white px-8 h-16 flex justify-between items-center border-b border-gray-200 sticky top-0">
        <div className="flex items-center gap-8">
          <div className="font-bold flex items-center gap-2">{isAdmin ? <><Lock size={18} /> Staff Central</> : <><User size={18} /> Mi Perfil</>}</div>
          <div className="hidden md:flex gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {isAdmin && <button onClick={() => setTab('dashboard')} className={activeTab === 'dashboard' ? 'text-black' : ''}>Resumen</button>}
            {isAdmin && <button onClick={() => setTab('inventory')} className={activeTab === 'inventory' ? 'text-black' : ''}>Inventario</button>}
            <button onClick={() => setTab('orders')} className={activeTab === 'orders' ? 'text-black' : ''}>{isAdmin ? 'Pedidos' : 'Mis Compras'}</button>
            {isSuperadmin && <button onClick={() => setTab('customers')} className={activeTab === 'customers' ? 'text-black' : ''}>Clientes</button>}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-10 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-10">
          <div className="flex gap-4 items-center"><div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">{user.email[0].toUpperCase()}</div><div><p className="text-xs font-bold text-gray-400 uppercase">{isSuperadmin ? 'Superadmin' : isAdmin ? 'Admin' : 'Cliente'}</p><p className="font-bold">{user.email}</p></div></div>
          <button onClick={() => { signOut(auth); onClose(); }} className="text-red-500 font-bold bg-red-50 px-6 py-2 rounded-xl text-sm hover:bg-red-100 transition-colors">Cerrar Sesión</button>
        </div>

        {activeTab === 'dashboard' && isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100"><Package className="text-indigo-600 mb-2" /><h4 className="text-4xl font-bold">{products.length}</h4><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Productos</p></div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100"><Clock className="text-indigo-600 mb-2" /><h4 className="text-4xl font-bold">{orders.length}</h4><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pedidos</p></div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100"><DollarSign className="text-indigo-600 mb-2" /><h4 className="text-4xl font-bold">${orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString('es-CL')}</h4><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ventas</p></div>
          </div>
        )}

        {activeTab === 'inventory' && isAdmin && (
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-[32px] border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {editingProductId ? <><Star size={20} className="text-yellow-500" /> Editar Item</> : <><PlusCircle size={20} /> Nuevo Item</>}
                </h3>
                {editingProductId && (
                  <button type="button" onClick={() => { setEditingProductId(null); setNewProd({ title: '', price: '', precioNormal: '', category: '', image: '', description: '', stock: 0, dropiSku: '', isFeatured: false }); }} className="text-sm font-bold text-gray-400 hover:text-black">
                    Cancelar Edición
                  </button>
                )}
              </div>

              {/* Scraper Section */}
              <div className="mb-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Zap size={14} /> Auto-completar desde Dropi.cl
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    className="flex-1 bg-white p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Ej: https://app.dropi.cl/dashboard/product-details/10638/..."
                    value={dropiUrlInput}
                    onChange={(e) => setDropiUrlInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleScrapeDropi}
                    disabled={isScraping || !dropiUrlInput}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isScraping ? 'Extrayendo...' : 'Extraer Datos'}
                  </button>
                </div>
                <p className="text-xs text-indigo-700/70 mt-3 font-medium">Pega el link del producto y extraeremos el nombre, imágenes y descripción automáticamente.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddProduct(e);
                setDropiUrlInput('');
              }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input placeholder="Título" value={newProd.title} onChange={e => setNewProd({ ...newProd, title: e.target.value })} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                <input placeholder="Precio Venta" type="number" value={newProd.price} onChange={e => setNewProd({ ...newProd, price: e.target.value })} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                <input placeholder="Precio Normal (Opcional)" type="number" value={newProd.precioNormal} onChange={e => setNewProd({ ...newProd, precioNormal: e.target.value })} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" />
                <input placeholder="Categoría" value={newProd.category} onChange={e => setNewProd({ ...newProd, category: e.target.value })} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                <input placeholder="URL Imagen" value={newProd.image} onChange={e => setNewProd({ ...newProd, image: e.target.value })} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                <input placeholder="Stock" type="number" value={newProd.stock} onChange={e => setNewProd({ ...newProd, stock: e.target.value })} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                <input placeholder="SKU Dropi" value={newProd.dropiSku} onChange={e => setNewProd({ ...newProd, dropiSku: e.target.value })} className="bg-indigo-50/50 p-4 rounded-xl outline-none border border-indigo-100" />

                <label className="flex items-center gap-3 cursor-pointer bg-[#f5f5f7] p-4 rounded-xl md:col-span-2">
                  <input type="checkbox" checked={newProd.isFeatured} onChange={e => setNewProd({ ...newProd, isFeatured: e.target.checked })} className="w-5 h-5 accent-indigo-600 rounded" />
                  <span className="font-bold flex items-center gap-2"><Star size={16} className={newProd.isFeatured ? "text-yellow-500 fill-yellow-500" : "text-gray-400"} /> Producto Destacado (Carrusel)</span>
                </label>

                <textarea placeholder="Descripción" value={newProd.description} onChange={e => setNewProd({ ...newProd, description: e.target.value })} className="bg-[#f5f5f7] p-4 rounded-xl outline-none md:col-span-3 h-24" required />
                <button className="md:col-span-3 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors">{editingProductId ? 'Guardar Cambios' : 'Publicar'}</button>
              </form>
            </div>
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden">
              <table className="w-full text-left"><thead className="bg-[#f5f5f7] text-[10px] font-bold text-gray-400 uppercase"><tr><th className="p-6">Producto</th><th className="p-6">Stock</th><th className="p-6">Precio</th><th className="p-6 text-center">Acción</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{products.map(p => (<tr key={p.id}><td className="p-6 flex items-center gap-4"><img src={p.image} className="w-10 h-10 rounded-lg object-cover" /> <div>{p.isFeatured && <Star size={12} className="inline text-yellow-500 fill-yellow-500 mr-1 mb-0.5" />}<span className="font-medium">{p.title}</span></div></td><td className="p-6">{p.stock}</td><td className="p-6">${Number(p.price).toLocaleString('es-CL')}</td><td className="p-6 text-center whitespace-nowrap"><button onClick={() => { setEditingProductId(p.id); setNewProd({ title: p.title, price: p.price, precioNormal: p.precioNormal || '', category: p.category, image: p.image, description: p.description, stock: p.stock, dropiSku: p.dropiSku || '', isFeatured: p.isFeatured || false }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-gray-400 hover:text-indigo-600 mr-4" title="Editar"><Edit2 size={16} /></button><button onClick={() => deleteProduct(p.id)} className="text-gray-300 hover:text-red-500" title="Eliminar"><Trash size={16} /></button></td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {!isAdmin && <h3 className="text-2xl font-bold mb-6">Historial de Compras</h3>}
            {userOrders.length === 0 ? <p className="text-center text-gray-400 py-20">{isAdmin ? 'Sin pedidos.' : 'Aún no tienes compras registradas.'}</p> : userOrders.map(o => {
              const currentStatus = o.orderStatus || o.status || 'Pendiente';
              const stateColors = { 'Pendiente': 'bg-yellow-50 text-yellow-600', 'Pagado': 'bg-green-50 text-green-600', 'Preparando': 'bg-blue-50 text-blue-600', 'Enviado': 'bg-indigo-50 text-indigo-600', 'Entregado': 'bg-green-100 text-green-800', 'Cancelado': 'bg-red-50 text-red-600', 'En Devolución': 'bg-orange-50 text-orange-600', 'Producto Devuelto': 'bg-red-100 text-red-800', 'Pendiente de Reembolso': 'bg-yellow-100 text-yellow-800' };
              const colorClass = stateColors[currentStatus] || 'bg-gray-50 text-gray-600';

              return (
                <div key={o.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`${colorClass} text-[9px] font-bold px-2 py-1 rounded-md uppercase`}>{currentStatus}</span>
                        <span className="font-mono text-lg font-bold">#{o.orderNumber || o.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">{o.createdAt?.toDate().toLocaleString()}</p>
                      <p className="mt-2 font-bold text-sm">{o.customer?.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1">{o.customer?.email} • {o.customer?.telefono}</p>
                      {isAdmin && (
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 uppercase">Actualizar Estado:</span>
                          <select
                            value={currentStatus}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              const newHistory = [...(o.statusHistory || [{ status: currentStatus, date: o.createdAt?.toDate().toISOString() || new Date().toISOString() }]), { status: newStatus, date: new Date().toISOString() }];
                              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id), { orderStatus: newStatus, statusHistory: newHistory });
                            }}
                            className="bg-[#f5f5f7] p-2 rounded-xl text-xs outline-none font-bold text-indigo-900 border border-indigo-100 cursor-pointer"
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pagado">Pagado</option>
                            <option value="Preparando">Preparando</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Entregado">Entregado</option>
                            <option value="Cancelado">Cancelado</option>
                            <option value="En Devolución">En Devolución</option>
                            <option value="Producto Devuelto">Producto Devuelto</option>
                            <option value="Pendiente de Reembolso">Pendiente de Reembolso</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black">${o.total?.toLocaleString('es-CL')}</span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{o.items?.length} items</p>
                    </div>
                  </div>
                  {isAdmin && o.statusHistory && o.statusHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Historial de Estados</p>
                      <div className="space-y-1">
                        {o.statusHistory.map((h, i) => (
                          <div key={i} className="flex justify-between text-[11px] text-gray-500">
                            <span>{h.status}</span>
                            <span>{new Date(h.date).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'customers' && isSuperadmin && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-6">Base de Clientes</h3>
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap"><thead className="bg-[#f5f5f7] text-[10px] font-bold text-gray-400 uppercase"><tr><th className="p-6">Email</th><th className="p-6">RUT</th><th className="p-6">Nombre y Dirección</th><th className="p-6 text-center">Rol</th><th className="p-6 text-center">Marketing</th><th className="p-6 text-center">Acción</th></tr></thead>
                <tbody className="divide-y divide-gray-50 text-sm">{customers.map(c => (<tr key={c.id}><td className="p-6 font-bold">{c.email}</td><td className="p-6">{c.savedAddress?.rut || 'N/A'}</td><td className="p-6">{c.savedAddress ? <><p className="font-bold mb-1">{c.savedAddress.nombre}</p><p className="text-xs text-gray-500 whitespace-normal min-w-[200px]">{c.savedAddress.calle} {c.savedAddress.numero} {c.savedAddress.depto ? `Dpto ${c.savedAddress.depto}` : ''}, {c.savedAddress.comuna}, {c.savedAddress.region}</p></> : <span className="text-xs text-gray-400 italic">Sin dirección guardada</span>}</td><td className="p-6 text-center">{c.email === 'musanhue@gmail.com' ? <span className="text-gray-400 text-xs italic font-semibold">Superadmin</span> : <select value={c.role || 'cliente'} onChange={async (e) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', c.id), { role: e.target.value })} className="bg-gray-100 p-2 rounded-xl text-xs outline-none cursor-pointer font-bold uppercase tracking-widest text-indigo-900 border border-gray-200"><option value="cliente">Cliente</option><option value="admin">Administrador</option></select>}</td><td className="p-6 text-center">{c.consentimiento ? <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest inline-block">SÍ</span> : <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest inline-block">NO</span>}</td><td className="p-6 text-center">{c.email !== 'musanhue@gmail.com' && <button onClick={async () => { if (confirm('¿Eliminar usuario definitivamente de Firestore?')) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', c.id)); } }} className="text-gray-300 hover:text-red-500" title="Eliminar Usuario"><Trash size={16} /></button>}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CheckoutModal = ({ onClose, cart, total, onComplete, user }) => {
  const [formData, setFormData] = useState({ nombre: '', rut: '', email: user && !user.isAnonymous ? user.email : '', telefono: '+569 ', calle: '', numero: '', depto: '', comuna: '', region: '', notasEnvio: '' });
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Intentar cargar la dirección guardada si el usuario está autenticado
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const loadProfile = async () => {
        try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().savedAddress) {
            const addr = snap.data().savedAddress;
            setFormData(prev => ({
              ...prev,
              nombre: addr.nombre || prev.nombre,
              rut: addr.rut || prev.rut,
              telefono: addr.telefono || prev.telefono,
              calle: addr.calle || prev.calle,
              numero: addr.numero || prev.numero,
              depto: addr.depto || prev.depto,
              comuna: addr.comuna || prev.comuna,
              region: addr.region || prev.region
            }));
          }
        } catch (e) {
          console.error("No se pudo cargar la dirección del usuario", e);
        }
      };
      loadProfile();
    }
  }, [user]);

  const comunasDisponibles = regionesYComunas.find(r => r.region === formData.region)?.comunas || [];

  // Validaciones
  const isValidNombre = formData.nombre.trim().split(/\s+/).length >= 2;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isValidTelefono = /^\+569\s*\d{8}$/.test(formData.telefono.trim());
  const isValidCalle = formData.calle.trim().length >= 3;
  const isValidNumero = formData.numero.trim().length >= 1;
  const isValidRut = validateRut(formData.rut);
  const isValidRegion = formData.region !== '';
  const isValidComuna = formData.comuna !== '';

  const isFormValid = isValidNombre && isValidEmail && isValidTelefono && isValidCalle && isValidNumero && isValidRut && isValidRegion && isValidComuna;

  const handleNext = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setPaymentError('');
    try {
      // Combinamos la dirección para el backend
      const direccionCompleta = `${formData.calle} ${formData.numero} ${formData.depto ? 'Depto ' + formData.depto : ''}`.trim();
      const customerData = { ...formData, direccion: direccionCompleta };

      const crearPago = httpsCallable(functions, 'crearPreferenciaPago');
      const res = await crearPago({ items: cart, customer: customerData });

      if (res.data?.preferenceId) {
        setPreferenceId(res.data.preferenceId);
      } else if (res.data?.error) {
        setPaymentError(res.data.error || "Error al iniciar el pago.");
        setPreferenceId(null);
      }
    } catch (e) {
      console.error(e);
      setPaymentError("Hubo un problema de conexión al procesar el pago. Por favor, intenta de nuevo.");
      setPreferenceId(null);
    } finally {
      setLoading(false);
    }
  };

  // Escuchar mensajes de MercadoPago (ej. cuando se cierra el popup o hay error)
  useEffect(() => {
    const handleMessage = (event) => {
      // MP envía mensajes postMessage. Aquí podríamos interceptar si cierra el modal.
      // Por simplicidad, si el preferenceId existe y el cliente vuelve a la tienda sin éxito,
      // le permitimos reintentar simplemente recargando la preferencia o mostrando un botón de "Volver"
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const simulateSuccess = async () => {
    if (user && !user.isAnonymous) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
          savedAddress: {
            nombre: formData.nombre,
            rut: formData.rut,
            telefono: formData.telefono,
            calle: formData.calle,
            numero: formData.numero,
            depto: formData.depto,
            region: formData.region,
            comuna: formData.comuna
          }
        }, { merge: true });
      } catch (e) { console.error("Error guardando preferencias", e); }
    }

    const num = generateNumericOrder();
    const direccionCompleta = `${formData.calle} ${formData.numero} ${formData.depto ? 'Depto ' + formData.depto : ''}`.trim();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { orderNumber: num, customer: { ...formData, direccion: direccionCompleta }, items: cart, total, status: 'pagado', createdAt: serverTimestamp(), userId: user && !user.isAnonymous ? user.uid : 'anonymous' });
    onComplete(num);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#f5f5f7]/60 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 md:p-14 border border-white">
        <div className="flex justify-between items-center mb-10"><h2 className="text-[34px] font-bold tracking-tight">Caja</h2><button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X /></button></div>
        {!preferenceId ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input className={`w-full bg-[#f5f5f7] rounded-xl p-4 outline-none border transition-colors ${formData.nombre.length > 0 && !isValidNombre ? 'border-red-400' : 'border-transparent'}`} placeholder="Nombre Completo" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
              <input className={`w-full bg-[#f5f5f7] rounded-xl p-4 outline-none border transition-colors ${formData.rut.length > 0 && !isValidRut ? 'border-red-400' : 'border-transparent'}`} placeholder="RUT (ej: 12.345.678-9)" value={formData.rut} onChange={e => setFormData({ ...formData, rut: formatRut(e.target.value) })} maxLength={12} />
              <input className={`w-full bg-[#f5f5f7] rounded-xl p-4 outline-none border transition-colors ${formData.email.length > 0 && !isValidEmail ? 'border-red-400' : 'border-transparent'}`} placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              <input className={`w-full bg-[#f5f5f7] rounded-xl p-4 outline-none border transition-colors ${formData.telefono.length > 5 && !isValidTelefono ? 'border-red-400' : 'border-transparent'}`} placeholder="Teléfono" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />

              <div className="md:col-span-2 grid grid-cols-[2fr_1fr_1fr] gap-4">
                <input className={`w-full bg-[#f5f5f7] rounded-xl p-4 outline-none border transition-colors ${formData.calle.length > 0 && !isValidCalle ? 'border-red-400' : 'border-transparent'}`} placeholder="Calle principal" value={formData.calle} onChange={e => setFormData({ ...formData, calle: e.target.value })} />
                <input className={`w-full bg-[#f5f5f7] rounded-xl p-4 outline-none border transition-colors ${formData.numero.length > 0 && !isValidNumero ? 'border-red-400' : 'border-transparent'}`} placeholder="Número" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} />
                <input className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none border border-transparent" placeholder="Depto (Opcional)" value={formData.depto} onChange={e => setFormData({ ...formData, depto: e.target.value })} />
              </div>

              <div className="relative w-full">
                <select className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none appearance-none cursor-pointer" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value, comuna: '' })}>
                  <option value="" disabled>Selecciona tu Región</option>
                  {regionesYComunas.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
              <div className="relative w-full">
                <select className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" value={formData.comuna} onChange={e => setFormData({ ...formData, comuna: e.target.value })} disabled={!formData.region}>
                  <option value="" disabled>Selecciona tu Comuna</option>
                  {comunasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>

              <textarea
                className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none border border-transparent md:col-span-2 h-24 resize-none text-[15px]"
                placeholder="Instrucciones para el envío (Opcional - Ej: Dejar en conserjería, llamar al llegar...)"
                value={formData.notasEnvio}
                onChange={e => setFormData({ ...formData, notasEnvio: e.target.value })}
              ></textarea>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-start gap-3 mt-4">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">Es importante que la información sea correcta para que no existan problemas en el envío y en la entrega de tu producto.</p>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-medium text-sm text-center">
                {paymentError}
              </div>
            )}

            <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-gray-100">
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A pagar</p><p className="text-[32px] font-extrabold">${total.toLocaleString('es-CL')}</p></div>
              <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                <button
                  onClick={handleNext}
                  disabled={loading || !isFormValid}
                  className={`w-full bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 ${loading || !isFormValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                >
                  {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {loading ? 'Procesando...' : 'Finalizar Compra'}
                </button>
                {formData.rut && formData.rut.length >= 8 && !isValidRut && (
                  <span className="text-red-500 text-[12px] font-medium px-2">RUT inválido. Verifica el número.</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="bg-[#f5f5f7] p-8 rounded-[32px] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <ShieldCheck size={32} className="text-indigo-600" />
                <div>
                  <p className="text-lg font-bold">Pago Seguro</p>
                  <p className="text-xs text-gray-500 font-medium tracking-wide">Cifrado de nivel bancario por Mercado Pago.</p>
                </div>
              </div>
              <button onClick={() => setPreferenceId(null)} className="text-sm font-bold text-gray-500 hover:text-black hover:bg-gray-200 px-4 py-2 rounded-full transition-colors">Modificar datos</button>
            </div>
            <div className="min-h-[200px] flex flex-col justify-center relative">
              <MercadoPagoButton preferenceId={preferenceId} />
              <button onClick={simulateSuccess} className="mt-12 text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em] hover:text-black transition-colors">Simular Éxito (Modo Demo)</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SuccessModal = ({ orderNum, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/60 backdrop-blur-2xl">
    <div className="bg-white rounded-[48px] shadow-2xl p-12 max-w-md w-full text-center border border-white animate-in zoom-in-95">
      <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={48} /></div>
      <h2 className="text-[32px] font-bold text-black mb-3">¡Pedido Exitoso!</h2>
      <p className="text-gray-500 font-medium mb-8">Tu orden está siendo procesada.</p>
      <div className="bg-[#f5f5f7] rounded-3xl p-6 mb-10 border border-gray-100"><span className="text-[11px] font-bold text-gray-400 uppercase block mb-2 tracking-widest">Seguimiento</span><span className="text-2xl font-mono font-bold">#{orderNum}</span></div>
      <button onClick={onClose} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl">Continuar</button>
    </div>
  </div>
);