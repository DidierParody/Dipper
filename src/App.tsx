import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Post from './pages/Post';
import Admin from './pages/Admin';
import Unsubscribe from './pages/Unsubscribe';
import Profile from './pages/Profile';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className="container" style={{ flex: 1, width: '100%', paddingTop: 24, paddingBottom: 48 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route path="/post/:slug" element={<Post />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
