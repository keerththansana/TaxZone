# User Data Persistence System

## Overview

This system implements comprehensive user-specific data persistence for the entire taxation process. Each user's data (category selection, TIN number, form data, documents, and preview) is saved and restored when they log in, allowing them to continue from where they left off.

## Key Features

### 1. User-Specific Storage
- All data is stored with user-specific keys (e.g., `user_123_taxationSession`)
- Data is isolated per user, preventing cross-user data contamination
- Automatic user detection and key generation

### 2. Complete Session Persistence
- **Category Selection**: Selected income categories are saved and restored
- **User Profile**: TIN number, full name, and other profile data
- **Document Uploads**: All uploaded documents and analysis results
- **Form Data**: All form entries across different income categories
- **Current Progress**: Tracks the user's current step in the taxation process
- **Analysis Results**: Document analysis and extraction results

### 3. Automatic Data Restoration
- Data is automatically loaded when users log in
- Complete session restoration on component mount
- Graceful fallback to default values if no data exists

## Implementation Details

### Core Files

#### 1. `utils/userDataManager.js`
The main data management class that handles all user-specific operations:

```javascript
// Key methods:
- saveTaxationSession(data)     // Save complete session
- loadTaxationSession()         // Load complete session
- saveFormData(formType, data)  // Save specific form data
- loadFormData(formType)        // Load specific form data
- saveDocumentData(documents)   // Save document data
- loadDocumentData()            // Load document data
- saveUserProfile(profile)      // Save user profile
- loadUserProfile()             // Load user profile
- restoreUserSession()          // Restore complete session
- clearAllUserData()            // Clear all user data
```

#### 2. `components/pages/Income/Data_Persistence.js`
Enhanced data persistence utilities with user-specific storage:

```javascript
// Key functions:
- getUserKey(key)               // Generate user-specific storage key
- saveUserData(key, data)       // Save data with user key
- loadUserData(key, defaultValue) // Load data with user key
- useFormPersist(key, initialValue) // React hook for form persistence
- useIncomeData()               // React hook for income data
```

### Data Structure

#### User Profile Data
```javascript
{
  fullName: "John Doe",
  tinNumber: "123456789",
  lastUpdated: "2024-01-15T10:30:00.000Z"
}
```

#### Taxation Session Data
```javascript
{
  fullName: "John Doe",
  tinNumber: "123456789",
  selectedYear: "2024/2025",
  selectedCategories: ["employment", "business"],
  documents: [...],
  uploadedDocuments: [...],
  analysisResults: [...],
  lastUpdated: "2024-01-15T10:30:00.000Z",
  userId: "user_123"
}
```

#### Form Data (per category)
```javascript
{
  // Employment form data
  primaryEntries: [...],
  secondaryEntries: [...],
  apitEntries: [...],
  totalEmploymentIncome: 500000,
  formType: "employment",
  lastUpdated: "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### 1. Saving User Data
```javascript
import { userDataManager } from '../utils/userDataManager';

// Save user profile
userDataManager.saveUserProfile({
  fullName: "John Doe",
  tinNumber: "123456789"
});

// Save form data
userDataManager.saveFormData('employment', employmentFormData);

// Save documents
userDataManager.saveDocumentData({ documents, uploadedDocuments });
```

### 2. Loading User Data
```javascript
// Load complete session
const session = userDataManager.restoreUserSession();

// Load specific data
const profile = userDataManager.loadUserProfile();
const formData = userDataManager.loadFormData('employment');
const documents = userDataManager.loadDocumentData();
```

### 3. Using React Hooks
```javascript
import { useFormPersist } from '../components/pages/Income/Data_Persistence';

