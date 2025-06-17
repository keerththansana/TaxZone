import axiosInstance from '../axiosConfig';
import { API_ENDPOINTS } from '../config/api';

export class AutoFillHelper {
  static async mapAnalysisToForms(analysisResults) {
    try {
      console.log('Starting auto-fill with analysis results:', analysisResults);

      // Handle array of results
      const results = Array.isArray(analysisResults) ? analysisResults : [analysisResults];
      
      if (!results || results.length === 0) {
        throw new Error('No analysis results available');
      }

      // Format the request payload to match backend expectations
      const requestData = {
        analysis: results.map(result => ({
          document_type: result.document_type || result.analysis?.document_type,
          confidence_score: result.confidence_score || result.analysis?.confidence_score,
          income_items: result.income_items || result.analysis?.income_items || [],
          deductions: result.deductions || result.analysis?.deductions || [],
          total_assessable_income: result.total_assessable_income || result.analysis?.total_assessable_income
        }))
      };

      // Log the formatted request data
      console.log('Formatted request data:', requestData);

      // Use the full URL from API_ENDPOINTS
      const url = API_ENDPOINTS.AUTO_FILL;
      console.log('Sending request to:', url);

      // Make sure we're using the full URL
      const response = await axiosInstance.post(url, requestData);
      console.log('Response received:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to map analysis to forms');
      }

      // Process the backend data before returning
      const processedData = this.processBackendData(response.data.mappings);
      console.log('Processed data:', processedData);
      return processedData;
    } catch (error) {
      // Log the full error object for debugging
      console.error('Auto-fill mapping error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });

      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Server error occurred';
        console.error('Server error response:', {
          status: error.response.status,
          data: error.response.data
        });
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server:', error.request);
        throw new Error('No response from server. Please check your connection and ensure the server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        throw new Error(`Failed to process request: ${error.message}`);
      }
    }
  }

  static processBackendData(mappedData) {
    console.log('Processing backend data:', mappedData);
    
    const formData = {
      EmploymentIncome: {
        primaryEntries: [],
        secondaryEntries: [],
        apitEntries: []
      },
      BusinessIncome: {
        businessEntries: [],
        deductions: []
      },
      InvestmentIncome: {
        investmentEntries: [],
        deductions: []
      },
      OtherIncome: {
        otherEntries: []
      },
      TerminalBenefits: {
        benefitEntries: []
      },
      QualifyingPayments: {
        paymentEntries: []
      }
    };
    
    // Process income items
    if (mappedData.income_items) {
      mappedData.income_items.forEach(item => {
        switch(item.category) {
          case 'Employment Income':
            if (item.type === 'SALARY') {
              formData.EmploymentIncome.primaryEntries.push({
                name: 'Primary Salary',
                amount: item.amount.toString()
              });
            } else if (item.type === 'SECONDARY_SALARY') {
              formData.EmploymentIncome.secondaryEntries.push({
                name: 'Secondary Salary',
                amount: item.amount.toString()
              });
            }
            break;
          case 'Business Income':
            formData.BusinessIncome.businessEntries.push({
              name: item.description || 'Business Income',
              amount: item.amount.toString()
            });
            break;
          case 'Investment Income':
            formData.InvestmentIncome.investmentEntries.push({
              name: item.description || 'Investment Income',
              amount: item.amount.toString()
            });
            break;
          case 'Other Income':
            formData.OtherIncome.otherEntries.push({
              name: item.description || 'Other Income',
              amount: item.amount.toString()
            });
            break;
          case 'Terminal Benefits':
            formData.TerminalBenefits.benefitEntries.push({
              name: item.description || 'Terminal Benefit',
              amount: item.amount.toString()
            });
            break;
          case 'Qualifying Payments':
            formData.QualifyingPayments.paymentEntries.push({
              name: item.description || 'Qualifying Payment',
              amount: item.amount.toString()
            });
            break;
        }
      });
    }

    // Process deductions
    if (mappedData.deductions) {
      mappedData.deductions.forEach(deduction => {
        switch(deduction.type) {
          case 'APIT':
            formData.EmploymentIncome.apitEntries.push({
              source: deduction.source || 'Primary Employment',
              name: 'APIT Deduction',
              amount: deduction.amount.toString()
            });
            break;
          case 'BUSINESS_DEDUCTION':
            formData.BusinessIncome.deductions.push({
              name: deduction.description || 'Business Deduction',
              amount: deduction.amount.toString()
            });
            break;
          case 'INVESTMENT_DEDUCTION':
            formData.InvestmentIncome.deductions.push({
              name: deduction.description || 'Investment Deduction',
              amount: deduction.amount.toString()
            });
            break;
        }
      });
    }

    console.log('Processed form data:', formData);
    return formData;
  }
} 