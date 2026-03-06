// Global State
let currentDetection = null;
let selectedFiles = [];
let isAnalyzing = false;

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const imageInput = document.getElementById('imageInput');
const detectBtn = document.getElementById('detectBtn');
const uploadStatus = document.getElementById('uploadStatus');
const resultsCard = document.getElementById('resultsCard');
const previewCard = document.getElementById('previewCard');
const previewImage = document.getElementById('previewImage');
const verdictBox = document.getElementById('verdictBox');
const aiScore = document.getElementById('aiScore');
const realScore = document.getElementById('realScore');
const aiProgressFill = document.getElementById('aiProgressFill');
const realProgressFill = document.getElementById('realProgressFill');
const aiProgressText = document.getElementById('aiProgressText');
const realProgressText = document.getElementById('realProgressText');
const resetBtn = document.getElementById('resetBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const themeToggle = document.querySelector('.theme-toggle');

// Batch Elements
const batchUploadZone = document.getElementById('batchUploadZone');
const batchImageInput = document.getElementById('batchImageInput');
const batchDetectBtn = document.getElementById('batchDetectBtn');
const batchStatus = document.getElementById('batchStatus');
const batchResultsContainer = document.getElementById('batchResultsContainer');
const batchResults = document.getElementById('batchResults');

// History Elements
const historyContainer = document.getElementById('historyContainer');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Stats Elements
const totalDetections = document.getElementById('totalDetections');
const aiCount = document.getElementById('aiCount');
const authenticCount = document.getElementById('authenticCount');
const avgConfidence = document.getElementById('avgConfidence');

// Tab Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupDragAndDrop();
    loadHistory();
    loadStats();
    setupThemeToggle();
});

// ==================== Event Listeners ====================
function setupEventListeners() {
    // Single upload
    imageInput.addEventListener('change', handleImageSelect);
    detectBtn.addEventListener('click', analyzeImage);
    resetBtn.addEventListener('click', resetDetector);

    // Batch upload
    batchImageInput.addEventListener('change', handleBatchSelect);
    batchDetectBtn.addEventListener('click', analyzeBatch);

    // History
    clearHistoryBtn.addEventListener('click', clearHistory);

    // Tab navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            switchTab(tabName);
        });
    });
}

// ==================== Common Functions ====================
function showSpinner() {
    loadingSpinner.style.display = 'flex';
    isAnalyzing = true;
}

function hideSpinner() {
    loadingSpinner.style.display = 'none';
    isAnalyzing = false;
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function switchTab(tabName) {
    // Update nav buttons
    navBtns.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.nav-btn').classList.add('active');

    // Update tab content
    tabContents.forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    // Load data when switching tabs
    if (tabName === 'history') loadHistory();
    if (tabName === 'stats') loadStats();
}

// ==================== Single Image Detection ====================
function setupDragAndDrop() {
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            imageInput.files = files;
            handleImageSelect();
        }
    });

    uploadZone.addEventListener('click', () => imageInput.click());
}

function handleImageSelect() {
    const files = imageInput.files;
    if (files.length === 0) return;

    const file = files[0];

    // Validate file
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        showToast('Invalid file type. Please use PNG, JPG, or JPEG', 'error');
        return;
    }

    if (file.size > 200 * 1024 * 1024) {
        showToast('File is too large. Maximum size is 200MB', 'error');
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewCard.style.display = 'block';
        detectBtn.style.display = 'flex';
        uploadStatus.classList.remove('show', 'success', 'error', 'info');
    };
    reader.readAsDataURL(file);
}

async function analyzeImage() {
    if (!imageInput.files.length || isAnalyzing) return;

    showSpinner();
    resultsCard.style.display = 'none';
    uploadStatus.classList.remove('show', 'success', 'error', 'info');

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);

    try {
        const response = await fetch('/api/detect', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Analysis failed');
        }

        const result = await response.json();
        currentDetection = result;
        displayResults(result);
        showToast('Image analyzed successfully!', 'success');

    } catch (error) {
        showToast(error.message || 'Failed to analyze image', 'error');
        console.error('Error:', error);
    } finally {
        hideSpinner();
    }
}

