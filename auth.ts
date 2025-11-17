import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { User, UserRole } from './types';

// --- PERMISSIONS ---
export const PERMISSIONS: Record<UserRole, {
    canViewDashboard: boolean;
    canViewTransactions: boolean;
    canEditTransactions: boolean;
    canViewReports: boolean;
    canViewGoals: boolean;
    canEditGoals: boolean;
    canViewSettings: boolean;
    canManageSettings: boolean;
    canManageUsers: boolean;
}> = {
    [UserRole.ADMIN]: {
        canViewDashboard: true,
        canViewTransactions: true,
        canEditTransactions: true,
        canViewReports: true,
        canViewGoals: true,
        canEditGoals: true,
        canViewSettings: true,
        canManageSettings: true,
        canManageUsers: true,
    },
    [UserRole.MANAGER]: {
        canViewDashboard: true,
        canViewTransactions: true,
        canEditTransactions: true,
        canViewReports: true,
        canViewGoals: true,
        canEditGoals: true,
        canViewSettings: true,
        canManageSettings: true,
        canManageUsers: false,
    },
    [UserRole.OPERATIONAL]: {
        canViewDashboard: true,
        canViewTransactions: true,
        canEditTransactions: true,
        canViewReports: false,
        canViewGoals: false,
        canEditGoals: false,
        canViewSettings: false,
        canManageSettings: false,
        canManageUsers: false,
    },
    [UserRole.GUEST]: {
        canViewDashboard: true,
        canViewTransactions: true,
        canEditTransactions: false,
        canViewReports: true,
        canViewGoals: true,
        canEditGoals: false,
        canViewSettings: false,
        canManageSettings: false,
        canManageUsers: false,
    },
};

// --- AUTH CONTEXT ---
interface AuthContextType {
    currentUser: User | null;
    users: User[];
    permissions: typeof PERMISSIONS[UserRole];
    login: (username: string, password_raw: string) => boolean;
    logout: () => void;
    addUser: (user: Omit<User, 'id'>) => boolean;
    deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdmin: User = {
    id: 'admin-default',
    username: 'guilherme.andrei',
    password: '1234', // In a real app, this should be a hash
    role: UserRole.ADMIN,
};

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}


// --- AUTH PROVIDER ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    
    // Initialize default admin if no users exist
    useEffect(() => {
        if (users.length === 0) {
            setUsers([defaultAdmin]);
        }
    }, [users, setUsers]);

    const login = (username: string, password_raw: string): boolean => {
        const user = users.find(u => u.username === username && u.password === password_raw);
        if (user) {
            const { password, ...userToStore } = user; // Don't store password in currentUser
            setCurrentUser(userToStore);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const addUser = (user: Omit<User, 'id'>): boolean => {
        if (users.some(u => u.username === user.username)) {
            alert('Um usuário com este nome de login já existe.');
            return false;
        }
        const newUser: User = { ...user, id: crypto.randomUUID() };
        setUsers(prev => [...prev, newUser]);
        return true;
    };

    const deleteUser = (userId: string) => {
        if (userId === currentUser?.id) {
            alert('Você não pode excluir a si mesmo.');
            return;
        }
        if (userId === defaultAdmin.id) {
            alert('O administrador padrão não pode ser excluído.');
            return;
        }
        if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
            setUsers(prev => prev.filter(u => u.id !== userId));
        }
    };

    const permissions = useMemo(() => {
        return currentUser ? PERMISSIONS[currentUser.role] : PERMISSIONS[UserRole.GUEST];
    }, [currentUser]);

    const value = {
        currentUser,
        users,
        permissions,
        login,
        logout,
        addUser,
        deleteUser,
    };

    // FIX: Replaced JSX with React.createElement to resolve parsing error in .ts file.
    return React.createElement(AuthContext.Provider, { value: value }, children);
};


// --- AUTH HOOK ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};