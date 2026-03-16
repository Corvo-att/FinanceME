/**
 * FinanceME — Transactions logic
 */

/* --- Logic for transactions.html --- */
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('transactions.html') || window.location.pathname.includes('transaction-detail.html')) {
    // Basic shared logics if any
  }
});

/* --- Logic for add-transaction.html --- */
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('add-transaction.html')) {
    const dateInput = document.getElementById("date");
    if (dateInput) {
      dateInput.valueAsDate = new Date();
    }
    
    // Type toggle logic
    const typeBtns = document.querySelectorAll(".type-btn");
    typeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        typeBtns.forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        
        // Adjust category options based on type
        const type = e.target.getAttribute("data-type");
        const categorySelect = document.getElementById("category");
        if (!categorySelect) return;

        if (type === "income") {
          categorySelect.innerHTML = `
            <option value="salary">Salary / Wages</option>
            <option value="investment">Investment Yield</option>
            <option value="refund">Refund / Reimbursement</option>
            <option value="other">Other Income</option>
          `;
        } else if (type === "transfer") {
          categorySelect.innerHTML = `
            <option value="internal">Internal Transfer</option>
            <option value="payment">Credit Card Payment</option>
            <option value="external">External Transfer</option>
          `;
        } else {
          categorySelect.innerHTML = `
            <option value="" disabled selected>Select Category</option>
            <option value="food">Food & Dining</option>
            <option value="groceries">Groceries</option>
            <option value="transportation">Transportation</option>
            <option value="shopping">Shopping</option>
            <option value="housing">Housing & Rent</option>
            <option value="utilities">Utilities</option>
          `;
        }
      });
    });
  }
});

/* --- Logic for import-transactions.html --- */
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('import-transactions.html')) {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    
    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => {
        fileInput.click();
      });

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          updateDropZoneText(e.dataTransfer.files[0].name);
        }
      });

      fileInput.addEventListener("change", () => {
        if (fileInput.files.length) {
          updateDropZoneText(fileInput.files[0].name);
        }
      });

      function updateDropZoneText(fileName) {
        const title = dropZone.querySelector(".drop-zone__title");
        const subtitle = dropZone.querySelector(".drop-zone__subtitle");
        const icon = dropZone.querySelector(".drop-zone__icon");
        
        if (title) title.textContent = "Selected File";
        if (subtitle) subtitle.textContent = fileName;
        if (icon) {
          icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>`;
        }
      }
    }
  }
});

