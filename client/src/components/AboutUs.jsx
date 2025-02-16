import React, { useState, useEffect } from 'react';
import './AboutUs.css';

const AboutUs = () => {
  const [centerIndex, setCenterIndex] = useState(0);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [disableTransition, setDisableTransition] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Example dark-mode check (unused below)
  useEffect(() => {
    const isDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Example data (3 members)
  const teamMembers = [
    {
      name: "Himanshu Upadhyay",
      role: "Full Stack Developer",
      image: "https://picsum.photos/seed/himanshu/200/200",
      info: "Himanshu is a seasoned full stack developer...",
    },
    {
      name: "Bob Johnson",
      role: "Backend Developer",
      image: "https://picsum.photos/seed/bob/200/200",
      info: "Bob powers our systems and ensures everything runs smoothly.",
    },
    {
      name: "Carol Williams",
      role: "UX Designer",
      image: "https://picsum.photos/seed/carol/200/200",
      info: "Carol crafts engaging user experiences...",
    },
  ];

  // Indices for your 5-slot carousel
  const indices = [
     (centerIndex - 2 + teamMembers.length) % teamMembers.length,
    (centerIndex - 1 + teamMembers.length) % teamMembers.length,
    centerIndex,
     (centerIndex + 1 + teamMembers.length) % teamMembers.length,
     (centerIndex + 2 + teamMembers.length) % teamMembers.length,
  ];

  // Positions for each slot
  const positions = [
    { x: -250, y: -50, scale: 0.8, rotate: 30,  zIndex: 0 },
    { x: -150, y: -50, scale: 0.8, rotate: 20,  zIndex: 1 },
    { x:  -50, y: -50, scale: 1.0, rotate: 0,   zIndex: 2 },
    { x:   50, y: -50, scale: 0.8, rotate: -20, zIndex: 1 },
    { x:  150, y: -50, scale: 0.8, rotate: -30, zIndex: 0 },
  ];

  // Auto-slide if not hovered
  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        if (!isSliding) {
          setIsSliding(true);
          setDisableTransition(false);
          setSlideOffset(100);

          setTimeout(() => {
            setCenterIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
            setDisableTransition(true);
            setSlideOffset(0);

            setTimeout(() => {
              setDisableTransition(false);
              setIsSliding(false);
            }, 50);
          }, 1000);
        }
      }, 3000);

      return () => clearInterval(timer);
    }
  }, [isHovered, isSliding, teamMembers.length]);

  // Scale interpolation for sliding animation
  const getEffectiveScale = (slotIndex) => {
    const fraction = Math.min(Math.max(slideOffset / 100, 0), 1);
    if (slotIndex === 1) {
      return 0.8 + 0.2 * fraction;
    }
    if (slotIndex === 2) {
      return 1 - 0.2 * fraction;
    }
    if (slotIndex === 3) {
      return 0.8 - 0.2 * fraction;
    }
    return positions[slotIndex].scale;
  };

  return (
    <div className="about-us">
      {/* Intro Section */}
      <div className="info-section">
        <h2 className="heading">BLUDGERS</h2>
        <p className="paragraph">
          We are a team of passionate developers dedicated to creating innovative solutions.
        </p>
      </div>

      {/* Carousel Wrapper */}
      <div className="carousel-wrapper">
        <div className="carousel-container">
          {indices.map((memberIndex, slotIndex) => {
            const pos = positions[slotIndex];
            const effectiveScale = getEffectiveScale(slotIndex);

            // Inline transform for sliding
            const cardProps = {
              key: slotIndex,
              className: 'card',
              style: {
                transition: disableTransition ? 'none' : 'transform 1s ease-in-out',
                transform: `translate(${pos.x + slideOffset}%, ${pos.y}%)
                            scale(${effectiveScale})
                            rotateY(${pos.rotate}deg)`,
                zIndex: pos.zIndex,
              },
              // Optional: only hover on center card
              onMouseEnter: slotIndex === 2 ? () => setIsHovered(true) : undefined,
              onMouseLeave: slotIndex === 2 ? () => setIsHovered(false) : undefined,
            };

            return (
              <div {...cardProps}>
                <div className="iso-pro">
                  <img
                    src={teamMembers[memberIndex].image}
                    alt={teamMembers[memberIndex].name}
                    className="member-image"
                  />
                  <h3 className="member-name">
                    {teamMembers[memberIndex].name}
                  </h3>
                  <h4 className="member-role">
                    {teamMembers[memberIndex].role}
                  </h4>
                  <p className="member-info">
                    {teamMembers[memberIndex].info}
                  </p>

                  {/*
                    THREE SEPARATE CIRCLES, each with its own swirl effect.
                    For each "circle-wrapper," we have multiple spans
                    that create the layered swirl behind an icon or text.
                  */}
               <div className="three-circles">
  {/* Email Logo */}
  <div className="circle-wrapper">
    <span></span>
    <span></span>
    <span> <div className="logo email-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path d="M502.3 190.8L327.4 338.5c-21.4 18.6-52.5 18.6-73.9 0L9.7 190.8C3.9 186.4 0 179.2 0 171.3V80c0-26.5 21.5-48 48-48h416c26.5 0 48 21.5 48 48v91.3c0 7.9-3.9 15.1-9.7 19.5zM464 112H48v59.7l192 167.5 192-167.5V112zM48 400h416c26.5 0 48-21.5 48-48V224l-184.6 160.6c-26.7 23.1-66.3 23.1-93 0L0 224v128c0 26.5 21.5 48 48 48z"/>
      </svg>
    </div></span>
   
  </div>

  {/* Instagram Logo */}
  <div className="circle-wrapper">
    <span></span>
    <span></span>
    <span>  <div className="logo insta-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9 114.9-51.3 114.9-114.9S287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1-26.2 26.2-34.4 58-36.2 93.9-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9 26.2 26.2 58 34.4 93.9 36.2 37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
      </svg>
    </div></span>
  
  </div>

  {/* LinkedIn Logo */}
  <div className="circle-wrapper">
    <span></span>
    <span></span>
    <span> 
    <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
       <div className="logo linkedin-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <path d="M100.28 448H7.4V148.9h92.88zm-46.44-338C24.09 110 0 85.91 0 55.45 0 25.44 24.09 0 53.84 0 83.59 0 107.68 25.44 107.68 55.45c0 30.46-24.09 54.55-53.84 54.55zM447.9 448h-92.7V302.4c0-34.7-.7-79.3-48.3-79.3-48.3 0-55.7 37.7-55.7 76.7V448h-92.7V148.9h89V188h1.3c12.4-23.5 42.6-48.3 87.7-48.3 93.8 0 111.1 61.7 111.1 141.9V448z"/>
      </svg>
    </div>
    </a>
    </span>
  
  </div>
</div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
