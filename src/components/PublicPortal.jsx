import React from 'react';
import { ArrowRight } from 'lucide-react';
import HomePage from '../pages/public/HomePage.jsx';
import HowItWorksPage from '../pages/public/HowItWorksPage.jsx';
import ServicesPage from '../pages/public/ServicesPage.jsx';
import ImpactPage from '../pages/public/ImpactPage.jsx';
import ContactPage from '../pages/public/ContactPage.jsx';

const go = (path) => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0, behavior: 'smooth' }); };

export default function PublicPortal() {
  const currentPage = window.location.pathname.replace(/\/$/,'') || '/';
  const navigate = go;
  const page = currentPage === '/how-it-works' || currentPage === '/platform' ? <HowItWorksPage navigate={navigate}/> : currentPage === '/services' ? <ServicesPage navigate={navigate}/> : currentPage === '/impact' ? <ImpactPage navigate={navigate}/> : currentPage === '/contact' ? <ContactPage/> : <HomePage navigate={navigate}/>;
  return <div className="rr-public">
    <header className="rr-public-nav">
      <button className="rr-wordmark" onClick={() => go('/')} aria-label="RedResponse home"><img className="rr-logo-image" src="/redresponse-logo.png" alt="" /><span>RedResponse</span></button>
      <nav aria-label="Public navigation"><button className={currentPage==='/'?'is-active':''} onClick={() => go('/')}>Home</button><button className={currentPage==='/how-it-works'||currentPage==='/platform'?'is-active':''} onClick={() => go('/how-it-works')}>How it works</button><button className={currentPage==='/services'?'is-active':''} onClick={() => go('/services')}>Services</button><button className={currentPage==='/impact'?'is-active':''} onClick={() => go('/impact')}>Impact</button><button className={currentPage==='/contact'?'is-active':''} onClick={() => go('/contact')}>Contact</button></nav>
      <div className="rr-nav-actions"><button className="rr-link-button" onClick={() => go('/login')}>Sign in</button><button className="rr-button rr-button-primary" onClick={() => go('/register')}>Register organisation <ArrowRight size={16}/></button></div>
    </header>
    <main className={`rr-public-main rr-public-page-${currentPage==='/'?'home':currentPage.slice(1).replaceAll('/','-')}`}>{page}</main>
    <footer className="rr-public-footer"><button className="rr-wordmark" onClick={() => go('/')}><img className="rr-logo-image rr-logo-image-footer" src="/redresponse-logo.png" alt="" /><span>RedResponse</span></button><span>© {new Date().getFullYear()} RedResponse. Emergency operations software.</span><div><button onClick={() => go('/how-it-works')}>How it works</button><button onClick={() => go('/contact')}>Contact</button><button onClick={() => go('/login')}>Member sign in</button></div></footer>
  </div>;
}
