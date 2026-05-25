import React, { useState, useEffect } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, db, doc, setDoc, getDoc, signOut, serverTimestamp, handleFirestoreError, OperationType } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const AtlasLogo = ({ className = "" }: { className?: string }) => {
    const [name, setName] = useState('Atlas');

    useEffect(() => {
        const stored = localStorage.getItem('assistantCustomName');
        if (stored) setName(stored);
    }, []);

    return (
        <div className={`text-5xl font-extrabold leading-tight text-center ${className}`}>
            <span className="text-[var(--text-primary)]">{name}</span><span className="text-[var(--accent-primary)]">IA</span>
        </div>
    );
};

const BrandingSection = () => (
    <div className="bg-slate-950/40 backdrop-blur-md p-6 lg:p-8 flex flex-col justify-center items-center text-center md:w-[40%] lg:w-[35%] min-h-[40vh] md:min-h-screen border-b md:border-b-0 md:border-r border-blue-500/20 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center justify-center h-full space-y-8">
            <div className="animate-in fade-in slide-in-from-left duration-700">
                <AtlasLogo className="mb-4 text-5xl md:text-6xl lg:text-7xl tracking-tighter" />
                <p className="text-blue-100/80 text-lg md:text-xl font-medium leading-relaxed max-w-xs mx-auto">
                    Vê o que você vê e te guia passo a passo.
                </p>
            </div>

            <div className="w-full bg-gradient-to-br from-blue-600/20 to-indigo-900/40 p-6 rounded-2xl border border-blue-500/30 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-1000 delay-300">
                <p className="text-sm md:text-base text-blue-50 mb-5 leading-relaxed">
                    A cada indicação do ATLAS IA, o parceiro autorizado ganha <span className="text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">até R$ 218,71 de comissão</span>.
                </p>
                <a
                    href="https://dashboard.kiwify.com/join/affiliate/fqEvvbDM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                >
                    Torne-se um parceiro
                </a>
            </div>
        </div>
    </div>
);

