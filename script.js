class JsonToVideoConverter {
    constructor() {
        this.jsonData = null;
        this.videoBlob = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1920;
        this.canvas.height = 1080;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const dropArea = document.getElementById('dropArea');
        const convertBtn = document.getElementById('convertBtn');
        const durationInput = document.getElementById('duration');
        const fontSizeInput = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        
        // Загрузка файла через кнопку
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        // Drag and drop
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('dragover');
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/json') {
                this.handleFileSelect(file);
            } else {
                alert('Пожалуйста, загрузите файл в формате JSON');
            }
        });
        
        // Клик по области загрузки
        dropArea.addEventListener('click', () => fileInput.click());
        
        // Конвертация
        convertBtn.addEventListener('click', () => this.convertToVideo());
        
        // Обновление значения размера шрифта
        fontSizeInput.addEventListener('input', () => {
            fontSizeValue.textContent = `${fontSizeInput.value}px`;
        });
    }
    
    handleFileSelect(file) {
        if (!file || file.type !== 'application/json') {
            alert('Пожалуйста, выберите файл JSON');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.jsonData = JSON.parse(e.target.result);
                this.displayJsonPreview();
                document.getElementById('convertBtn').disabled = false;
            } catch (error) {
                alert('Ошибка при чтении JSON файла: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    displayJsonPreview() {
        const preview = document.getElementById('jsonPreview');
        preview.textContent = JSON.stringify(this.jsonData, null, 2);
    }
    
    async convertToVideo() {
        if (!this.jsonData) return;
        
        const loading = document.getElementById('loading');
        const downloadSection = document.getElementById('downloadSection');
        
        loading.classList.remove('hidden');
        downloadSection.classList.add('hidden');
        
        try {
            // Создаем кадры для видео
            const frames = await this.createVideoFrames();
            
            // Создаем Blob из кадров (в реальном проекте здесь будет кодирование в MP4)
            this.videoBlob = await this.framesToVideo(frames);
            
            // Показываем ссылку для скачивания
            this.showDownloadLink();
            
        } catch (error) {
            alert('Ошибка при создании видео: ' + error.message);
        } finally {
            loading.classList.add('hidden');
        }
    }
    
    async createVideoFrames() {
        const duration = parseInt(document.getElementById('duration').value);
        const bgColor = document.getElementById('bgColor').value;
        const textColor = document.getElementById('textColor').value;
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const fps = 30;
        const totalFrames = duration * fps;
        const frames = [];
        
        for (let i = 0; i < totalFrames; i++) {
            const progress = i / totalFrames;
            
            // Очищаем canvas
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Рисуем заголовок
            this.ctx.fillStyle = textColor;
            this.ctx.font = `bold ${fontSize * 1.5}px Arial`;
            this.ctx.textAlign = 'center';
            
            const title = this.jsonData.title || 'Данные из JSON';
            this.ctx.fillText(title, this.canvas.width / 2, 200);
            
            // Рисуем данные
            this.ctx.font = `${fontSize}px Arial`;
            
            if (this.jsonData.data && Array.isArray(this.jsonData.data)) {
                const startY = 350;
                const itemHeight = 80;
                
                this.jsonData.data.forEach((item, index) => {
                    const y = startY + (index * itemHeight);
                    const text = `${item.name || 'Элемент'}: ${JSON.stringify(item.value || item)}`;
                    this.ctx.fillText(text, this.canvas.width / 2, y);
                    
                    // Анимация прогресса
                    if (item.value && typeof item.value === 'number') {
                        const barWidth = 600;
                        const barHeight = 30;
                        const barX = (this.canvas.width - barWidth) / 2;
                        const barY = y + 30;
                        const maxValue = Math.max(...this.jsonData.data.map(d => d.value || 0));
                        
                        // Фон полоски
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        this.ctx.fillRect(barX, barY, barWidth, barHeight);
                        
                        // Прогресс
                        this.ctx.fillStyle = `hsl(${index * 60}, 70%, 60%)`;
                        const animatedWidth = barWidth * (item.value / maxValue) * progress;
                        this.ctx.fillRect(barX, barY, animatedWidth, barHeight);
                    }
                });
            } else {
                // Отображаем весь JSON как текст
                const jsonText = JSON.stringify(this.jsonData, null, 2);
                const lines = jsonText.split('\n');
                const startY = 300;
                const lineHeight = fontSize * 1.2;
                
                lines.forEach((line, index) => {
                    this.ctx.fillText(
                        line, 
                        this.canvas.width / 2, 
                        startY + (index * lineHeight)
                    );
                });
            }
            
            // Рисуем прогресс бар
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(100, this.canvas.height - 50, this.canvas.width - 200, 20);
            
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(100, this.canvas.height - 50, progress * (this.canvas.width - 200), 20);
            
            // Добавляем время
            this.ctx.fillStyle = textColor;
            this.ctx.font = `${fontSize * 0.8}px Arial`;
            this.ctx.fillText(
                `Время: ${(progress * duration).toFixed(1)}s / ${duration}s`,
                this.canvas.width / 2,
                this.canvas.height - 80
            );
            
            // Сохраняем кадр
            frames.push(this.canvas.toDataURL('image/png'));
            
            // Даем браузеру перерисоваться
            if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        return frames;
    }
    
    async framesToVideo(frames) {
        // В реальном проекте здесь нужно использовать библиотеку для кодирования MP4
        // Например, ffmpeg.js или запись на сервере
        
        // Для демонстрации создаем анимированный GIF
        return await this.createGifFromFrames(frames);
    }
    
    async createGifFromFrames(frames) {
        // Используем библиотеку gif.js для создания GIF
        // В реальном проекте нужно заменить на MP4 кодирование
        
        return new Promise((resolve) => {
            // Для демо просто создаем Blob из последнего кадра
            const lastFrame = frames[frames.length - 1];
            const byteString = atob(lastFrame.split(',')[1]);
            const mimeString = lastFrame.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([ab], { type: 'image/png' });
            resolve(blob);
        });
    }
    
    showDownloadLink() {
        const downloadSection = document.getElementById('downloadSection');
        const downloadLink = document.getElementById('downloadLink');
        
        if (this.videoBlob) {
            const url = URL.createObjectURL(this.videoBlob);
            downloadLink.href = url;
            downloadLink.download = `json-video-${Date.now()}.mp4`;
            downloadSection.classList.remove('hidden');
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new JsonToVideoConverter();
});