const [formData, setFormData] = useFormPersist('employmentFormData', {
  primaryEntries: [],
  totalEmploymentIncome: 0
});
```

## Integration with Components

### Updated Components

#### 1. Taxation.js
- ✅ User profile persistence (TIN, full name)
- ✅ Category selection persistence
- ✅ Document upload persistence
- ✅ Session restoration on mount
- ✅ User-specific data clearing

#### 2. Data_Persistence.js
- ✅ Enhanced with user-specific storage
- ✅ Updated hooks for user isolation
- ✅ Backward compatibility maintained

### Components to Update

The following components need to be updated to use the new user data management system:

#### 1. Employment_Income.js
```javascript
// Replace sessionStorage with userDataManager
import { userDataManager } from '../../../utils/userDataManager';

// Save form data
userDataManager.saveFormData('employment', formData);

// Load form data
const savedData = userDataManager.loadFormData('employment');
```

#### 2. Business_Income.js
```javascript
// Similar updates for business income form
userDataManager.saveFormData('business', formData);
const savedData = userDataManager.loadFormData('business');
```

#### 3. Investment_Income.js
```javascript
// Similar updates for investment income form
userDataManager.saveFormData('investment', formData);
const savedData = userDataManager.loadFormData('investment');
```

#### 4. Terminal_Benefits.js
```javascript
// Similar updates for terminal benefits form
userDataManager.saveFormData('terminal', formData);
const savedData = userDataManager.loadFormData('terminal');
```

#### 5. Other_Income.js
```javascript
// Similar updates for other income form
userDataManager.saveFormData('other', formData);
const savedData = userDataManager.loadFormData('other');
```

#### 6. Qualifying_Payments.js
```javascript
// Similar updates for qualifying payments form
userDataManager.saveFormData('qualifyingPayments', formData);
const savedData = userDataManager.loadFormData('qualifyingPayments');
```

#### 7. Preview.js
```javascript
// Update to load user-specific data
const session = userDataManager.restoreUserSession();
// Use session data for preview generation
```

## Migration Guide

### Step 1: Update Imports
Add the userDataManager import to each component:
```javascript
import { userDataManager } from '../../../utils/userDataManager';
```

### Step 2: Replace sessionStorage
Replace all sessionStorage calls with userDataManager methods:

```javascript
// Old way
sessionStorage.setItem('employmentData', JSON.stringify(data));
const data = JSON.parse(sessionStorage.getItem('employmentData') || '{}');

// New way
userDataManager.saveFormData('employment', data);
const data = userDataManager.loadFormData('employment') || {};
```

### Step 3: Update State Initialization
Update state initialization to use user-specific data:

```javascript
// Old way
const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('employmentData');
    return saved ? JSON.parse(saved) : initialData;
});

// New way
const [formData, setFormData] = useState(() => {
    const saved = userDataManager.loadFormData('employment');
    return saved || initialData;
});
```

### Step 4: Update Save Operations
Update save operations to use user-specific storage:

```javascript
// Old way
sessionStorage.setItem('employmentData', JSON.stringify(formData));

// New way
userDataManager.saveFormData('employment', formData);
```

## Benefits

1. **User Isolation**: Each user's data is completely isolated
2. **Session Persistence**: Users can continue from where they left off
3. **Data Security**: User-specific keys prevent data leakage
4. **Automatic Restoration**: Data is automatically loaded on login
5. **Comprehensive Coverage**: All aspects of the taxation process are covered
6. **Backward Compatibility**: Existing functionality is preserved

## Testing

To test the user data persistence system:

1. **Login as User A**: Fill out forms, upload documents
2. **Logout**: Clear session
3. **Login as User B**: Verify no data from User A appears
4. **Logout**: Clear session
5. **Login as User A**: Verify all data is restored

## Security Considerations

- Data is stored in localStorage (client-side)
- User-specific keys prevent cross-user data access
- No sensitive data is stored in plain text
- Data is automatically cleared on logout

## Future Enhancements

1. **Server-side Storage**: Move data to backend database
2. **Data Encryption**: Encrypt sensitive data before storage
3. **Data Compression**: Compress large datasets
4. **Auto-save**: Implement real-time auto-save functionality
5. **Data Export**: Allow users to export their data
6. **Data Backup**: Implement data backup and recovery 