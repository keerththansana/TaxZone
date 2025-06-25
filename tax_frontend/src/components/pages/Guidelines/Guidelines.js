import { useState } from "react";
import { ChevronDown } from "lucide-react"; // Changed to ChevronDown
import { useNavigate } from "react-router-dom"; // Import React Router's useNavigate hook
import Header from "../../common/Header/Header";
import Footer from "../../common/Footer/Footer";
import Button from "../../common/Button/Button"; // Import your Button component
import "./Guidelines.css"; // CSS for this component

const guidelinesData = [
  { 
    title: "How Tax.X Helps Individuals", 
    link: "/guidelines/help",
    content: "Tax.X revolutionizes the way individuals handle their tax obligations in Sri Lanka. Our platform offers comprehensive tax assistance through user-friendly tools for tax calculations, filing, and management. We provide step-by-step guidance for tax registration, real-time tax calculations, automated form filling, and deadline reminders. Our system helps you understand your tax obligations, maximize your benefits through available deductions, and ensures compliance with Sri Lankan tax laws. With Tax.X, you can track your tax payments, view your tax history, and receive personalized tax-saving recommendations."
  },
  { 
    title: "Taxpayer Identification Number (TIN) Registration", 
    link: "/guidelines/tin_registration",
    content: "A Taxpayer Identification Number (TIN) is a mandatory unique identifier for all taxpayers in Sri Lanka. The registration process requires submission of essential documents including your National Identity Card, proof of address, and employment details. The TIN registration can be completed either online through the Inland Revenue Department's website or in person at their office. Once registered, your TIN remains valid for life and must be quoted in all tax-related transactions. This number is crucial for filing tax returns, making tax payments, and claiming tax refunds. The registration process typically takes 3-5 working days to complete."
  },
  { 
    title: "Types of Taxes for Individuals in Sri Lanka", 
    link: "/guidelines/tax-registration",
    content: "Individuals in Sri Lanka are subject to several types of taxes. The primary tax is Income Tax, which is levied on employment income, business profits, and investment returns. Value Added Tax (VAT) applies to most goods and services at a standard rate. The Nation Building Tax (NBT) is imposed on certain goods and services. Additionally, there are specific taxes like the Economic Service Charge (ESC) for businesses and the Withholding Tax on certain payments. Each tax type has its own rules, rates, and filing requirements. Understanding these different taxes is crucial for proper tax planning and compliance."
  },
  { 
    title: "Tax Rates & Income Slabs for Individuals", 
    link: "/guidelines/tax_rates",
    content: "Sri Lanka's income tax system operates on a progressive rate structure. For the current tax year, the rates are as follows: 6% for annual income up to Rs. 1.2 million, 12% for income between Rs. 1.2 million and Rs. 1.7 million, 18% for income between Rs. 1.7 million and Rs. 2.2 million, and 24% for income above Rs. 2.2 million. These rates are subject to change based on government policy. The system includes various relief measures and deductions that can reduce your taxable income. It's important to note that these rates apply to your chargeable income after deducting eligible expenses and allowances."
  },
  { 
    title: "How to Calculate Your Tax", 
    link: "/guidelines/calculations",
    content: "Calculating your tax liability involves several steps. First, determine your total income from all sources including employment, business, and investments. Then, subtract eligible deductions such as EPF contributions, life insurance premiums, and medical expenses. The resulting amount is your chargeable income. Apply the appropriate tax rates based on your income slab. Tax.X provides automated calculators that handle these calculations, considering all applicable deductions and relief measures. Our system also helps you estimate your tax liability for the year and plan your tax payments accordingly."
  },
  { 
    title: "Tax Deductions & Exemptions for Individuals", 
    link: "/guidelines/deductions",
    content: "Various deductions and exemptions are available to reduce your taxable income. Common deductions include contributions to the Employees' Provident Fund (EPF), life insurance premiums, medical expenses, and interest on housing loans. Educational expenses for children and donations to approved charities are also deductible. There are specific exemptions for certain types of income, such as agricultural income and income from government securities. Understanding and properly claiming these deductions can significantly reduce your tax liability. Tax.X helps you identify all eligible deductions and ensures you maximize your tax benefits."
  },
  { 
    title: "Tax Filing Process for Individuals", 
    link: "/guidelines/tax_filling",
    content: "The tax filing process involves several key steps. First, gather all necessary documents including income statements, deduction proofs, and previous tax returns. Calculate your total income and eligible deductions. Complete the tax return form, either online through the Inland Revenue Department's system or using paper forms. Submit your return before the deadline, typically by November 30th of the following year. Keep copies of all submitted documents for your records. The department may request additional information or clarification. After submission, you'll receive an acknowledgment, and any tax due must be paid by the specified deadline."
  },
  { 
    title: "Tax Payment & Due Dates", 
    link: "/guidelines/due_dates",
    content: "Tax payments in Sri Lanka follow a structured schedule. For employed individuals, tax is typically deducted at source through the Pay As You Earn (PAYE) system. Self-employed individuals must make quarterly advance payments based on their estimated annual tax liability. The final tax return and any remaining tax must be submitted and paid by November 30th of the following year. Late payments attract penalties and interest charges. It's crucial to maintain records of all tax payments and ensure timely submission to avoid penalties. Tax.X provides payment reminders and helps you track your payment schedule."
  },
  { 
    title: "Refunds & Overpaid Taxes", 
    link: "/guidelines/refund",
    content: "If you've overpaid your taxes, you can claim a refund through a formal process. This typically occurs when your tax deductions exceed your actual tax liability. To claim a refund, submit a formal application with supporting documents including your tax returns, payment receipts, and bank details. The Inland Revenue Department will verify your claim and process the refund if approved. The process usually takes 4-6 weeks, and refunds are typically made through bank transfer. Keep all documentation related to your refund claim for at least three years. Tax.X helps you track your refund status and ensures all necessary documentation is properly submitted."
  },
  { 
    title: "Tax Compliance & Penalties", 
    link: "/guidelines/compliance",
    content: "Tax compliance is crucial to avoid penalties and legal issues. Common compliance requirements include timely filing of returns, accurate reporting of income, and proper payment of taxes. Penalties may be imposed for late filing, underreporting of income, or non-payment of taxes. These can include fines, interest charges, and in severe cases, legal action. The penalty rates vary based on the type of violation and can be substantial. It's important to maintain proper records and meet all filing deadlines. Tax.X helps you stay compliant by providing reminders, guidance, and tools to ensure accurate tax reporting and timely payments."
  }
];

export default function GuidelinesSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const navigate = useNavigate(); // Hook for navigation

  const handleItemClick = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="guidelines-page">
      <Header />
      <section className="guidelines-section">
        <div className="guidelines-container">
          <h1 className="title">Tax Guidelines</h1>
          <p className="guidelines-description">
            Navigate through our comprehensive tax guidelines designed to help you understand Sri Lanka's tax system. 
            From basic concepts to detailed procedures, these guidelines about taxation and compliance requirements.
          </p>
          <div className="guidelines-list">
            {guidelinesData.map((item, index) => (
              <div 
                key={index} 
                className="guideline-item"
              >
                <button
                  className="toggle-button"
                  onClick={() => handleItemClick(index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`content-${index}`}
                >
                  {item.title}
                  <ChevronDown 
                    className={openIndex === index ? 'rotated' : ''} 
                    aria-hidden="true"
                  />
                </button>
                {openIndex === index && (
                  <div 
                    id={`content-${index}`}
                    className="content"
                    role="region"
                    aria-label={`Content for ${item.title}`}
                  >
                    <p>{item.content}</p>
                    
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
