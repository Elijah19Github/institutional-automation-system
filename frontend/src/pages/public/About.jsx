import React from 'react';
import '../../styles/about.css';

const About = () => {
  return (
    <div className="about-wrapper">

      {/* --- Restored Previous Content --- */}
      <h1 className="about-title">About Us</h1>

      <div className="about-prose prose prose-lg dark:prose-invert max-w-none">
        
        <h2 className="text-2xl font-semibold mb-4 text-textPrimary">About the Institute</h2>
        <p className="about-desc text-justify leading-relaxed text-textSecondary mb-8">
          Established to bridge the critical gap between academic excellence and modern technological administration, our institute serves as a premier ecosystem for advanced learning. We are deeply committed to fostering an environment where innovation thrives organically alongside rigorous traditional curriculums. By leveraging state-of-the-art infrastructural designs and continuous AI-driven optimizations, we empower both our students to dream larger and our educators to teach without systemic friction. Our legacy is built upon decades of scholarly refinement, now natively automated to guarantee uncompromised institutional prestige and unparalleled global student success.
        </p>

        <h3 className="about-subtitle">Why Smart Campus OS?</h3>
        <ul className="about-list">
          <li className="about-list-item">
            <span className="about-check">✓</span>
            <span>Centralized dashboards ensuring transparency across all collegiate levels.</span>
          </li>
          <li className="about-list-item">
            <span className="about-check">✓</span>
            <span>Automated AI Quiz Generators linking tightly with your core syllabus framework.</span>
          </li>
          <li className="about-list-item">
            <span className="about-check">✓</span>
            <span>Proprietary AI Risk Engines ensuring intervention tracks are activated immediately when students drift.</span>
          </li>
        </ul>
      </div>

      {/* --- New Logo, Mission, and Vision Section --- */}
      <div className="about-logo-section">
        <div className="about-logo-wrapper">
          <img src="/logo.png" alt="Institutional Logo" className="about-logo-img" />
          <h2 className="about-logo-title">
            Smart Campus
          </h2>
        </div>

        <div className="about-cards-grid">
          {/* Vision Card */}
          <div className="about-card group">
            <div className="about-card-accent"></div>
            <h2 className="about-card-title">
              <span className="text-4xl"></span> Our Vision
            </h2>
            <p className="about-card-text">
              To create an interconnected academic ecosystem that proactively supports learners, rigorously standardizes administration, and natively guards institutional prestige using AI-first architectures.
            </p>
          </div>

          {/* Mission Card */}
          <div className="about-card group">
            <div className="about-card-accent"></div>
            <h2 className="about-card-title">
              <span className="text-4xl"></span> Our Mission
            </h2>
            <p className="about-card-text">
              To simplify the complex administrative burdens of modern universities globally. We strive to empower educators with seamless, automated tools, allowing them to focus completely on academic excellence and student success without software friction.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default About;
