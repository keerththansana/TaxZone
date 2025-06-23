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
        otherEntries: [],
        whtEntries: []
      },
      TerminalBenefits: {
        benefitEntries: [],
        commutedEntries: [],
        gratuityEntries: [],
        compensationEntries: [],
        etfEntries: [],
        otherEntries: []
      },
      QualifyingPayments: {
        paymentEntries: [],
        samurdhiEntries: [],
        donationEntries: [],
        solarEntries: [],
        housingEntries: [],
        otherEntries: []
      }
    };
    
    // Process income items
    if (mappedData.income_items) {
      mappedData.income_items.forEach(item => {
        const category = item.category || '';
        const itemType = item.type || '';
        const description = (item.description || '').toLowerCase();
        
        switch(category) {
          case 'Employment Income':
            if (itemType === 'Primary Employment' || description.includes('primary') || description.includes('salary')) {
              formData.EmploymentIncome.primaryEntries.push({
                name: 'Primary Salary',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Secondary Employment' || description.includes('secondary') || description.includes('part-time')) {
              formData.EmploymentIncome.secondaryEntries.push({
                name: 'Secondary Salary',
                amount: item.amount.toString()
              });
            } else {
              // Default to primary employment
              formData.EmploymentIncome.primaryEntries.push({
                name: 'Primary Salary',
                amount: item.amount.toString()
              });
            }
            break;
            
          case 'Business Income':
            // Enhanced business income categorization
            if (itemType === 'Sole Proprietorship' || description.includes('sole proprietor') || description.includes('self-employed')) {
              formData.BusinessIncome.businessEntries.push({
                name: 'Sole Proprietorship',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Partnership' || description.includes('partnership')) {
              formData.BusinessIncome.businessEntries.push({
                name: 'Partnership',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Trust Beneficiary' || description.includes('trust')) {
              formData.BusinessIncome.businessEntries.push({
                name: 'Trust Beneficiary',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Betting, Gaming, Liquor & Tobacco' || 
                      description.includes('betting') || description.includes('gaming') || 
                      description.includes('casino') || description.includes('lottery')) {
              formData.BusinessIncome.businessEntries.push({
                name: 'Betting, Gaming, Liquor & Tobacco',
                amount: item.amount.toString()
              });
            } else {
              // Default business income
              formData.BusinessIncome.businessEntries.push({
                name: item.description || 'Business Income',
                amount: item.amount.toString()
              });
            }
            break;
            
          case 'Investment Income':
            // Enhanced investment income categorization
            if (itemType === 'Interest Income' || description.includes('interest')) {
              formData.InvestmentIncome.investmentEntries.push({
                name: 'Interest Income',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Dividend Income' || description.includes('dividend')) {
              formData.InvestmentIncome.investmentEntries.push({
                name: 'Dividend Income',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Rental Income' || description.includes('rent') || description.includes('rental')) {
              formData.InvestmentIncome.investmentEntries.push({
                name: 'Rental Income',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Capital Gains' || description.includes('capital') || description.includes('gain')) {
              formData.InvestmentIncome.investmentEntries.push({
                name: 'Capital Gains',
                amount: item.amount.toString()
              });
            } else {
              // Default investment income
              formData.InvestmentIncome.investmentEntries.push({
                name: item.description || 'Investment Income',
                amount: item.amount.toString()
              });
            }
            break;
            
          case 'Other Income':
            // Enhanced other income categorization
            if (itemType === 'Service Income (WHT)' || description.includes('service')) {
              formData.OtherIncome.otherEntries.push({
                name: 'Service Income',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Royalty (WHT)' || description.includes('royalty')) {
              formData.OtherIncome.otherEntries.push({
                name: 'Royalty',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Natural Resource Payment (WHT)' || description.includes('natural resource')) {
              formData.OtherIncome.otherEntries.push({
                name: 'Natural Resource Payment',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Auctioned Gem Sale (WHT)' || description.includes('gem') || description.includes('auction')) {
              formData.OtherIncome.otherEntries.push({
                name: 'Auctioned Gem Sale',
                amount: item.amount.toString()
              });
            } else {
              // Default other income
              formData.OtherIncome.otherEntries.push({
                name: item.description || 'Other Income',
                amount: item.amount.toString()
              });
            }
            break;
            
          case 'Terminal Benefits':
            // Enhanced terminal benefits categorization
            if (itemType === 'Commuted Pension' || description.includes('commuted') || description.includes('lump sum pension')) {
              formData.TerminalBenefits.commutedEntries.push({
                name: 'Commuted Pension',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Retiring Gratuity' || description.includes('gratuity')) {
              formData.TerminalBenefits.gratuityEntries.push({
                name: 'Retiring Gratuity',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Compensation for Job Loss' || description.includes('compensation') || description.includes('job loss')) {
              formData.TerminalBenefits.compensationEntries.push({
                name: 'Compensation for Job Loss',
                amount: item.amount.toString()
              });
            } else if (itemType === 'ETF Payment' || description.includes('etf') || description.includes('trust fund')) {
              formData.TerminalBenefits.etfEntries.push({
                name: 'ETF Payment',
                amount: item.amount.toString()
              });
            } else {
              // Default to other terminal benefits
              formData.TerminalBenefits.otherEntries.push({
                name: item.description || 'Other Terminal Benefit',
                amount: item.amount.toString()
              });
            }
            break;
            
          case 'Qualifying Payments':
            // Enhanced qualifying payments categorization
            if (itemType === 'Donations' || description.includes('donation') || description.includes('charity')) {
              formData.QualifyingPayments.donationEntries.push({
                name: 'Donations',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Shop Setup for Samurdhi Beneficiary' || description.includes('samurdhi') || description.includes('samurthy')) {
              formData.QualifyingPayments.samurdhiEntries.push({
                name: 'Shop Setup for Samurdhi Beneficiary',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Solar Panel Installation' || description.includes('solar')) {
              formData.QualifyingPayments.solarEntries.push({
                name: 'Solar Panel Installation',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Low-Income Housing Construction' || description.includes('housing')) {
              formData.QualifyingPayments.housingEntries.push({
                name: 'Low-Income Housing Construction',
                amount: item.amount.toString()
              });
            } else if (itemType === 'Film & Cinema Industry Expenditure' || description.includes('cinema') || description.includes('film')) {
              formData.QualifyingPayments.otherEntries.push({
                name: 'Film & Cinema Industry Expenditure',
                amount: item.amount.toString()
              });
            } else {
              // Default to other qualifying payments
              formData.QualifyingPayments.otherEntries.push({
                name: item.description || 'Other Qualifying Payment',
                amount: item.amount.toString()
              });
            }
            break;
        }
      });
    }

    // Process deductions with enhanced categorization
    if (mappedData.deductions) {
      mappedData.deductions.forEach(deduction => {
        const deductionType = deduction.type || '';
        const description = (deduction.description || '').toLowerCase();
        
        switch(deductionType) {
          case 'APIT Deduction':
          case 'APIT':
            formData.EmploymentIncome.apitEntries.push({
              source: deduction.source || 'Primary Employment',
              name: 'APIT Deduction',
              amount: deduction.amount.toString()
            });
            break;
            
          case 'WHT Deduction':
          case 'WHT':
            // Enhanced WHT source determination
            let source = 'WHT Deduction';
            if (description.includes('service')) {
              source = 'Service Income WHT';
            } else if (description.includes('royalty')) {
              source = 'Royalty WHT';
            } else if (description.includes('resource') || description.includes('natural')) {
              source = 'Natural Resource WHT';
            } else if (description.includes('gem') || description.includes('auction')) {
              source = 'Gem Sale WHT';
            } else if (description.includes('dividend')) {
              source = 'Dividend WHT';
            } else if (description.includes('interest')) {
              source = 'Interest WHT';
            }

            formData.OtherIncome.whtEntries.push({
              source: source,
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