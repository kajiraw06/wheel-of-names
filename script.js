const form = document.getElementById('namesForm');
const namesInput = document.getElementById('names');
const spinBtn = document.getElementById('spinBtn');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const winnerDisplay = document.getElementById('winnerDisplay');


let names = [];
let winner = '';
let spinning = false;

// Secret winner mode state
let winnerModeActive = false;
let winnerInput = '';

// Listen for secret shortcut: Ctrl+Alt+N
window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n' && !winnerModeActive) {
        winnerModeActive = true;
        winnerInput = '';
        // Prevent default to avoid browser conflicts
        e.preventDefault();
    } else if (winnerModeActive) {
        // If Escape, cancel
        if (e.key === 'Escape') {
            winnerModeActive = false;
            winnerInput = '';
            return;
        }
        // If Enter, try to set winner
        if (e.key === 'Enter') {
            if (winnerInput.trim().length > 0) {
                // Find first name that includes the input (case-insensitive)
                const match = names.find(n => n.toLowerCase().includes(winnerInput.trim().toLowerCase()));
                if (match) {
                    winner = match;
                }
            }
            winnerModeActive = false;
            winnerInput = '';
            e.preventDefault();
        } else if (e.key.length === 1) {
            // Only add visible characters
            winnerInput += e.key;
        } else if (e.key === 'Backspace') {
            winnerInput = winnerInput.slice(0, -1);
        }
        // Prevent input from appearing in any focused field
        e.preventDefault();
    }
});


// Secret winner setting: double-click a name on the wheel
canvas.addEventListener('dblclick', function(e) {
    if (!names.length) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2;
    const y = e.clientY - rect.top - canvas.height / 2;
    const radius = canvas.width / 2 - 10;
    if (x * x + y * y > radius * radius) return; // Only allow inside the wheel
    
    // Calculate angle from the positive x-axis (right), counter-clockwise
    let angle = Math.atan2(y, x);
    
    // Convert to start from top (12 o'clock) going clockwise
    // atan2 gives us angle from right (0), counter-clockwise
    // We need angle from top (90 degrees or PI/2), clockwise
    angle = -angle + Math.PI / 2;
    
    // Normalize to 0 to 2*PI
    if (angle < 0) angle += 2 * Math.PI;
    
    const n = names.length;
    const anglePerSegment = 2 * Math.PI / n;
    
    // Offset by half a segment to match text position
    const adjustedAngle = (angle + anglePerSegment / 2) % (2 * Math.PI);
    const index = Math.floor(adjustedAngle / anglePerSegment) % n;
    
    if (index >= 0 && index < n) {
        winner = names[index];
        // Silent rigging - no notification
    }
});

// Function to update names from input
function updateNamesFromInput() {
    // Split by newlines first, then fallback to comma if no newlines
    let inputValue = namesInput.value;
    if (inputValue.includes('\n')) {
        names = inputValue.split('\n').map(n => n.trim()).filter(n => n);
    } else {
        names = inputValue.split(',').map(n => n.trim()).filter(n => n);
    }
    if (names.length === 0) {
        spinBtn.disabled = true;
        drawWheel([]);
        return;
    }
    // If the current winner is not in the new list, reset winner
    if (!names.includes(winner)) {
        winner = '';
    }
    spinBtn.disabled = false;
    drawWheel(names);
}

// Update wheel automatically as user types
namesInput.addEventListener('input', function() {
    updateNamesFromInput();
});

// Also handle form submission (for backward compatibility)
form.addEventListener('submit', function(e) {
    e.preventDefault();
    updateNamesFromInput();
});

spinBtn.addEventListener('click', function() {
    if (!spinning && names.length > 1) {
        playClickSound();
        let spinWinner = winner && names.includes(winner) ? winner : names[Math.floor(Math.random() * names.length)];
        spinToWinner(spinWinner);
    }
});

// Add click sound to all buttons
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', function() {
        if (!this.disabled) {
            playClickSound();
        }
    });
});

