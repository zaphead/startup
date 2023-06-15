import React, { Component } from 'react';
import './splash.css';

class SplashPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showSection3: false
    };
  }

  handleToSection2 = () => {
    this.setState({ showSection3: true });
  };

  render() {
    const { showSection3 } = this.state;

    return (
      <main>
        <header>
          <img className="logo" src="../Images/Processeon Logo.png" alt="Logo" />
          <nav>
            <ul>
              <li><a className="nav-items" href="#">Home</a></li>
              <li><a className="nav-items" href="../pricing/pricing.html">Pricing</a></li>
              <li><a className="nav-items" href="../index.html">Sign In</a></li>
            </ul>
          </nav>
        </header>

        <section id="section1" className="main-section">
          <div className="horizontal-container">
            <h2 className="small-header">Your jumbled business ideas ➡️ Concrete & verified plans for your</h2>
            <span className="small-header text-switcher">Small Business</span>
          </div>

          <div className="section-content" id="section0content">
            <div className="section-left">
              <img className="combined-images small-image" src="../Images/Notes_Card.png" alt="Notes Card" />
            </div>
            <div className="section-right">
              <img className="combined-images" src="../Images/Laptop Screenshot.png" style={{ zIndex: 100 }} alt="Laptop Screenshot" />
            </div>
          </div>
          <button id="toSection2" className="main-button caller-button" onClick={this.handleToSection2}>Why we made StrataMind</button>
        </section>

        {showSection3 && (
          <section id="section2" className="secondary-section">
            <div className="horizontal-container slideshow-container">
              <div className="section2-left">
                <p className="centered-text">StrataMind serves as your virtual business mentor, taking advantage of large language AI and data analysis to offer invaluable insights and guidance. <br /><br />No matter what your business is, StrataMind enables you to make informed decisions, seize growth opportunities, and receive personalized feedback aligned with your business's specific requirements. With StrataMind as your companion, you gain the support and expertise needed to navigate challenges, achieve your goals, and drive success.</p>
                <button className="main-button caller-button3 white-button" onClick={() => window.location.href = '../signup/signup.html'}>Sign Up</button>
              </div>
              <div className="section2-right">
                <img id="imgSlideshow" className="img-slideshow" src="../Images/owners/camera-guy.png" alt="Slideshow Image" />
              </div>
            </div>
          </section>
        )}

        <footer>
          <p>&copy; 2023 StrataMind. All rights reserved. <a href="../legal/legal.html" className="text-button"> Terms and Conditions & Privacy Policy</a></p>
        </footer>
      </main>
    );
  }
}

export default SplashPage;
