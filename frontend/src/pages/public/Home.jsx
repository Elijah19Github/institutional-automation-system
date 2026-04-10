import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/home.css';

const Home = () => {
  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-blur"></div>
        <div className="hero-content">
          <h1 className="hero-title animate-in slide-in-from-bottom-8 duration-700">
            Welcome to <span className="hero-title-highlight">Smart Campus OS</span>
          </h1>
          <p className="hero-desc animate-in slide-in-from-bottom-10 duration-700 delay-100">
            The next-generation unified platform bridging academic excellence, automated admissions, and AI-driven institutional management.
          </p>
          <div className="hero-actions animate-in zoom-in-95 duration-700 delay-200">
            <Link to="/courses" className="btn-primary">
              Explore Programs
            </Link>
            <Link to="/register" className="btn-secondary">
              Join the Institution
            </Link>
          </div>
        </div>
      </section>

      {/* Find Your Degree Section */}
      <section className="degree-section">
        <div className="degree-container">
          <div className="degree-layout">
            
            {/* Left Side */}
            <div className="degree-left-col">
              <h2 className="degree-title">
                Find your Degree
              </h2>
              <p className="degree-desc">
                Explore our comprehensive range of academic programs tailored to your ambitions. Whether you are beginning your undergraduate journey or seeking advanced doctoral research, our institution offers world-class curriculums designed for the future.
              </p>
            </div>

            {/* Right Side */}
            <div className="degree-right-col">
              {/* Degree Cards 2x2 Grid */}
              <div className="degree-grid">
                {["Doctoral (PhD)", "Postgraduate", "Undergraduate", "Online Degree"].map((degree, idx) => (
                  <Link to="/courses" key={idx} className="degree-card group block">
                    {degree}
                    {/* Bottom Accent Line Gradient */}
                    <div className="degree-card-accent"></div>
                  </Link>
                ))}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="feature-section">
        <div className="feature-container">
          <div className="feature-header">
            <h2 className="feature-title">Built for Modern Institutions</h2>
            <p className="feature-desc">Native automation connecting prospective students directly into our highly-available academic infrastructure backed by robust internal analytics.</p>
          </div>
          <div className="feature-grid">
            {[
              { title: 'Automated Admissions', desc: 'Seamlessly apply, track, and enroll your candidates instantly online via automated document pipelines.', image: '/automated admission pic.png' },
              { title: 'AI Risk Engine', desc: 'Proactive student success monitoring. Catch academic drifts and behavioral anomalies before they spiral.', image: '/ai risk engine pic.png' },
              { title: 'Dynamic Academics', desc: 'Real-time schedule allocation, seamless curriculum generation, and centralized dynamic tracking mechanisms.', image: '/dynamic academics pic.png' }
            ].map((f, i) => (
              <div key={i} className="feature-card group">
                <div className="feature-img-wrapper">
                  <div className="feature-img-overlay"></div>
                  <img src={f.image} alt={f.title} className="feature-img" />
                </div>
                <div className="feature-content">
                  <h3 className="feature-card-title">{f.title}</h3>
                  <p className="feature-card-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
