import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, X, Plus, Minus, CreditCard, Truck, ShieldCheck, 
  ArrowRight, Lock, Package, DollarSign, Trash2, Zap, Star, 
  CheckCircle2, AlertCircle, ChevronRight, Search, Mail, Phone, 
  MapPin, Globe, ArrowLeft, LogIn, LogOut, LayoutGrid, Clock, 
  PlusCircle, ListFilter, BarChart3, Settings, Trash, User, UserPlus
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
  where, limit, onSnapshot 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyA2mD9a4aWBnBa3we7Cx7jWJpB6jzrUcII",
  authDomain: "pimstore.firebaseapp.com",
  projectId: "pimstore",
  storageBucket: "pimstore.firebasestorage.app",
  messagingSenderId: "155266458339",
  appId: "1:155266458339:web:4734100dbcbe852cbb1bd6"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const functions = getFunctions(firebaseApp);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pimstore-prod';

// --- HELPERS Y UTILIDADES ---
const validateRut = (rut) => {
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (cleanRut.length < 8) return false;
    const num = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    let s = 0, m = 2;
    for(let i=num.length-1; i>=0; i--) {
        s += parseInt(num[i]) * m;
        m = m === 7 ? 2 : m + 1;
    }
    const res = 11 - (s % 11);
    const dvr = res === 11 ? '0' : res === 10 ? 'K' : String(res);
    return dvr === dv;
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
  // Estados de Navegación y UI
  const [view, setView] = useState('home'); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  
  // Estados de Datos
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]); // Para admin
  const [loading, setLoading] = useState(true);
  
  // Estados Admin
  const [adminTab, setAdminTab] = useState('dashboard');
  const [newProd, setNewProd] = useState({ title: '', price: '', category: '', image: '', description: '', stock: 0, dropiSku: '' });

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
  }, []);

  // -- LOGICA DEL CARRITO --
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? {...i, quantity: i.quantity + 1} : i);
      return [...prev, {...product, quantity: 1}];
    });
    setIsCartOpen(true);
    setSelectedProduct(null);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

  // -- LOGICA ADMIN --
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
        ...newProd,
        price: Number(newProd.price),
        stock: Number(newProd.stock),
        createdAt: serverTimestamp()
      });
      setNewProd({ title: '', price: '', category: '', image: '', description: '', stock: 0, dropiSku: '' });
      alert("Producto agregado correctamente");
    } catch (err) { alert("Error al guardar producto"); }
  };

  const deleteProduct = async (id) => {
    if(confirm("¿Estás seguro de eliminar este producto?")) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
    }
  };

  // Cargar órdenes solo si se abre el panel admin
  useEffect(() => {
    if (isAdminOpen && user && !user.isAnonymous) {
        const qOrders = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(qOrders, (snap) => {
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }
  }, [isAdminOpen, user]);


  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans text-black overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-[#f5f5f7]/80 backdrop-blur-md z-[60] border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div onClick={() => setView('home')} className="flex items-center gap-2 cursor-pointer group">
              <div className="bg-black text-white p-1 rounded-md group-hover:bg-indigo-600 transition-colors">
                <Zap size={16} fill="currentColor"/>
              </div>
              <span className="text-[17px] font-bold tracking-tight">PiMStore</span>
            </div>
            <div className="hidden md:flex gap-6 text-[12px] font-medium text-gray-500">
              <button onClick={() => setView('home')} className={`hover:text-black transition-colors ${view === 'home' ? 'text-black font-bold' : ''}`}>Tienda</button>
              <button onClick={() => setView('news')} className={`hover:text-black transition-colors ${view === 'news' ? 'text-black font-bold' : ''}`}>Novedades</button>
              <button onClick={() => setView('tracking')} className={`hover:text-black transition-colors ${view === 'tracking' ? 'text-black font-bold' : ''}`}>Seguimiento</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => user && !user.isAnonymous ? alert(`Hola ${user.displayName || user.email}`) : setIsAuthModalOpen(true)} className="hover:text-black text-gray-500 transition-colors">
               {user && !user.isAnonymous ? <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">{user.email[0].toUpperCase()}</div> : <User size={20} />}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-all">
              <ShoppingCart size={18} strokeWidth={2} />
              {cart.length > 0 && <span className="absolute top-0 right-0 h-4 w-4 bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full text-white ring-2 ring-[#f5f5f7]">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* RENDERIZADO DE VISTAS */}
      
      {/* VISTA HOME */}
      {view === 'home' && (
        <>
          <header className="pt-40 pb-20 px-6 max-w-6xl mx-auto text-center">
            <h1 className="text-[48px] md:text-[80px] font-bold tracking-tight leading-[1.05] mb-6 animate-in slide-in-from-top-4 duration-1000">
              Lo inusual, <br/> <span className="text-gray-400">bien pensado.</span>
            </h1>
            <p className="text-[19px] md:text-[24px] text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Descubre gadgets que transforman lo cotidiano.
            </p>
          </header>

          <main className="max-w-6xl mx-auto px-6 pb-40">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? [1,2,3].map(i => <div key={i} className="h-[450px] bg-white rounded-[32px] animate-pulse" />) : 
               products.map(p => (
                 <div key={p.id} onClick={() => setSelectedProduct(p)} className="group bg-white rounded-[32px] p-6 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 flex flex-col h-full border border-transparent hover:border-gray-100">
                    <div className="relative aspect-square mb-6 overflow-hidden rounded-[24px] bg-[#f5f5f7]">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"/>
                      {p.stock <= 0 && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center"><span className="bg-black text-white px-4 py-1 rounded-full text-xs font-bold">Agotado</span></div>}
                    </div>
                    <div className="flex-grow px-2">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{p.category}</span>
                      <h3 className="text-[20px] font-semibold text-black mt-2 leading-tight tracking-tight">{p.title}</h3>
                      <p className="text-[22px] font-bold tracking-tight mt-4">${p.price.toLocaleString('es-CL')}</p>
                    </div>
                 </div>
               ))}
            </div>
          </main>
        </>
      )}

      {/* VISTAS INFORMATIVAS */}
      {view === 'news' && (
        <PageWrapper title="Novedades" onBack={() => setView('home')}>
            <div className="grid gap-8">
                {[1,2].map(i => (
                    <div key={i} className="bg-white p-10 rounded-[40px] flex flex-col md:flex-row gap-8 items-center shadow-sm border border-gray-100">
                        <div className="h-64 w-full md:w-1/3 bg-[#f5f5f7] rounded-3xl animate-pulse"></div>
                        <div className="flex-1">
                            <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Lanzamiento</span>
                            <h3 className="text-2xl font-bold mt-2 mb-4">Nueva Colección Smart Home</h3>
                            <p className="text-gray-500">Estamos preparando una serie de productos que conectarán tu hogar como nunca antes. Espéralo muy pronto.</p>
                        </div>
                    </div>
                ))}
            </div>
        </PageWrapper>
      )}

      {view === 'returns' && (
        <PageWrapper title="Devoluciones" onBack={() => setView('home')}>
            <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 prose prose-lg max-w-none">
                <h3 className="text-2xl font-bold mb-4">Garantía de Satisfacción</h3>
                <p>En PiMStore, queremos que ames tu tecnología. Si no es así, tienes 30 días para devolverlo.</p>
                <div className="grid md:grid-cols-3 gap-6 my-10">
                    <div className="p-6 bg-[#f5f5f7] rounded-3xl"><CheckCircle2 className="mb-4 text-green-500"/><h4 className="font-bold">30 Días</h4><p className="text-sm text-gray-500">Para cambios o devoluciones desde la recepción.</p></div>
                    <div className="p-6 bg-[#f5f5f7] rounded-3xl"><Package className="mb-4 text-indigo-500"/><h4 className="font-bold">Empaque Original</h4><p className="text-sm text-gray-500">El producto debe estar sellado y sin uso.</p></div>
                    <div className="p-6 bg-[#f5f5f7] rounded-3xl"><Truck className="mb-4 text-blue-500"/><h4 className="font-bold">Retiro Gratuito</h4><p className="text-sm text-gray-500">Si es falla técnica, nosotros pagamos el envío.</p></div>
                </div>
                <p>Escríbenos a <strong>soporte@pimstore.cl</strong> con tu número de orden para comenzar.</p>
            </div>
        </PageWrapper>
      )}

      {view === 'tracking' && (
        <PageWrapper title="Sigue tu orden" onBack={() => setView('home')}>
            <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 max-w-2xl mx-auto text-center">
                <p className="text-gray-500 mb-8 font-medium">Ingresa el ID de orden que recibiste en tu correo.</p>
                <div className="flex gap-4">
                    <input className="w-full bg-[#f5f5f7] p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black" placeholder="Ej: 20240218-4829" value={trackId} onChange={e=>setTrackId(e.target.value)} />
                    <button onClick={async () => {
                        setTrackResult('loading');
                        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), where("orderNumber", "==", trackId), limit(1));
                        const s = await getDocs(q);
                        setTrackResult(s.empty ? 'not_found' : s.docs[0].data());
                    }} className="bg-black text-white px-8 rounded-2xl font-bold hover:bg-gray-800 transition-colors">Buscar</button>
                </div>
                {trackResult === 'not_found' && <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl font-bold">Orden no encontrada</div>}
                {typeof trackResult === 'object' && (
                    <div className="mt-8 p-8 bg-indigo-50 rounded-[32px] text-left flex justify-between items-center animate-in zoom-in-95">
                        <div><p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Estado</p><h3 className="text-3xl font-black text-indigo-600 capitalize">{trackResult.status}</h3></div>
                        <Package size={48} className="text-indigo-200" />
                    </div>
                )}
            </div>
        </PageWrapper>
      )}

      {view === 'support' && (
        <PageWrapper title="Soporte" onBack={() => setView('home')}>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold mb-6">Contacto Directo</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4"><div className="bg-[#f5f5f7] p-3 rounded-xl"><Mail className="text-indigo-600"/></div><div><p className="text-xs font-bold text-gray-400 uppercase">Email</p><p className="font-bold">soporte@pimstore.cl</p></div></div>
                        <div className="flex items-center gap-4"><div className="bg-[#f5f5f7] p-3 rounded-xl"><Phone className="text-indigo-600"/></div><div><p className="text-xs font-bold text-gray-400 uppercase">WhatsApp</p><p className="font-bold">+56 9 7523 2353</p></div></div>
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-center text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><Clock size={32} className="text-gray-400"/></div>
                    <h4 className="text-xl font-bold mb-2">Horario de Atención</h4>
                    <p className="text-gray-500">Lunes a Viernes<br/>09:00 - 18:00 hrs</p>
                </div>
            </div>
        </PageWrapper>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 pt-20 pb-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-[12px] font-medium text-gray-500">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-black font-bold text-[17px] mb-4"><Zap size={18} fill="black" /> PiMStore</div>
            <p className="max-w-sm leading-relaxed">Diseño minimalista, tecnología excepcional.</p>
          </div>
          <div className="space-y-3">
             <p className="text-black font-bold uppercase tracking-widest text-[10px] mb-4">Cliente</p>
             <button onClick={() => setView('tracking')} className="block hover:text-black">Seguimiento</button>
             <button onClick={() => setView('returns')} className="block hover:text-black">Devoluciones</button>
             <button onClick={() => setView('support')} className="block hover:text-black">Soporte</button>
          </div>
          <div className="space-y-3">
             <p className="text-black font-bold uppercase tracking-widest text-[10px] mb-4">Empresa</p>
             <button onClick={() => setView('about')} className="block hover:text-black">Sobre Nosotros</button>
             <button onClick={() => setIsAdminOpen(true)} className="block hover:text-black flex items-center gap-2"><Lock size={12}/> Staff Panel</button>
          </div>
        </div>
      </footer>

      {/* MODAL AUTH CLIENTES */}
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} auth={auth} />
      )}

      {/* MODAL DETALLE PRODUCTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xl" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white rounded-[48px] w-full max-w-5xl h-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-100">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 z-10 bg-gray-100 p-2 rounded-full hover:bg-black hover:text-white transition-all"><X size={24}/></button>
            <div className="md:w-3/5 bg-[#f5f5f7] flex items-center justify-center p-12"><img src={selectedProduct.image} className="w-full h-full object-contain" /></div>
            <div className="md:w-2/5 p-10 md:p-16 flex flex-col overflow-y-auto">
                <span className="text-[12px] font-bold text-indigo-500 uppercase mb-4 tracking-widest">{selectedProduct.category}</span>
                <h2 className="text-[36px] font-bold leading-tight mb-4">{selectedProduct.title}</h2>
                <p className="text-[28px] font-bold mb-8">${selectedProduct.price.toLocaleString('es-CL')}</p>
                <div className="space-y-6 flex-grow"><p className="text-[17px] text-gray-600 leading-relaxed">{selectedProduct.description}</p></div>
                <button onClick={() => addToCart(selectedProduct)} className="w-full bg-black text-white py-5 rounded-full font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl">Añadir a la bolsa</button>
            </div>
          </div>
        </div>
      )}

      {/* CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-3xl shadow-2xl h-full p-10 flex flex-col animate-in slide-in-from-right duration-500">
             <div className="flex justify-between items-center mb-10"><h2 className="text-[32px] font-bold tracking-tight">Bolsa</h2><button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={28}/></button></div>
             <div className="flex-grow overflow-y-auto space-y-8">
                {cart.length === 0 ? <p className="text-center text-gray-400 font-medium py-20">Tu bolsa está vacía.</p> : cart.map(item => (
                  <div key={item.id} className="flex gap-6 group">
                    <div className="w-24 h-24 bg-[#f5f5f7] rounded-[24px] overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 py-1">
                      <div className="flex justify-between font-bold"><h4>{item.title}</h4><button onClick={() => removeFromCart(item.id)}><Trash size={16} className="text-gray-300 hover:text-red-500"/></button></div>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm"><button onClick={() => updateQuantity(item.id, -1)}><Minus size={14}/></button><span className="w-4 text-center">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)}><Plus size={14}/></button></div>
                        <p className="font-bold text-indigo-600 ml-auto">${(item.price * item.quantity).toLocaleString('es-CL')}</p>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
             {cart.length > 0 && (
               <div className="pt-10 mt-6 border-t border-gray-100">
                  <div className="flex justify-between mb-8 items-end"><span className="text-gray-500">Subtotal</span><span className="font-bold text-[28px]">${cartTotal.toLocaleString('es-CL')}</span></div>
                  <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-black text-white py-5 rounded-[20px] font-bold hover:bg-indigo-600 transition-all shadow-xl">Comprar</button>
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
      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} user={user} auth={auth} products={products} orders={orders} newProd={newProd} setNewProd={setNewProd} handleAddProduct={handleAddProduct} deleteProduct={deleteProduct} tab={adminTab} setTab={setAdminTab} />}

    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

const AuthModal = ({ onClose, auth }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    const handleGoogle = async () => {
        try { await signInWithPopup(auth, new GoogleAuthProvider()); onClose(); } catch (e) { setError(e.message); }
    };

    const handleEmail = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, pass);
            } else {
                if (!validateEmail(email)) throw new Error("Email inválido");
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                await sendEmailVerification(cred.user);
                alert("Cuenta creada. Revisa tu correo para verificar.");
            }
            onClose();
        } catch (err) { setError(err.message); }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] p-10 w-full max-w-md shadow-2xl relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white"><X size={20}/></button>
                <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
                <button onClick={handleGoogle} className="w-full bg-white border border-gray-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 mb-6"><Globe size={18}/> Continuar con Google</button>
                <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O con correo</span></div></div>
                <form onSubmit={handleEmail} className="space-y-4">
                    <input className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                    <input className="w-full bg-[#f5f5f7] p-4 rounded-xl outline-none" type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} />
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    <button className="w-full bg-black text-white py-4 rounded-xl font-bold">{isLogin ? 'Entrar' : 'Registrarse'}</button>
                </form>
                <p className="text-center mt-6 text-sm text-gray-500 cursor-pointer hover:text-black" onClick={()=>setIsLogin(!isLogin)}>{isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}</p>
            </div>
        </div>
    );
};

const AdminPanel = ({ onClose, user, auth, products, orders, newProd, setNewProd, handleAddProduct, deleteProduct, tab, setTab }) => {
    const handleLogin = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e){} };
    
    if (!user || user.isAnonymous) {
        return (
            <div className="fixed inset-0 z-[200] bg-[#f5f5f7] flex items-center justify-center p-6">
                <div className="bg-white p-12 rounded-[40px] shadow-sm max-w-md w-full text-center">
                    <Lock size={48} className="mx-auto mb-6 text-gray-300"/>
                    <h3 className="text-2xl font-bold mb-4">Acceso Staff</h3>
                    <p className="text-gray-500 mb-8">Área restringida para administradores.</p>
                    <button onClick={handleLogin} className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"><Globe size={18}/> Acceso con Google</button>
                    <button onClick={onClose} className="mt-4 text-gray-400 text-sm hover:text-black">Volver a la tienda</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] bg-[#f5f5f7] flex flex-col animate-in slide-in-from-bottom duration-500">
            <div className="bg-white px-8 h-16 flex justify-between items-center border-b border-gray-200 sticky top-0">
                <div className="flex items-center gap-8">
                    <div className="font-bold flex items-center gap-2"><Lock size={18}/> Staff Central</div>
                    <div className="hidden md:flex gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'text-black' : ''}>Resumen</button>
                        <button onClick={() => setTab('inventory')} className={tab === 'inventory' ? 'text-black' : ''}>Inventario</button>
                        <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'text-black' : ''}>Pedidos</button>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 max-w-7xl mx-auto w-full">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex gap-4 items-center"><div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">{user.email[0].toUpperCase()}</div><div><p className="text-xs font-bold text-gray-400 uppercase">Sesión activa</p><p className="font-bold">{user.email}</p></div></div>
                    <button onClick={() => signOut(auth)} className="text-red-500 font-bold bg-red-50 px-6 py-2 rounded-xl text-sm">Cerrar Sesión</button>
                </div>
                
                {tab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100"><Package className="text-indigo-600 mb-2"/><h4 className="text-4xl font-bold">{products.length}</h4><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Productos</p></div>
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100"><Clock className="text-indigo-600 mb-2"/><h4 className="text-4xl font-bold">{orders.length}</h4><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pedidos</p></div>
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100"><DollarSign className="text-indigo-600 mb-2"/><h4 className="text-4xl font-bold">${orders.reduce((s,o)=>s+(o.total||0),0).toLocaleString('es-CL')}</h4><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ventas</p></div>
                    </div>
                )}

                {tab === 'inventory' && (
                    <div className="space-y-10">
                        <div className="bg-white p-10 rounded-[32px] border border-gray-100">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><PlusCircle size={20}/> Nuevo Item</h3>
                            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <input placeholder="Título" value={newProd.title} onChange={e=>setNewProd({...newProd, title: e.target.value})} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                                <input placeholder="Precio" type="number" value={newProd.price} onChange={e=>setNewProd({...newProd, price: e.target.value})} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                                <input placeholder="Categoría" value={newProd.category} onChange={e=>setNewProd({...newProd, category: e.target.value})} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                                <input placeholder="URL Imagen" value={newProd.image} onChange={e=>setNewProd({...newProd, image: e.target.value})} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                                <input placeholder="Stock" type="number" value={newProd.stock} onChange={e=>setNewProd({...newProd, stock: e.target.value})} className="bg-[#f5f5f7] p-4 rounded-xl outline-none" required />
                                <input placeholder="SKU Dropi" value={newProd.dropiSku} onChange={e=>setNewProd({...newProd, dropiSku: e.target.value})} className="bg-indigo-50/50 p-4 rounded-xl outline-none border border-indigo-100" />
                                <textarea placeholder="Descripción" value={newProd.description} onChange={e=>setNewProd({...newProd, description: e.target.value})} className="bg-[#f5f5f7] p-4 rounded-xl outline-none md:col-span-3 h-24" required />
                                <button className="md:col-span-3 bg-black text-white py-4 rounded-xl font-bold">Publicar</button>
                            </form>
                        </div>
                        <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden">
                            <table className="w-full text-left"><thead className="bg-[#f5f5f7] text-[10px] font-bold text-gray-400 uppercase"><tr><th className="p-6">Producto</th><th className="p-6">Stock</th><th className="p-6">Precio</th><th className="p-6 text-center">Acción</th></tr></thead>
                            <tbody className="divide-y divide-gray-50">{products.map(p=>(<tr key={p.id}><td className="p-6 flex items-center gap-4"><img src={p.image} className="w-10 h-10 rounded-lg object-cover"/>{p.title}</td><td className="p-6">{p.stock}</td><td className="p-6">${p.price.toLocaleString('es-CL')}</td><td className="p-6 text-center"><button onClick={()=>deleteProduct(p.id)} className="text-gray-300 hover:text-red-500"><Trash size={16}/></button></td></tr>))}</tbody></table>
                        </div>
                    </div>
                )}

                {tab === 'orders' && (
                    <div className="space-y-6">
                        {orders.length === 0 ? <p className="text-center text-gray-400 py-20">Sin pedidos.</p> : orders.map(o => (
                            <div key={o.id} className="bg-white p-8 rounded-[32px] border border-gray-100 flex justify-between items-center shadow-sm">
                                <div>
                                    <div className="flex items-center gap-3"><span className="bg-green-50 text-green-600 text-[9px] font-bold px-2 py-1 rounded-md uppercase">Pagado</span><span className="font-mono text-lg font-bold">#{o.orderNumber}</span></div>
                                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">{o.createdAt?.toDate().toLocaleDateString()}</p>
                                    <p className="mt-2 font-bold text-sm">{o.customer?.nombre}</p>
                                </div>
                                <div className="text-right"><span className="text-2xl font-black">${o.total?.toLocaleString('es-CL')}</span><p className="text-[10px] text-gray-400 font-bold uppercase">{o.items?.length} items</p></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CheckoutModal = ({ onClose, cart, total, onComplete, user }) => {
  const [formData, setFormData] = useState({ nombre: '', rut: '', email: user && !user.isAnonymous ? user.email : '', telefono: '+569 ', direccion: '', comuna: 'Santiago' });
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!validateRut(formData.rut)) return alert("RUT Inválido");
    setLoading(true);
    try {
      const crearPago = httpsCallable(functions, 'crearPreferenciaPago');
      const res = await crearPago({ items: cart, customer: formData });
      if (res.data?.preferenceId) setPreferenceId(res.data.preferenceId);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const simulateSuccess = async () => {
    const num = generateNumericOrder();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { orderNumber: num, customer: formData, items: cart, total, status: 'pagado', createdAt: serverTimestamp() });
    onComplete(num);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#f5f5f7]/60 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 md:p-14 border border-white">
        <div className="flex justify-between items-center mb-10"><h2 className="text-[34px] font-bold tracking-tight">Caja</h2><button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X/></button></div>
        {!preferenceId ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <input className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none" placeholder="Nombre Completo" value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} />
               <input className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none" placeholder="RUT (ej: 12345678-9)" value={formData.rut} onChange={e=>setFormData({...formData, rut: e.target.value})} />
               <input className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none" placeholder="Email" type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
               <input className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none" placeholder="Teléfono" value={formData.telefono} onChange={e=>setFormData({...formData, telefono: e.target.value})} />
               <input className="w-full bg-[#f5f5f7] rounded-xl p-4 outline-none md:col-span-2" placeholder="Dirección de envío" value={formData.direccion} onChange={e=>setFormData({...formData, direccion: e.target.value})} />
            </div>
            <div className="pt-10 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-gray-100">
               <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A pagar</p><p className="text-[32px] font-extrabold">${total.toLocaleString('es-CL')}</p></div>
               <button onClick={handleNext} disabled={loading} className="w-full sm:w-auto bg-black text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl">{loading ? 'Procesando...' : 'Ir al pago'}</button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
             <div className="bg-[#f5f5f7] p-8 rounded-[32px] flex items-center gap-6"><ShieldCheck size={32} className="text-indigo-600" /><div><p className="text-lg font-bold">Pago Seguro</p><p className="text-xs text-gray-500 font-medium tracking-wide">Cifrado de nivel bancario por Mercado Pago.</p></div></div>
             <div className="min-h-[200px] flex flex-col justify-center">
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
      <button onClick={onClose} className="w-full bg-black text-white py-5 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl">Continuar</button>
    </div>
  </div>
);