function displayResults(result) {
    // Update verdict
    const isAI = result.verdict === 'AI Generated';
    verdictBox.className = `verdict-box ${isAI ? 'ai' : 'authentic'}`;
    verdictBox.innerHTML = `
        <div class="verdict-title">${result.verdict}</div>
        <div class="verdict-confidence">Confidence: ${(result.confidence * 100).toFixed(1)}%</div>
    `;

    // Update scores
    const aiPercentage = (result.ai_score * 100).toFixed(1);
    const realPercentage = (result.real_score * 100).toFixed(1);

    aiScore.textContent = aiPercentage + '%';
    realScore.textContent = realPercentage + '%';

    // Update progress bars
    animateProgressBar(aiProgressFill, result.ai_score * 100);
    animateProgressBar(realProgressFill, result.real_score * 100);
    aiProgressText.textContent = aiPercentage + '%';
    realProgressText.textContent = realPercentage + '%';

    // Update image info
    const imageInfo = document.getElementById('imageInfo');
    imageInfo.innerHTML = `
        <div class="info-item">
            <div class="info-label">Filename</div>
            <div class="info-value">${result.filename}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Dimensions</div>
            <div class="info-value">${result.width}×${result.height}</div>
        </div>
        <div class="info-item">
            <div class="info-label">File Size</div>
            <div class="info-value">${result.file_size} KB</div>
        </div>
        <div class="info-item">
            <div class="info-label">Time</div>
            <div class="info-value">${new Date(result.timestamp).toLocaleTimeString()}</div>
        </div>
    `;

    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function animateProgressBar(element, percentage) {
    element.style.width = '0%';
    setTimeout(() => {
        element.style.width = percentage + '%';
    }, 100);
}

function resetDetector() {
    imageInput.value = '';
    batchImageInput.value = '';
    resultsCard.style.display = 'none';
    previewCard.style.display = 'none';
    uploadStatus.classList.remove('show', 'success', 'error', 'info');
    detectBtn.style.display = 'none';
    currentDetection = null;
}

// ==================== Batch Detection ====================
function handleBatchSelect() {
    const files = batchImageInput.files;
    if (files.length === 0) return;

    selectedFiles = Array.from(files).filter(f => {
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)) {
            return false;
        }
        if (f.size > 200 * 1024 * 1024) {
            return false;
        }
        return true;
    });

    if (selectedFiles.length === 0) {
        showToast('No valid images selected', 'error');
        batchDetectBtn.style.display = 'none';
        return;
    }

    batchDetectBtn.style.display = selectedFiles.length > 0 ? 'flex' : 'none';
    batchStatus.classList.add('show', 'info');
    batchStatus.textContent = `${selectedFiles.length} image(s) selected`;
}

async function analyzeBatch() {
    if (selectedFiles.length === 0 || isAnalyzing) return;

    showSpinner();
    batchResultsContainer.style.display = 'none';

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('images', file);
    });

    try {
        const response = await fetch('/api/detect-batch', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Batch analysis failed');
        }

        const result = await response.json();
        displayBatchResults(result);
        showToast(`Analyzed ${result.success} image(s)`, 'success');

    } catch (error) {
        showToast(error.message || 'Failed to analyze batch', 'error');
        console.error('Error:', error);
    } finally {
        hideSpinner();
    }
}

function displayBatchResults(result) {
    batchResults.innerHTML = '';

    result.results.forEach(detection => {
        const isAI = detection.verdict === 'AI Generated';
        const card = document.createElement('div');
        card.className = 'batch-result-card';
        card.innerHTML = `
            <div class="batch-result-header">
                <div class="batch-result-filename">${detection.filename}</div>
                <div class="batch-result-badge ${isAI ? 'ai' : 'authentic'}">
                    ${isAI ? '🤖 AI' : '✓ Real'}
                </div>
            </div>
            <div class="batch-result-content">
                <div><strong>AI Score:</strong> ${(detection.ai_score * 100).toFixed(1)}%</div>
                <div><strong>Authentic:</strong> ${(detection.real_score * 100).toFixed(1)}%</div>
                <div><strong>Confidence:</strong> ${(detection.confidence * 100).toFixed(1)}%</div>
            </div>
        `;
        batchResults.appendChild(card);
    });

    if (result.errors.length > 0) {
        const errorsDiv = document.createElement('div');
        errorsDiv.className = 'status-message show error';
        errorsDiv.innerHTML = '<strong>Failed to analyze:</strong><ul>' +
            result.errors.map(e => `<li>${e.filename}: ${e.error}</li>`).join('') +
            '</ul>';
        batchResults.appendChild(errorsDiv);
    }

    batchResultsContainer.style.display = 'block';
    batchResultsContainer.scrollIntoView({ behavior: 'smooth' });
    loadStats();
    loadHistory();
}

// ==================== History ====================
async function loadHistory() {
    try {
        const response = await fetch('/api/history?limit=50');
        if (!response.ok) throw new Error('Failed to load history');

        const detections = await response.json();

        if (detections.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No detection history yet. Start by uploading an image!</p>
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = detections.map(d => {
            const isAI = d.verdict === 'AI Generated';
            const date = new Date(d.timestamp);
            return `
                <div class="history-item">
                    ${d.image_base64 ? `<img src="${d.image_base64}" alt="preview" class="history-image">` : '<div class="history-image"></div>'}
                    <div>
                        <h3>${d.filename}</h3>
                        <div class="history-meta">
                            <span>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                            <span>${d.width}×${d.height}</span>
                            <span>${d.file_size} KB</span>
                        </div>
                    </div>
                    <div class="history-verdict ${isAI ? 'ai' : 'authentic'}">
                        ${isAI ? '🤖 AI' : '✓ Real'}<br>${(d.confidence * 100).toFixed(1)}%
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading history:', error);
        historyContainer.innerHTML = '<div class="empty-state"><p>Failed to load history</p></div>';
    }
}

async function clearHistory() {
    if (!confirm('Are you sure you want to clear all detection history?')) return;

    try {
        const response = await fetch('/api/history/clear', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to clear history');

        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No detection history yet. Start by uploading an image!</p>
            </div>
        `;
        showToast('History cleared successfully', 'success');
        loadStats();

    } catch (error) {
        showToast('Failed to clear history', 'error');
        console.error('Error:', error);
    }
}

// ==================== Statistics ====================
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to load stats');

        const stats = await response.json();

        totalDetections.textContent = stats.total;
        aiCount.textContent = stats.ai_detected;
        authenticCount.textContent = stats.authentic_detected;
        avgConfidence.textContent = (stats.average_confidence * 100).toFixed(1) + '%';

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ==================== Theme Toggle ====================
function setupThemeToggle() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}
