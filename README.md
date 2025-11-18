# TaxZone - SriLankan Comprehensive Taxation System

TaxZone is a full-stack web application designed to help users manage their tax-related documents, calculate taxes, and get AI-powered assistance with tax-related queries. The system supports multiple income types, document processing with OCR, and intelligent tax calculations.

<img width="1897" height="862" alt="home" src="https://github.com/user-attachments/assets/5ef72cb3-5d69-4074-ae6c-4dc31a1e628e" />

## 🚀 Features

### Core Functionality
- **Tax Calculation**: Calculate taxes for various income types including:
  - Employment Income
  - Business Income
  - Professional/Personal Service Income
  - Investment Income
  - Rental Income
  - Dividends, Interest, Royalties
  - Pension Income
  - Capital Gains

- **Document Processing**: 
  - Upload and process multiple document formats (PDF, DOCX, JPG, PNG, XLSX, TXT)
  - OCR (Optical Character Recognition) using Tesseract
  - Automatic text extraction and analysis
  - Document storage and management

- **AI-Powered Tax Assistant**:
  - Chatbot powered by Google Gemini AI
  - Context-aware responses based on tax documents
  - FAISS-based vector search for document retrieval
  - Natural language query processing

- **Tax Report Generation**:
  - Generate comprehensive tax reports
  - Export reports in multiple formats
  - Historical report tracking

- **User Management**:
  - JWT-based authentication
  - Google OAuth integration
  - User profile management
  - Secure session handling

- **Notifications & Calendar**:
  - Tax deadline reminders
  - Calendar integration
  - Email notifications
  - Customizable notification preferences

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 4.2.18
- **API**: Django REST Framework 3.15.2
- **Database**: MySQL
- **Authentication**: JWT (djangorestframework-simplejwt)
- **AI/ML Libraries**:
  - Google Generative AI (Gemini)
  - LangChain
  - FAISS (vector search)
  - TensorFlow
  - spaCy (NLP)
  - Transformers
- **Document Processing**:
  - Tesseract OCR (pytesseract)
  - pdf2image
  - python-docx
  - pandas (Excel processing)
  - OpenCV (image processing)

### Frontend
- **Framework**: React 18.2.0
- **UI Library**: Material-UI (MUI) 7.1.0
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Document Processing**: 
  - Tesseract.js (client-side OCR)
  - pdf.js
  - mammoth (DOCX processing)
  - xlsx (Excel processing)
- **Export**: jsPDF, html2canvas

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.9 or higher
- **Node.js** 14.x or higher
- **MySQL** 5.7 or higher
- **Tesseract OCR** (for document processing)
  - Windows: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
  - Linux: `sudo apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`
- **Git**

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TaxZone
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

#### Install Python Dependencies

```bash
cd tax_backend
pip install -r requirements.txt
```

#### Database Configuration

1. Create a MySQL database:
```sql
CREATE DATABASE taxzone_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Create a `.env` file in the `tax_backend` directory:
```env
DB_NAME=taxzone_db
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
GEMINI_API_KEY=your_google_gemini_api_key
SECRET_KEY=your_django_secret_key
```

3. Run migrations:
```bash
python manage.py migrate
```

4. (Optional) Load initial tax rate data:
```bash
python manage.py init_tax_tables_2024
```

#### Configure Tesseract (Windows)

If using Windows, ensure Tesseract is installed and update the path in `tax_backend/tax_backend/settings.py`:
```python
TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### 3. Frontend Setup

```bash
cd tax_frontend
npm install
```

### 4. Environment Variables

Create a `.env` file in `tax_frontend` (if needed):
```env
REACT_APP_API_URL=http://localhost:8000
```

## 🚀 Running the Application

### Start Backend Server

```bash
cd tax_backend
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Start Frontend Development Server

```bash
cd tax_frontend
npm start
```

The frontend will be available at `http://localhost:3000`

### Access Admin Panel

Navigate to `http://localhost:8000/admin` and log in with your superuser credentials.

To create a superuser:
```bash
python manage.py createsuperuser
```

## 📁 Project Structure

