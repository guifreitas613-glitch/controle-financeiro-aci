import React, { useState } from 'react';
import { loginUser, registerUser } from './auth';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        registerUser(email, password)
            .then(() => {
                alert("Cadastro realizado com sucesso! Faça o login para continuar.");
            })
            .catch(err => {
                switch (err.code) {
                    case 'auth/email-already-in-use':
                        setError('Este e-mail já está em uso.');
                        break;
                    case 'auth/weak-password':
                        setError('A senha deve ter pelo menos 6 caracteres.');
                        break;
                    case 'auth/invalid-email':
                        setError('O formato do e-mail é inválido.');
                        break;
                    default:
                        setError('Ocorreu um erro ao tentar se cadastrar.');
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
                <form className="mt-8 space-y-6">
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
                    {error && <p className="text-sm text-center text-danger">{error}</p>}
                    <div className="flex flex-col space-y-4">
                         <button
                            type="button"
                            onClick={handleLogin}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-300 transform hover:scale-105"
                        >
                            Entrar
                        </button>
                         <button
                            type="button"
                            onClick={handleRegister}
                            className="group relative w-full flex justify-center py-3 px-4 border border-primary text-sm font-medium rounded-md text-primary bg-transparent hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-300 transform hover:scale-105"
                        >
                            Cadastrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;