function drawWheel(namesArr, highlightIndex = -1) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 10;
    const n = namesArr.length;
    if (n === 0) return;
    const anglePer = 2 * Math.PI / n;
    // Draw wheel segments and names
    for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, i * anglePer, (i + 1) * anglePer);
        ctx.closePath();
        // Time2Bet Casino theme: dark luxurious colors with gold/orange accents
        const casinoColors = [
            '#fd9201', // signature orange
            '#2a2a40', // dark purple
            '#ffa726', // light orange
            '#1e1e30', // darker blue
            '#ffb74d', // lighter orange
            '#16213e', // navy blue
            '#ff9800', // orange
            '#0f3460', // deep blue
            '#c97d01', // dark orange
            '#1a1a2e', // dark purple blue
            '#fd9201', // signature orange repeat
            '#2a4365'  // slate blue
        ];
        ctx.fillStyle = i === highlightIndex ? '#FFD700' : casinoColors[i % casinoColors.length];
        ctx.fill();
        // Add white separator lines between segments
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(i * anglePer + anglePer / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(namesArr[i], radius - 10, 8);
        ctx.fillText(namesArr[i], radius - 10, 8);
        ctx.restore();
    }
    // Draw pointer in fixed position (top center, but pointing down)
    ctx.save();
    ctx.translate(centerX, centerY - radius + 10); // move pointer tip 10px inside the canvas
    ctx.rotate(Math.PI); // rotate 180 degrees to point down
    ctx.beginPath();
    ctx.moveTo(0, 0); // tip
    ctx.lineTo(-10, 20); // left base
    ctx.lineTo(10, 20); // right base
    ctx.closePath();
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.restore();
}

drawWheel([]);

function spinToWinner(winnerName) {
    spinning = true;
    spinBtn.disabled = true;
    canvas.classList.add('spinning');
    
    // Start spinning sound
    const spinSound = playSpinningSound();
    
    // Create sparkles during spin
    const sparkleInterval = setInterval(() => {
        createSparkles();
    }, 100);
    
    const n = names.length;
    const winnerIndex = names.indexOf(winnerName);
    const anglePer = 2 * Math.PI / n;
    const randomRounds = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const finalAngle = (3 * Math.PI / 2) - (winnerIndex * anglePer) - anglePer / 2;
    const totalAngle = 2 * Math.PI * randomRounds + finalAngle;
    let startTimestamp = null;
    let duration = 5000 + Math.random() * 1000; // 5-6 seconds for dramatic effect

    function animateWheel(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(1, elapsed / duration);
        
        // Dramatic slow-mo easing - very slow at the end
        let ease;
        if (progress < 0.7) {
            ease = progress / 0.7 * 0.9; // Fast for first 70%
        } else {
            // Slow dramatic finale for last 30%
            const finalProgress = (progress - 0.7) / 0.3;
            ease = 0.9 + (0.1 * (1 - Math.pow(1 - finalProgress, 4)));
        }
        
        const currentAngle = ease * totalAngle;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(currentAngle);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        // Draw only the wheel (no pointer)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = centerX - 10;
        const n = names.length;
        const anglePer = 2 * Math.PI / n;
        for (let i = 0; i < n; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, i * anglePer, (i + 1) * anglePer);
            ctx.closePath();
            // Time2Bet Casino theme: dark luxurious colors with gold/orange accents
            const casinoColors = [
                '#fd9201', // signature orange
                '#2a2a40', // dark purple
                '#ffa726', // light orange
                '#1e1e30', // darker blue
                '#ffb74d', // lighter orange
                '#16213e', // navy blue
                '#ff9800', // orange
                '#0f3460', // deep blue
                '#c97d01', // dark orange
                '#1a1a2e', // dark purple blue
                '#fd9201', // signature orange repeat
                '#2a4365'  // slate blue
            ];
            ctx.fillStyle = i === -1 ? '#FFD700' : casinoColors[i % casinoColors.length];
            ctx.fill();
            // Add white separator lines between segments
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(i * anglePer + anglePer / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(names[i], radius - 10, 8);
            ctx.fillText(names[i], radius - 10, 8);
            ctx.restore();
        }
        ctx.restore();
        // Draw pointer in fixed position (top center, but pointing down)
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 - radius + 10); // move pointer tip 10px inside the canvas
        ctx.rotate(Math.PI); // rotate 180 degrees to point down
        ctx.beginPath();
        ctx.moveTo(0, 0); // tip
        ctx.lineTo(-10, 20); // left base
        ctx.lineTo(10, 20); // right base
        ctx.closePath();
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.restore();
        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            clearInterval(sparkleInterval);
            canvas.classList.remove('spinning');
            spinSound.stop();
            spinning = false;
            spinBtn.disabled = false;
            drawWheel(names, winnerIndex);
            setTimeout(() => {
                showWinner(winnerName);
            }, 300);
        }
    }
    requestAnimationFrame(animateWheel);
}

