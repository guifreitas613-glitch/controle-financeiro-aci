import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { User, UserRole } from './types';
import { supabase } from './services/supabaseClient';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

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
    session: Session | null;
    loading: boolean;
    permissions: typeof PERMISSIONS[UserRole];
    login: (email: string, password_raw: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    signUp: (params: {email: string, password_raw: string, username: string, role: UserRole}) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- AUTH PROVIDER ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session?.user) {
                await fetchUserProfile(session.user);
            }
            setLoading(false);
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                setSession(session);
                if (session?.user) {
                    await fetchUserProfile(session.user);
                } else {
                    setCurrentUser(null);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', supabaseUser.id)
            .single();

        if (data) {
            setCurrentUser({
                id: supabaseUser.id,
                email: supabaseUser.email,
                username: data.username,
                role: data.role as UserRole,
            });
        } else if (error) {
            console.error('Error fetching user profile:', error);
            // Handle case where profile might not exist yet
            setCurrentUser({
                id: supabaseUser.id,
                email: supabaseUser.email,
                username: supabaseUser.email?.split('@')[0] || 'Usuário',
                role: UserRole.OPERATIONAL, // Default role
            });
        }
    };
    
    const login = async (email: string, password_raw: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: password_raw });
        return { error };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    };
    
    const signUp = async ({email, password_raw, username, role}: {email: string, password_raw: string, username: string, role: UserRole}) => {
         const { error } = await supabase.auth.signUp({
            email,
            password: password_raw,
            options: {
                data: {
                    username: username,
                    role: role,
                }
            }
        });
        return { error };
    };


    const permissions = useMemo(() => {
        return currentUser ? PERMISSIONS[currentUser.role] : PERMISSIONS[UserRole.GUEST];
    }, [currentUser]);

    const value = {
        currentUser,
        session,
        loading,
        permissions,
        login,
        logout,
        signUp,
    };

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
