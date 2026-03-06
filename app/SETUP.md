# 🎯 AI Vision Pro - Web UI Setup Guide

A modern, production-ready web interface for AI Image Detection. Built with Flask and a responsive modern frontend.

## ✨ Features

- **Single Image Detection** - Analyze individual images with detailed metrics
- **Batch Processing** - Process multiple images simultaneously
- **Detection History** - View and manage past detections with thumbnails
- **Real-time Statistics** - Track detection metrics and trends
- **Dark Mode** - Toggle between light and dark themes
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Professional UI** - Modern glassmorphism design with smooth animations
- **API-Based** - RESTful API endpoints for easy integration

## 📋 Requirements

- Python 3.8+
- Virtual environment (recommended)
- 500MB+ disk space for model and uploads
- Modern web browser

## 🚀 Quick Start

### 1. Install Dependencies

First, install all required packages:

```bash
pip install -r requirements.txt
```

This includes:
- `flask` - Web framework
- `flask-cors` - CORS support for API
- `torch` & `torchvision` - Deep learning
- `pillow` - Image processing

### 2. Run the Flask Web Server

Navigate to the app directory and start the server:

```bash
cd app
python web_app.py
```

Expected output:
```
WARNING in app.run_simple (serving.py:XXX): This is a development server. Do not use it in production deployments.
Press CTRL+C to quit
Running on http://0.0.0.0:5000
```

### 3. Open in Browser

Visit: **http://localhost:5000** or **http://127.0.0.1:5000**

## 🎮 Usage Guide

### Single Image Detection
1. Click the **Detector** tab
2. Drag & drop or click to upload an image (PNG, JPG, JPEG)
3. Click **Analyze Image**
4. View detailed results including:
   - AI vs Authentic probability
   - Confidence score
   - Image metadata (dimensions, size, etc.)

### Batch Upload
1. Click the **Batch Upload** tab
2. Select multiple images at once
3. Click **Analyze All Images**
4. Results display in a grid format

### View History
1. Click the **History** tab
2. See all past detections with:
   - Image thumbnails
   - Verdict (AI/Authentic)
   - Confidence scores
   - Metadata

### Statistics Dashboard
1. Click the **Statistics** tab
2. View overview metrics:
   - Total detections
   - AI-generated count
   - Authentic count
   - Average confidence

## 🔌 API Endpoints

### Single Detection
```
POST /api/detect
Content-Type: multipart/form-data

Form Data:
- image: <image_file>

Response:
{
  "id": "uuid",
  "filename": "image.jpg",
  "ai_score": 0.7823,
  "real_score": 0.2177,
  "verdict": "AI Generated",
  "confidence": 0.7823,
  "width": 1920,
  "height": 1080,
  "file_size": 250.5,
  "timestamp": "2024-03-06T10:30:45.123456"
}
```

### Batch Detection
```
POST /api/detect-batch
Content-Type: multipart/form-data

Form Data:
- images: <multiple_image_files>

Response:
{
  "success": 5,
  "failed": 1,
  "results": [...],
  "errors": [...]
}
```

### Get History
```
GET /api/history?limit=20

Response: Array of detection objects
```

### Get Statistics
```
GET /api/stats

Response:
{
  "total": 42,
  "ai_detected": 28,
  "authentic_detected": 14,
  "average_confidence": 0.8456
}
```

### Clear History
```
POST /api/history/clear

Response:
{
  "message": "History cleared"
}
```

## 🎨 Features & Interface

### Modern Design
- Glassmorphism UI with blur effects
- Gradient backgrounds
- Smooth animations and transitions
- Responsive grid layouts

### Tab Navigation
- **Detector** - Single image analysis
- **Batch Upload** - Process multiple images
- **History** - View past detections
- **Statistics** - Overview metrics

### Dark Mode
Toggle with the moon/sun icon in the top-right corner. Preference is saved locally.

## 📁 Project Structure

```
app/
├── web_app.py              # Main Flask application
├── templates/
│   └── index.html          # HTML template
└── static/
    ├── style.css           # Styling
    └── script.js           # JavaScript functionality
```

## ⚙️ Configuration

### Flask Configuration
To modify Flask settings, edit `web_app.py`:

```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### Available Options
- `debug=True` - Enable debug mode (development only)
- `host='0.0.0.0'` - Listen on all network interfaces
- `port=5000` - Server port

### Production Deployment

For production, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
cd app
gunicorn -w 4 -b 0.0.0.0:5000 web_app:app
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows: Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :5000
kill -9 <PID>
```

### CORS Issues
CORS is automatically enabled for local development. For production, update:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["yourdomain.com"],
        "methods": ["GET", "POST"]
    }
})
```

### Large File Upload Issues
Modify in `web_app.py`:
```python
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
```

### Image Analysis Errors
Ensure the model file exists at: `../models/resnet_detector.pth`

## 📊 Performance Tips

1. **Use JPEG format** - Smaller file sizes than PNG
2. **Limit image resolution** - 1920x1080 or smaller for faster analysis
3. **Batch process similar images** - Better GPU utilization
4. **Clear history periodically** - Keeps memory usage low

## 🔐 Security Notes

This is a development server. For production:
- Enable HTTPS/SSL
- Implement authentication
- Add rate limiting
- Validate file uploads more strictly
- Use environment variables for configuration
- Implement CSRF protection

## 📝 Switching Between UIs

### Original Streamlit UI
```bash
streamlit run app/streamlit_app.py
```

### New Flask Web UI
```bash
cd app
python web_app.py
```

## 🛠️ Development

### Add New Features
1. Add API endpoint in `web_app.py`
2. Add JavaScript handler in `static/script.js`
3. Add HTML elements in `templates/index.html`
4. Style with `static/style.css`

### Testing API Endpoints
Use curl or Postman:
```bash
curl -F "image=@image.jpg" http://localhost:5000/api/detect
```

## 📞 Support

For issues with:
- **Flask App**: Check Python error logs
- **Frontend**: Open browser DevTools (F12)
- **Model**: Verify `src/predict.py` works

## 📄 License

See LICENSE file in project root

---

**Enjoy analyzing images with AI Vision Pro!** 🚀