function showWinner(winnerName) {
    winnerDisplay.textContent = `🎊 Winner: ${winnerName}! 🎊`;
    winnerDisplay.classList.add('show');
    
    // Show modal popup
    const modal = document.getElementById('winnerModal');
    const winnerNamePopup = document.getElementById('winnerNamePopup');
    winnerNamePopup.textContent = winnerName;
    modal.classList.add('show');
    
    // Play winner sound effect
    playWinnerSound();
    
    // Add screen shake effect
    document.querySelector('.wheel-container').style.animation = 'shake 0.5s ease-in-out';
    
    // Remove shake after animation
    setTimeout(() => {
        document.querySelector('.wheel-container').style.animation = '';
    }, 500);
    
    // Create confetti particles
    createConfetti();
    
    // Hide winner display after 7 seconds
    setTimeout(() => {
        winnerDisplay.classList.remove('show');
    }, 7000);
}

function playWinnerSound() {
    // Create AudioContext for sound generation
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Victory fanfare sound
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const duration = 0.15;
    
    notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (index * duration);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    });
}

function createConfetti() {
    const colors = ['#ffa726', '#fd9201', '#ff6f00', '#ffb74d', '#FFD700'];
    const confettiCount = 100;
    const container = document.body;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 1 + 2) + 's';
        confetti.style.zIndex = '9999';
        container.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 3500);
    }
}

function createSparkles() {
    const container = document.querySelector('.wheel-container');
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;
    
    for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.2);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = (rect.left - container.getBoundingClientRect().left + rect.width / 2 + x) + 'px';
        sparkle.style.top = (rect.top - container.getBoundingClientRect().top + rect.height / 2 + y) + 'px';
        sparkle.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px');
        sparkle.style.setProperty('--ty', (Math.random() - 0.5) * 100 + 'px');
        
        container.appendChild(sparkle);
        
        setTimeout(() => {
            sparkle.remove();
        }, 1500);
    }
}

function playClickSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playSpinningSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a pulsing tick sound like a casino wheel
    let tickInterval;
    let tickDelay = 50; // Start with fast ticking
    let isStopping = false;
    
    function playTick() {
        if (isStopping) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Crisp tick sound
        oscillator.frequency.value = 1200;
        oscillator.type = 'square';
        
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 5;
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        
        // Gradually slow down the ticking
        tickDelay = Math.min(tickDelay + 2, 300);
        
        if (!isStopping) {
            tickInterval = setTimeout(playTick, tickDelay);
        }
    }
    
    // Start ticking
    playTick();
    
    // Add background whoosh
    const whoosh = audioContext.createOscillator();
    const whooshGain = audioContext.createGain();
    const whooshFilter = audioContext.createBiquadFilter();
    
    whoosh.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(audioContext.destination);
    
    whoosh.type = 'sine';
    whoosh.frequency.value = 80;
    
    whooshFilter.type = 'lowpass';
    whooshFilter.frequency.value = 300;
    
    whooshGain.gain.setValueAtTime(0.03, audioContext.currentTime);
    
    whoosh.start(audioContext.currentTime);
    
    return {
        stop: function() {
            isStopping = true;
            clearTimeout(tickInterval);
            whooshGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            whoosh.stop(audioContext.currentTime + 0.5);
        }
    };
}
// Modal close functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('winnerModal');
    const closeBtn = document.querySelector('.close-modal');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    
    function closeModal() {
        modal.classList.remove('show');
    }
    
    closeBtn.addEventListener('click', closeModal);
    modalCloseBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
});