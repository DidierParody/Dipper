import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Post from './pages/Post';
import Admin from './pages/Admin';
import Unsubscribe from './pages/Unsubscribe';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Creator from './pages/Creator';

export default function App() {
  const [search, setSearch] = useState('');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header search={search} onSearch={setSearch} />
      <main style={{ flex: 1, width: '100%' }}>
        <Routes>
          <Route path="/" element={<Home search={search} />} />
          <Route path="/tag/:tag" element={<Home search={search} />} />
          <Route path="/post/:slug" element={<Post />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
          <Route path="/creador" element={<Creator />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
