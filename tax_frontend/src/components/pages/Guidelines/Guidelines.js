import { useState } from "react";
import { ChevronRight } from "lucide-react"; // Importing right arrow from 'lucide-react'
import { useNavigate } from "react-router-dom"; // Import React Router's useNavigate hook
import Button from "../../common/Button/Button"; // Import your Button component
import "./Guidelines.css"; // CSS for this component

const guidelinesData = [
  { title: "How Tax.X Helps Individuals", link: "/guidelines/help" },
  { title: "Taxpayer Identification Number (TIN) Registration", link: "/guidelines/tin_registration" },
  { title: "Types of Taxes for Individuals in Sri Lanka",link: "/guidelines/tax-registration" },
  { title: "Tax Rates & Income Slabs for Individuals",  link: "/guidelines/tax_rates" },
  { title: "How to Calculate Your Tax", link: "/guidelines/calculations" },
  { title: "Tax Deductions & Exemptions for Individuals", link: "/guidelines/deductions" },
  { title: "Tax Filing Process for Individuals", link: "/guidelines/tax_filling" },
  { title: "Tax Payment & Due Dates", link: "/guidelines/due_dates" },
  { title: "Refunds & Overpaid Taxes", link: "/guidelines/refund" },
  { title: "Tax Compliance & Penalties", link: "/guidelines/compliance" }
];

export default function GuidelinesSection() {
  const [openIndex] = useState(null);
  const navigate = useNavigate(); // Hook for navigation

  const handleArrowClick = (link) => {
    // Navigate to the specified link when the right arrow is clicked
    navigate(link);
  };

  return (
    <div className="guidelines-section">
      <h2 className="title">Tax Guidelines</h2>
      <div className="guidelines-list">
        {guidelinesData.map((item, index) => (
          <div key={index} className="guideline-item">
            <button
              className="toggle-button"
              onClick={() => handleArrowClick(item.link)} // Navigate to the link when the arrow is clicked
            >
              {item.title}
              <ChevronRight /> {/* Display the right arrow */}
            </button>
            {/* Optional content if needed for expanded view */}
            {openIndex === index && (
              <div className="content">
                <p>{item.content}</p>
                <Button className="read-more-button">
                  <a href={item.link}>Read More</a>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