const Auth = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        
        setLoading(true);
        setError('');

        const fixedPassword = 'password_assistente_2024'; // Fixed password for email-only login

        try {
            // Try to sign in
            try {
                await signInWithEmailAndPassword(auth, email, fixedPassword);
            } catch (signInErr: any) {
                console.log("Sign in error code:", signInErr.code);
                
                // If user doesn't exist, try to create them
                // Note: 'auth/invalid-credential' is often returned instead of 'auth/user-not-found' for security
                if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
                    try {
                        const userCredential = await createUserWithEmailAndPassword(auth, email, fixedPassword);
                        const user = userCredential.user;
                        
                        // Initialize profile
                        const userPath = `users/${user.uid}`;
                        try {
                            await setDoc(doc(db, "users", user.uid), {
                                uid: user.uid,
                                email: user.email,
                                name: email.split('@')[0],
                                userPreferredName: user.email,
                                subscriptionStatus: 'active',
                                createdAt: serverTimestamp(),
                                theme: 'dark',
                                role: 'user',
                                usage: {
                                    totalTokens: 0,
                                    totalCost: 0,
                                    remainingTokens: 1000000,
                                },
                            });
                        } catch (fsErr) {
                            handleFirestoreError(fsErr, OperationType.WRITE, userPath);
                        }
                    } catch (createErr: any) {
                        if (createErr.code === 'auth/email-already-in-use') {
                            setError('Este email já está em uso. Tente entrar com Google ou verifique se já possui uma conta.');
                        } else {
                            throw createErr;
                        }
                    }
                } else if (signInErr.code === 'auth/wrong-password') {
                    setError('Senha incorreta para este email. Se você criou a conta com Google, use o botão "Entrar com Google".');
                } else {
                    throw signInErr;
                }
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            if (err.code === 'auth/operation-not-allowed') {
                setError('O login por email não está ativado. Ative o provedor de Email/Senha no console do Firebase.');
            } else {
                setError(`Erro ao acessar o sistema: ${err.message || 'Verifique seu email.'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        
        const maxRetries = 2;
        let attempt = 0;
        
        const tryLogin = async (): Promise<void> => {
            try {
                console.log("Attempting Google login...");
                const result = await signInWithPopup(auth, provider);
                console.log("Google login result:", result);
                const user = result.user;
                console.log("User logged in:", user.email);
                
                // Check authorization
                /* REMOVED AUTHORIZED EMAILS CHECK AS REQUESTED
                const isDefaultAdmin = user.email === "davisilva8773@gmail.com" || user.email === "gabrieloliveirasantos941@gmail.com" || user.email === "iaatlas31@gmail.com";
                let emailDoc;
                try {
                    console.log("Checking authorization for:", user.email);
                    emailDoc = await getDoc(doc(db, "authorized_emails", user.email!));
                    console.log("Authorization doc exists:", emailDoc.exists());
                } catch (err) {
                    handleFirestoreError(err, OperationType.GET, `authorized_emails/${user.email}`);
                    throw err;
                }
                
                if (!isDefaultAdmin && (!emailDoc.exists() || emailDoc.data().status === 'blocked')) {
                    console.log("User not authorized, signing out.");
                    await signOut(auth);
                    setError("Acesso não autorizado. Solicite liberação ao administrador.");
                    setLoading(false);
                    return;
                }
                */
                
                console.log("User initialized, initializing profile...");
                // Initialize profile if it doesn't exist
                const userPath = `users/${user.uid}`;
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (!userDoc.exists()) {
                        console.log("Creating user profile...");
                        await setDoc(doc(db, "users", user.uid), {
                            uid: user.uid,
                            email: user.email,
                            name: user.displayName || user.email?.split('@')[0] || 'Usuário',
                            userPreferredName: user.displayName || user.email,
                            subscriptionStatus: 'active',
                            createdAt: serverTimestamp(),
                            theme: 'dark',
                            role: 'user',
                            usage: {
                                totalTokens: 0,
                                totalCost: 0,
                                remainingTokens: 1000000,
                            },
                        });
                        console.log("User profile created.");
                    }
                } catch (fsErr) {
                    handleFirestoreError(fsErr, OperationType.WRITE, userPath);
                }
            } catch (err: any) {
                console.error(`Google Auth attempt ${attempt + 1} failed:`, err);
                if (err.code === 'auth/network-request-failed' && attempt < maxRetries) {
                    attempt++;
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    return tryLogin();
                }
                throw err;
            }
        };

        try {
            await tryLogin();
        } catch (err: any) {
            console.error("Google Auth final error:", err);
            setError(`Erro ao entrar com Google: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-transparent text-white relative overflow-hidden">
            {/* Background stars/glow effect */}
            <div className="absolute inset-0 bg-black -z-20"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] -z-10"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] -z-10"></div>

            <BrandingSection />

            <div className="md:flex-1 flex items-center justify-center p-6 md:p-12 bg-transparent">
                <div className="w-full max-w-[637px] bg-slate-900/60 p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom duration-700">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center text-white tracking-tight">Bem-vindo</h2>
                    <p className="text-blue-100/60 text-center mb-10 text-sm md:text-base">Digite seu email para entrar no ATLAS IA</p>
                    
                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 text-sm border border-red-500/20 text-center animate-shake">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-blue-100/50 text-xs font-bold mb-2 ml-1 uppercase tracking-widest" htmlFor="email">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-lg"
                                required
                                disabled={loading}
                            />
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl focus:outline-none shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-base"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                    <span>Entrando...</span>
                                </>
                            ) : (
                                <span>Entrar com Email</span>
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#1e293b] text-gray-500 uppercase tracking-wider">Ou</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-xl focus:outline-none focus:shadow-outline shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-sm"
                        disabled={loading}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>Entrar com Google</span>
                    </button>
                    
                    {/* Terms message removed as requested */}
                </div>
            </div>
        </div>
    );
};

export default Auth;
