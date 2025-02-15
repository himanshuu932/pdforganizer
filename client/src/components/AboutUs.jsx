import React, { useState, useEffect } from 'react';
import './AboutUs.css';

const AboutUs = () => {
 
  const [centerIndex, setCenterIndex] = useState(0);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [disableTransition, setDisableTransition] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Set dark mode based on system preference on mount
  useEffect(() => {
    const isDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  }, []);

  const teamMembers = [
    {
      name: "Himanshu Upadhyay",
      role: "Full Stack Developer",
      image: "https://picsum.photos/seed/himanshu/200/200",
      info: "Himanshu is a seasoned full stack developer with expertise in both front-end and back-end technologies. "
    },
    
    {
      name: "Bob Johnson",
      role: "Backend Developer",
      image: "https://picsum.photos/seed/bob/200/200",
      info: "Bob powers our systems and ensures everything runs smoothly."
    },
    {
      name: "Carol Williams",
      role: "UX Designer",
      image: "https://picsum.photos/seed/carol/200/200",
      info: "Carol crafts engaging user experiences that delight our users."
    },
  ];

  // Use five slots:
  // Slot 0: Far Left
  // Slot 1: Left
  // Slot 2: Center
  // Slot 3: Right
  // Slot 4: Far Right
  const indices = [
    (centerIndex - 2 + teamMembers.length) % teamMembers.length, // Far left
    (centerIndex - 1 + teamMembers.length) % teamMembers.length, // Left
    centerIndex,                                                 // Center
    (centerIndex + 1) % teamMembers.length,                        // Right
    (centerIndex + 2) % teamMembers.length,                        // Far right
  ];

  // Base positions for each slot (x in %, y in %, etc.)
  const positions = [
    { x: -250, y: -50, scale: 0.6, rotate: 30,  zIndex: 0 }, // Far left
    { x: -150, y: -50, scale: 0.8, rotate: 20,  zIndex: 1 }, // Left
    { x: -50,  y: -50, scale: 1,   rotate: 0,   zIndex: 2 }, // Center
    { x: 50,   y: -50, scale: 0.8, rotate: -20, zIndex: 1 }, // Right
    { x: 150,  y: -50, scale: 0.6, rotate: -30, zIndex: 0 }, // Far right
  ];

  // Auto-slide effect (only when not hovered)
  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        if (!isSliding) {
          setIsSliding(true);
          setDisableTransition(false);
          setSlideOffset(100); // Slide right by 100%
          setTimeout(() => {
            // Update center index and reposition instantly
            setCenterIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
            setDisableTransition(true); // disable transition for instant repositioning
            setSlideOffset(0);
            setTimeout(() => {
              setDisableTransition(false);
              setIsSliding(false);
            }, 50);
          }, 1000); // Duration of the slide animation
        }
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isSliding, teamMembers.length, isHovered]);

  // Interpolate scales for smooth transitions.
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
    <div className={`about-us`}>
      <div className="info-section">
        <h2 className={`heading`}>
        BLUDGERS
        </h2>
        <p className={`paragraph `}>
          We are a team of passionate developers dedicated to creating innovative solutions.
        </p>
      </div>

      <div className="carousel-wrapper">
        <div className="carousel-container">
          {indices.map((memberIndex, slotIndex) => {
            const pos = positions[slotIndex];
            const effectiveScale = getEffectiveScale(slotIndex);

            // For the center card (slot index 2), add hover event handlers.
            const cardProps = {
              key: slotIndex,
              className: 'card-base',
              style: {
                transition: disableTransition ? 'none' : 'transform 1s ease-in-out',
                transform: `translate(${pos.x + slideOffset}%, ${pos.y}%) scale(${effectiveScale}) rotateY(${pos.rotate}deg)`,
                zIndex: pos.zIndex,
              },
            };
            if (slotIndex === 2) {
              cardProps.onMouseEnter = () => setIsHovered(true);
              cardProps.onMouseLeave = () => setIsHovered(false);
            }

            return (
              <div {...cardProps}>
                <img
                  src={teamMembers[memberIndex].image}
                  alt={teamMembers[memberIndex].name}
                  className="member-image"
                />
                <h3 className={`member-name`}>
                  {teamMembers[memberIndex].name}
                </h3>
                <h4 className={`member-role`}>
                  {teamMembers[memberIndex].role}
                </h4>
                <p className={`member-info `}>
                  {teamMembers[memberIndex].info}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
