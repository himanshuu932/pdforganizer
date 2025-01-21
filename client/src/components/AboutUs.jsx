import React from 'react';

const AboutUs = () => {
  return (
    <section id="about-us" style={styles.container}>
      <h2 style={styles.heading}>About Us</h2>
      <p style={styles.paragraph}>
        We are a team of passionate developers dedicated to creating innovative and impactful solutions for the web. Our mission is to bring the best technologies and ideas together to create exceptional user experiences.
      </p>
    </section>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f4f4f4',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: '2rem',
    marginBottom: '10px',
  },
  paragraph: {
    fontSize: '1rem',
    color: '#333',
  },
};

export default AboutUs;
