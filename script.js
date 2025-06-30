class ImageAnalyzer {
    constructor() {
        this.init();
    }

    init() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.resultsSection = document.getElementById('resultsSection');
        this.previewImage = document.getElementById('previewImage');
        this.imageUrl = document.getElementById('imageUrl');
        this.analysisContent = document.getElementById('analysisContent');
        this.aiPrompt = document.getElementById('aiPrompt');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Click to upload
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File selection
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }

    async handleFile(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            alert('File size must be less than 10MB.');
            return;
        }

        try {
            // Convert to data URL for preview and analysis
            const dataUrl = await this.fileToDataUrl(file);
            
            // Show preview
            this.previewImage.src = dataUrl;
            this.imageUrl.value = dataUrl;
            
            // Show results section
            this.resultsSection.style.display = 'block';
            this.resultsSection.scrollIntoView({ behavior: 'smooth' });

            // Analyze image with AI
            await this.analyzeImage(dataUrl);

        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file. Please try again.');
        }
    }

    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async analyzeImage(dataUrl) {
        try {
            // Show loading state
            this.analysisContent.innerHTML = '<div class="loading">Menganalisis gambar...</div>';

            // Analyze image using AI
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this image in detail. Provide a comprehensive description including:
                                1. What objects, people, or scenes are visible
                                2. Colors, lighting, and composition
                                3. Setting or location if identifiable
                                4. Any text or writing visible
                                5. Mood or atmosphere
                                6. Notable details or interesting elements
                                
                                Respond in Indonesian and be very descriptive so someone who hasn't seen the image can understand it clearly.`
                            },
                            {
                                type: "image_url",
                                image_url: { url: dataUrl }
                            }
                        ]
                    }
                ]
            });

            const analysis = completion.content;

            // Display analysis
            this.analysisContent.innerHTML = `
                <div class="analysis-text">${analysis}</div>
            `;

            // Generate AI prompt
            const aiPromptText = `Saya punya gambar yang ingin kamu analisis. Berikut adalah link gambar: ${dataUrl}

Tolong jelaskan apa yang kamu lihat dalam gambar ini secara detail.`;

            this.aiPrompt.value = aiPromptText;

        } catch (error) {
            console.error('Error analyzing image:', error);
            this.analysisContent.innerHTML = `
                <div style="color: #e53e3e;">
                    Error menganalisis gambar. Silakan coba lagi.
                </div>
            `;
        }
    }
}

// Copy to clipboard function
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    element.setSelectionRange(0, 99999); // For mobile devices
    
    navigator.clipboard.writeText(element.value).then(() => {
        // Show success message
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#48bb78';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#667eea';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        document.execCommand('copy');
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#48bb78';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#667eea';
        }, 2000);
    });
}

// Reset upload function
function resetUpload() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadArea').scrollIntoView({ behavior: 'smooth' });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new ImageAnalyzer();
});

