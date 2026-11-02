import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import { Login, Register } from './pages/Auth';
import Sell from './pages/Sell';
import ProductDetails from './pages/ProductDetails';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import { About, HowItWorks } from './pages/StaticPages';
function Protected({children,role}:{children:React.ReactNode;role?:'STUDENT'|'ADMIN'}){const {user,loading}=useAuth();if(loading)return <div className="loading-page">Loading Campus Reuse…</div>;if(!user)return <Navigate to="/login" replace/>;if(role&&user.role!==role)return <Navigate to={user.role==='ADMIN'?'/admin':'/dashboard'} replace/>;return <>{children}</>}
export default function App(){return <BrowserRouter><AuthProvider><Routes><Route path="/" element={<Home/>}/><Route path="/marketplace" element={<Marketplace/>}/><Route path="/products/:id" element={<ProductDetails/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/sell" element={<Protected><Sell/></Protected>}/><Route path="/dashboard" element={<Protected role="STUDENT"><Dashboard/></Protected>}/><Route path="/admin" element={<Protected role="ADMIN"><Admin/></Protected>}/><Route path="/how-it-works" element={<HowItWorks/>}/><Route path="/about" element={<About/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></AuthProvider></BrowserRouter>}
