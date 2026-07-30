// ============================
// global.js — نظام المصادقة الموحد (نسخة مصححة: عميل واحد فقط)
// ============================
const SB_URL  = 'https://wnvyqvwuzmxzzhilgidh.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indudnlxdnd1em14enpoaWxnaWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTg1MDEsImV4cCI6MjA5MTQ5NDUwMX0.AyD4CYqA0cz9mC-bcOt16uUpueL_cAWT26Q92l574r0';

// ✅ عميل Supabase موحّد — يُنشأ مرة وحدة فقط، ويُعاد استخدامه، إلا
// إذا تغيّر التوكن فعلياً (مثلاً بعد تسجيل دخول جديد بنفس الصفحة)
let _cachedClient = null;
let _cachedToken = null;

function getSupabaseClient() {
    const token = localStorage.getItem('auth_token');

    // لو نفس التوكن ولدينا عميل جاهز، أعد استخدامه بدل إنشاء واحد جديد
    if (_cachedClient && _cachedToken === token) {
        return _cachedClient;
    }

    const options = {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storageKey: 'sb-custom-auth'
        }
    };
    if (token) {
        options.global = { headers: { Authorization: `Bearer ${token}` } };
    }

    _cachedClient = supabase.createClient(SB_URL, SB_KEY, options);
    _cachedToken = token;
    return _cachedClient;
}

// ✅ التحقق من الجلسة
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) { logout(); return null; }
    try {
        const res = await fetch(`${SB_URL}/functions/v1/verify-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const result = await res.json();
        if (!result.valid) { logout(); return null; }
        return result.user;
    } catch (err) {
        const phone = localStorage.getItem('user_phone');
        if (!phone) { logout(); return null; }
        return { phone };
    }
}

// ✅ تسجيل الخروج
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('user_phone_display');
    localStorage.removeItem('is_logged_in');
    window.location.href = 'index.html';
}

// ✅ التحقق من ملكية المتجر — يستخدم نفس العميل المخزّن، ما ينشئ عميل ثاني
async function verifyStoreOwnership(storeId, userId) {
    if (!storeId || !userId) return false;
    const sb = getSupabaseClient();
    const { data, error } = await sb
        .from('store_settings')
        .select('user_id')
        .eq('id', storeId)
        .single();
    if (error || !data) return false;
    return data.user_id === userId;
}

// ✅ توست موحّد
function showGlobalToast(message, type = 'info') {
    const existing = document.getElementById('toast-notification');
    if (existing) existing.remove();
    const bg = type === 'success' ? '#24b47e' : type === 'error' ? '#e74c3c' : '#2f3542';
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: ${bg}; color: white; padding: 14px 28px; border-radius: 12px;
        font-size: 14px; font-weight: bold; z-index: 99999; direction: rtl;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: toastIn 0.3s ease;
        text-align: center; min-width: 280px; white-space: nowrap;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

if (!document.getElementById('global-toast-style')) {
    const style = document.createElement('style');
    style.id = 'global-toast-style';
    style.innerHTML = `
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(-20px);} to { opacity:1; transform:translateX(-50%) translateY(0);} }
        @keyframes toastOut { from { opacity:1; transform:translateX(-50%) translateY(0);} to { opacity:0; transform:translateX(-50%) translateY(-20px);} }
    `;
    document.head.appendChild(style);
}