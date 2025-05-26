export const formFieldMapping = {
  APIT: {
    formComponent: 'EmploymentIncome',
    section: 'deductions',
    fieldName: 'apitAmount',
    validation: value => !isNaN(value)
  },
  SALARY: {
    formComponent: 'EmploymentIncome',
    section: 'income',
    fieldName: 'basicSalary',
    validation: value => !isNaN(value)
  }
  // Add more mappings as needed
};