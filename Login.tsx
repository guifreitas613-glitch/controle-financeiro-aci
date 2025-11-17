import React, { useState } from 'react';
import { useAuth } from './auth';

const Login: React.FC = () => {
    const [email, setEmail] = useState('guilherme.andrei@example.com');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error } = await login(email, password);
        if (error) {
            setError('E-mail ou senha inválidos.');
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 space-y-8 bg-surface rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-text-primary">ACI<span className="text-primary">Capital</span></h1>
                    <p className="mt-2 text-text-secondary">Seu assistente financeiro empresarial</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">E-mail</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-border-color bg-background placeholder-text-secondary text-text-primary rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="E-mail"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="sr-only">Senha</label>
                            <input
                                id="password-input"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-border-color bg-background placeholder-text-secondary text-text-primary rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Senha"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-center text-danger">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {loading ? 'Entrando...' : 'Entrar no Sistema'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
