import { formFieldMapping } from './formFieldMapping';

export class AutoFillHelper {
  static async mapAnalysisToForms(analysisResults) {
    try {
      const response = await fetch('/api/tax/auto-fill/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisResults })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return this.processBackendData(result.data);
    } catch (error) {
      console.error('Auto-fill mapping error:', error);
      throw error;
    }
  }

  static processBackendData(mappedData) {
    const formData = {};
    
    Object.entries(mappedData).forEach(([formType, sections]) => {
      if (!formData[formType]) {
        formData[formType] = {};
      }

      Object.entries(sections).forEach(([section, fields]) => {
        Object.entries(fields).forEach(([fieldType, value]) => {
          const mapping = formFieldMapping[fieldType];
          if (mapping && mapping.validation(value)) {
            formData[formType][mapping.fieldName] = value;
          }
        });
      });
    });

    return formData;
  }
}