```
TaxZone/
├── tax_backend/              # Django backend application
│   ├── chatbot/              # AI chatbot module
│   │   ├── services/         # AI assistant service
│   │   └── faiss_index/      # Vector search indices
│   ├── tax_calculator/       # Tax calculation module
│   │   ├── services.py       # Tax calculation logic
│   │   └── sql/              # SQL scripts for tax rates
│   ├── tax_report/           # Tax report generation
│   │   ├── services/         # Document processing services
│   │   └── models.py         # Report models
│   ├── tax_notifications/    # Notifications module
│   ├── users/                # User management
│   ├── tax_backend/          # Django project settings
│   │   ├── settings.py       # Main configuration
│   │   └── urls.py           # URL routing
│   └── manage.py             # Django management script
│
├── tax_frontend/             # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   ├── contexts/         # React contexts
│   │   └── utils/            # Utility functions
│   └── public/               # Static files
│
└── README.md                 # This file
```

## 🔑 API Endpoints

### Authentication
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login
- `POST /api/login/google/` - Google OAuth login
- `POST /api/users/token/refresh/` - Refresh JWT token

### Tax Calculator
- `POST /api/calculator/calculate/` - Calculate tax
- `GET /api/calculator/tax-types/` - Get available tax types
- `GET /api/calculator/rates/` - Get tax rates

### Document Processing
- `POST /api/tax-report/upload/` - Upload documents
- `GET /api/tax-report/documents/` - List documents
- `GET /api/tax-report/documents/{id}/` - Get document details
- `POST /api/tax-report/analyze/` - Analyze document

### Chatbot
- `POST /api/chatbot/chat/` - Send message to AI assistant
- `GET /api/chatbot/conversations/` - Get conversation history

### Notifications
- `GET /api/notifications/` - Get user notifications
- `GET /api/notifications/calendar-data/` - Get calendar data
- `POST /api/notifications/preferences/` - Update preferences

## 🧪 Testing

### Backend Tests
```bash
cd tax_backend
python manage.py test
```

### Frontend Tests
```bash
cd tax_frontend
npm test
```

## 📝 Configuration

### Database Settings
The application uses MySQL. Configure your database connection in the `.env` file.

### AI Configuration
- **Gemini API**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add it to your `.env` file as `GEMINI_API_KEY`

### CORS Settings
CORS is configured to allow requests from `http://localhost:3000` in development. Update `CORS_ALLOWED_ORIGINS` in `settings.py` for production.

## 🔒 Security Notes

- **Never commit** `.env` files or sensitive credentials
- Change the `SECRET_KEY` in production
- Set `DEBUG = False` in production
- Configure proper `ALLOWED_HOSTS` for production
- Use HTTPS in production
- Secure your database credentials

## 🐛 Troubleshooting

### Tesseract OCR Issues
- Ensure Tesseract is installed and in your system PATH
- On Windows, verify the path in `settings.py` matches your installation
- Test Tesseract: `tesseract --version`

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure the database exists and user has proper permissions

### API Key Issues
- Verify `GEMINI_API_KEY` is set in `.env`
- Check API key is valid and has proper permissions

### Frontend Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Google Gemini API](https://ai.google.dev/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- TaxZone Development Team

## 🙏 Acknowledgments

- Google Gemini AI for intelligent document processing
- Django and React communities for excellent frameworks
- All open-source contributors whose libraries made this project possible

---

**Note**: This is a development version. For production deployment, ensure all security settings are properly configured and environment variables are securely managed.

## Tax Calculator
<img width="1893" height="863" alt="calculator" src="https://github.com/user-attachments/assets/0d55c59d-0249-45e0-88d6-f01fb1d4ceaf" />

## Tax AI Chatbot
<img width="1905" height="862" alt="Assistant" src="https://github.com/user-attachments/assets/57739913-6bd4-4bfb-a70e-71923a9d4f57" />

## Tax Calendar
<img width="1898" height="861" alt="calender" src="https://github.com/user-attachments/assets/accbe08d-55a6-4d56-97fa-b223a6ecc8c5" />

## Tax Report
<img width="1900" height="872" alt="details" src="https://github.com/user-attachments/assets/f3a6b285-80c3-4c85-baed-df2f6660f650" />

<img width="1898" height="875" alt="final report" src="https://github.com/user-attachments/assets/8bb54a24-8daf-477f-b661-03afec7aa2ae" />


