import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

type AuthContextValue = { user:User|null; loading:boolean; login:(email:string,password:string,role?:string)=>Promise<User>; register:(input:Record<string,string>)=>Promise<User>; logout:()=>Promise<void>; refresh:()=>Promise<void> };
const AuthContext=createContext<AuthContextValue|null>(null);
export function AuthProvider({children}:PropsWithChildren){const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);const refresh=async()=>{try{const r=await api.get('/auth/me');setUser(r.data.user)}catch{setUser(null)}finally{setLoading(false)}};useEffect(()=>{void refresh()},[]);const value=useMemo(()=>({user,loading,refresh,login:async(email:string,password:string,role?:string)=>{const r=await api.post('/auth/login',{email,password,role});setUser(r.data.user);return r.data.user},register:async(input:Record<string,string>)=>{const r=await api.post('/auth/register',input);setUser(r.data.user);return r.data.user},logout:async()=>{await api.post('/auth/logout');setUser(null)}}),[user,loading]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export const useAuth=()=>{const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used inside AuthProvider');return value};
