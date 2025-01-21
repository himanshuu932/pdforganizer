import React, { useState, useEffect } from 'react';

const AboutUs = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Listen for changes in dark mode preference (e.g., system preference)
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
  }, []);

  return (
    <section
      id="about-us"
      style={darkMode ? styles.containerDark : styles.containerLight}
    >
      <h2 style={darkMode ? styles.headingDark : styles.headingLight}>About Us</h2>
      <p style={darkMode ? styles.paragraphDark : styles.paragraphLight}>
        We are a team of passionate developers dedicated to creating innovative and impactful solutions for the web. Our mission is to bring the best technologies and ideas together to create exceptional user experiences.
      </p>
    </section>
  );
};

const styles = {
  // Light Mode Styles
  containerLight: {
    padding: '20px',
    width: '300px',   // Set width
    height: '300px',  // Set height to be equal to width for square shape
    backgroundColor: '#f4f4f4',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingLight: {
    fontSize: '1.5rem', // Adjust font size to fit square container
    marginBottom: '10px',
    color: '#333',
    textAlign: 'center',
  },
  paragraphLight: {
    fontSize: '1rem',
    color: '#333',
    textAlign: 'center',
  },

  // Dark Mode Styles
  containerDark: {
    padding: '20px',
    width: '300px',   // Set width
    height: '300px',  // Set height to be equal to width for square shape
    backgroundColor: '#333',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingDark: {
    fontSize: '1.5rem', // Adjust font size to fit square container
    marginBottom: '10px',
    color: '#f1f1f1',
    textAlign: 'center',
  },
  paragraphDark: {
    fontSize: '1rem',
    color: '#ddd',
    textAlign: 'center',
  },
};

export default AboutUs;
