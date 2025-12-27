const form = document.getElementById('namesForm');
const namesInput = document.getElementById('names');
const spinBtn = document.getElementById('spinBtn');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const winnerDisplay = document.getElementById('winnerDisplay');
const wheelFrame = document.querySelector('.wheel-frame');

let names = [];
let winner = '';
let spinning = false;
let currentRotation = 0;

// Wheel colors - Blue and White matching the image
const WHEEL_COLORS = ['#2563a8', '#ffffff'];

// Secret winner mode state
let winnerModeActive = false;
let winnerInput = '';

// Draw the wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 5;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (names.length === 0) {
        // Draw empty wheel with 10 segments
        const segments = 10;
        const anglePerSegment = (2 * Math.PI) / segments;
        
        for (let i = 0; i < segments; i++) {
            const startAngle = i * anglePerSegment + currentRotation;
            const endAngle = startAngle + anglePerSegment;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = WHEEL_COLORS[i % 2];
            ctx.fill();
            
            // Add subtle border between segments
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    } else {
        const anglePerSegment = (2 * Math.PI) / names.length;
        
        for (let i = 0; i < names.length; i++) {
            const startAngle = i * anglePerSegment + currentRotation;
            const endAngle = startAngle + anglePerSegment;
            
            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = WHEEL_COLORS[i % 2];
            ctx.fill();
            
            // Add subtle border between segments
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerSegment / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = WHEEL_COLORS[i % 2] === '#ffffff' ? '#2563a8' : '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(names[i].substring(0, 15), radius - 20, 5);
            ctx.restore();
        }
    }
    
    // Draw center circle gradient effect
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Listen for Shift+Name shortcut
window.addEventListener('keydown', function(e) {
    if (e.shiftKey && e.key.length === 1 && e.key.match(/[a-z]/i)) {
        if (!winnerModeActive) {
            winnerModeActive = true;
            winnerInput = '';
        }
        winnerInput += e.key.toLowerCase();
        e.preventDefault();
    } else if (e.shiftKey && e.key === 'Backspace') {
        if (winnerModeActive) {
            winnerInput = winnerInput.slice(0, -1);
            e.preventDefault();
        }
    }
});

// Listen for when Shift is released
window.addEventListener('keyup', function(e) {
    if (!e.shiftKey && winnerModeActive) {
        if (winnerInput.trim().length > 0) {
            const match = names.find(n => n.toLowerCase().includes(winnerInput.trim()));
            if (match) {
                winner = match;
            }
        }
        winnerModeActive = false;
        winnerInput = '';
    }
});

// Secret winner setting: double-click canvas
canvas.addEventListener('dblclick', function(e) {
    if (!names.length) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const radius = rect.width / 2 - 10;
    if (x * x + y * y > radius * radius) return;
    
    let angle = Math.atan2(y, x);
    angle = -angle + Math.PI / 2;
    
    if (angle < 0) angle += 2 * Math.PI;
    
    const n = names.length;
    const anglePerSegment = 2 * Math.PI / n;
    const adjustedAngle = (angle + anglePerSegment / 2) % (2 * Math.PI);
    const index = Math.floor(adjustedAngle / anglePerSegment) % n;
    
    if (index >= 0 && index < n) {
        winner = names[index];
    }
});

// Function to update names from input
function updateNamesFromInput() {
    let inputValue = namesInput.value;
    if (inputValue.includes('\n')) {
        names = inputValue.split('\n').map(n => n.trim()).filter(n => n);
    } else {
        names = inputValue.split(',').map(n => n.trim()).filter(n => n);
    }
    if (names.length === 0) {
        spinBtn.disabled = true;
    } else {
        spinBtn.disabled = false;
    }
    if (!names.includes(winner)) {
        winner = '';
    }
    drawWheel();
}

// Update wheel automatically as user types
namesInput.addEventListener('input', function() {
    updateNamesFromInput();
});

// Also handle form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
    updateNamesFromInput();
});

spinBtn.addEventListener('click', function() {
    if (!spinning && names.length > 0) {
        playClickSound();
        let spinWinner = winner && names.includes(winner) ? winner : names[Math.floor(Math.random() * names.length)];
        spinToWinner(spinWinner);
    }
});

function spinToWinner(winnerName) {
    spinning = true;
    spinBtn.disabled = true;
    
    // Add glow effect to the frame
    wheelFrame.classList.add('spinning');
    
    // Start spinning sound
    const spinSound = playSpinningSound();
    
    // Create sparkles during spin
    const sparkleInterval = setInterval(() => {
        createSparkles();
    }, 100);
    
    const n = names.length;
    const winnerIndex = names.indexOf(winnerName);
    const anglePer = 2 * Math.PI / n;
    const randomRounds = 8 + Math.floor(Math.random() * 4);
    
    // Normalize current rotation to 0-2π range
    currentRotation = currentRotation % (2 * Math.PI);
    if (currentRotation < 0) currentRotation += 2 * Math.PI;
    
    // Calculate final angle so winner is at top (pointer position)
    const finalAngle = (3 * Math.PI / 2) - (winnerIndex * anglePer) - anglePer / 2;
    const totalAngle = 2 * Math.PI * randomRounds + finalAngle - currentRotation;
    const startRotation = currentRotation;
    let startTimestamp = null;
    const duration = 7000 + Math.random() * 1000;

    function animateWheel(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(1, elapsed / duration);
        
        // Smooth easing - cubic ease out for natural deceleration
        const ease = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = startRotation + ease * totalAngle;
        drawWheel();
        
        // Rotate the frame along with the wheel
        const degrees = (currentRotation * 180) / Math.PI;
        wheelFrame.style.transform = `translate(-50%, -50%) rotate(${degrees}deg)`;
        
        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            clearInterval(sparkleInterval);
            spinSound.stop();
            spinning = false;
            spinBtn.disabled = false;
            
            // Remove glow effect
            wheelFrame.classList.remove('spinning');
            
            setTimeout(() => {
                showWinner(winnerName);
            }, 300);
        }
    }
    requestAnimationFrame(animateWheel);
}

function showWinner(winnerName) {
    const modal = document.getElementById('winnerModal');
    const winnerNamePopup = document.getElementById('winnerNamePopup');
    winnerNamePopup.textContent = winnerName;
    modal.classList.add('show');
}

function playWinnerSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50];
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
    
    let tickInterval;
    let tickDelay = 50;
    let isStopping = false;
    
    function playTick() {
        if (isStopping) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1200;
        oscillator.type = 'square';
        
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 5;
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        
        tickDelay = Math.min(tickDelay + 2, 300);
        
        if (!isStopping) {
            tickInterval = setTimeout(playTick, tickDelay);
        }
    }
    
    playTick();
    
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
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Resize canvas based on CSS dimensions
    function resizeCanvas() {
        const canvasStyle = window.getComputedStyle(canvas);
        const width = parseInt(canvasStyle.width);
        const height = parseInt(canvasStyle.height);
        
        // Update canvas internal resolution
        canvas.width = width;
        canvas.height = height;
        
        // Redraw wheel with new dimensions
        drawWheel();
    }
    
    // Initial resize
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Disable spin button initially
    spinBtn.disabled = true;
});
