    // 3D Tilting Card Effect mapped to Mouse Mousemove
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate rotation based on cursor distance from center
        const rotateX = ((y - centerY) / centerY) * -8; // max 8deg tilt
        const rotateY = ((x - centerX) / centerX) * 8;
        
        // Apply 3D rotation and dynamic glare
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        
        const glare = card.querySelector('.glare');
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`;
      });

      card.addEventListener('mouseleave', () => {
        // Reset transform when leaving card
        card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        const glare = card.querySelector('.glare');
        glare.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)';
      });
    });
