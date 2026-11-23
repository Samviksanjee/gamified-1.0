import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // Scroll effect for navbar
  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  window.addEventListener('scroll', handleScroll);

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing">
      {/* Navigation Bar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <h2 className="logo">Gamifi<span>ED</span></h2>
          </div>
          <button className="btn btn-primary nav-cta" onClick={goToLogin}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Level Up Your Learning
            </h1>
            <p className="hero-subtitle">
              Turn studying into an adventure! Join thousands of students learning through gamified challenges, earn badges, and compete on leaderboards.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary btn-large" onClick={goToLogin}>
                Start Learning Now
              </button>
              <button className="btn btn-secondary btn-large" onClick={() => {
                document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
              }}>
                Learn More
              </button>
              <button 
                className="btn btn-admin btn-large" 
                onClick={() => navigate('/admin/setup')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none'
                }}
                title="Access super admin panel"
              >
                👑 Super Admin
              </button>
            </div>
          </div>
          <div className="hero-illustration">
            <div className="hero-graphic">
              <div className="graphic-element element-1">🎮</div>
              <div className="graphic-element element-2">⭐</div>
              <div className="graphic-element element-3">🏆</div>
              <div className="graphic-element element-4">📚</div>
              <div className="graphic-base"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-container">
          <h2 className="section-title">Why GamifiED?</h2>
          <p className="section-subtitle">Experience the future of learning</p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Interactive Challenges</h3>
              <p>
                Solve quizzes, matching games, and sequencing puzzles that make learning engaging and fun.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Earn Badges & Points</h3>
              <p>
                Collect achievements and earn points with every correct answer. Show off your progress!
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Leaderboards</h3>
              <p>
                Compete with classmates, climb the rankings, and become the top learner in your class.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>
                See your learning journey with detailed analytics, insights, and personalized recommendations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Content</h3>
              <p>
                Intelligent question generation adapts to your learning style and creates personalized practice.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Classroom Collaboration</h3>
              <p>
                Join your teacher's classroom, complete assignments, and learn together with your peers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>

          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your free account in seconds</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Join or Create</h3>
              <p>Join a classroom or create your own</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Learn & Play</h3>
              <p>Complete challenges and earn rewards</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">4</div>
              <h3>Succeed</h3>
              <p>Achieve your learning goals faster</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="section-container stats-grid">
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Active Learners</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Questions Generated</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">100+</div>
            <div className="stat-label">Topics Covered</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">User Satisfaction</div>
          </div>
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="testimonials">
        <div className="section-container">
          <h2 className="section-title">What Students Say</h2>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "GamifiED made studying so much fun! I actually look forward to doing my homework now. The badges and leaderboards keep me motivated!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">🎓</div>
                <div>
                  <div className="author-name">Sarah M.</div>
                  <div className="author-role">Grade 8 Student</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "The interactive quizzes help me understand topics better than traditional studying. Plus, competing with my friends makes it exciting!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">📚</div>
                <div>
                  <div className="author-name">Alex J.</div>
                  <div className="author-role">Grade 7 Student</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "My grades improved so much after using GamifiED! The personalized recommendations really help me focus on what I need to work on."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">🌟</div>
                <div>
                  <div className="author-name">Jordan K.</div>
                  <div className="author-role">Grade 9 Student</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container cta-content">
          <h2>Ready to Transform Your Learning?</h2>
          <p>Join thousands of students already learning smarter with GamifiED</p>
          <button className="btn btn-primary btn-large" onClick={goToLogin}>
            Get Started Free Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-column">
              <h4>GamifiED</h4>
              <p>Making education engaging and effective through gamification.</p>
            </div>
            <div className="footer-column">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#" onClick={goToLogin}>Sign In</a></li>
                <li><a href="#" onClick={() => navigate('/admin/setup')}>Super Admin</a></li>
                <li><a href="#">About Us</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">FAQs</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 GamifiED. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
