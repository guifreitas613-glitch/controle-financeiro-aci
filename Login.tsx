
import React, { useState } from 'react';
import { loginUser, resetUserPassword } from './auth';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        loginUser(email, password)
            .catch(err => {
                 switch (err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        setError('E-mail ou senha inválidos.');
                        break;
                    case 'auth/invalid-email':
                        setError('O formato do e-mail é inválido.');
                        break;
                    default:
                        setError('Ocorreu um erro ao tentar fazer login.');
                        break;
                }
            });
    };

    const handleForgotPassword = () => {
        if (!email) {
            setError('Por favor, digite seu e-mail para redefinir a senha.');
            return;
        }
        setError('');
        setMessage('');
        
        resetUserPassword(email)
            .then(() => {
                setMessage('Um link para redefinição de senha foi enviado para o seu e-mail.');
            })
            .catch(err => {
                switch (err.code) {
                    case 'auth/user-not-found':
                        setError('Usuário não encontrado.');
                        break;
                    case 'auth/invalid-email':
                        setError('O formato do e-mail é inválido.');
                        break;
                    default:
                        setError('Erro ao enviar e-mail de redefinição.');
                        break;
                }
            });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md p-8 space-y-8 bg-surface rounded-xl shadow-lg animate-fade-in">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-text-primary">ACI<span className="text-primary">Capital</span></h1>
                    <p className="mt-2 text-text-secondary">Seu assistente financeiro empresarial</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">E-mail</label>
                            <input
                                id="email"
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

                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            Esqueci a senha
                        </button>
                    </div>

                    {error && <p className="text-sm text-center text-danger">{error}</p>}
                    {message && <p className="text-sm text-center text-green-400">{message}</p>}

                    <div className="flex flex-col space-y-4">
                         <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-300 transform hover:scale-105"
                        >
                            Entrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;