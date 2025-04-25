document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const rulesOutput = document.getElementById('generated-rules');
    const downloadBtn = document.getElementById('download-btn');
    const optionButtons = document.querySelectorAll('.rule-option'); // Buttons for single choice (like strictness, detail)
    const optionCheckboxes = document.querySelectorAll('.rule-option-checkbox'); // Checkboxes for multiple choices (like structure)

    let selectedOptions = {
        strictness: null, // Single value
        detail: null,     // Single value
        structure: []     // Array for multiple values
        // Add other option types here, initializing appropriately (null or [])
    };

    // --- Helper function to update button styles ---
    function updateButtonStyles(button) {
        const type = button.dataset.type;
        const value = button.dataset.value;

        // Reset styles for other buttons in the same group
        document.querySelectorAll(`.rule-option[data-type="${type}"]`).forEach(btn => {
            if (btn !== button) { // Only reset buttons that are not the currently clicked one
                btn.classList.remove('active');
                // Find both outline and solid color classes associated with bootstrap colors
                const btnClasses = Array.from(btn.classList);
                const outlineClass = btnClasses.find(cls => cls.startsWith('btn-outline-'));
                const colorClass = outlineClass ? outlineClass.replace('outline-', '') : btnClasses.find(cls => cls.startsWith('btn-') && !cls.includes('outline') && cls !== 'btn' && cls !== 'active'); // Find solid color class if no outline

                if (colorClass && btn.classList.contains(colorClass)) {
                    btn.classList.remove(colorClass); // Remove solid color
                }
                if (outlineClass && !btn.classList.contains(outlineClass)) {
                    btn.classList.add(outlineClass); // Add outline back if it should have one
                }
            }
        });

        // Apply active style to the clicked button
        button.classList.add('active');
        const outlineClass = Array.from(button.classList).find(cls => cls.startsWith('btn-outline-'));
        if (outlineClass) {
            button.classList.remove(outlineClass);
            button.classList.add(outlineClass.replace('outline-', '')); // Add solid color
        }
    }

    // --- Initialize default selections based on HTML ---
    optionButtons.forEach(button => {
        // If a button should be pre-selected by default, add 'active' class in HTML
        // and update its style here, or set the default in selectedOptions
        // Example: Pre-select 'medium' strictness if desired
        // if (button.dataset.type === 'strictness' && button.dataset.value === 'medium') {
        //     updateButtonStyles(button);
        //     selectedOptions.strictness = 'medium';
        // }
    });

     optionCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const type = checkbox.dataset.type;
            if (!selectedOptions[type]) {
                selectedOptions[type] = []; // Ensure array exists
            }
            if (!selectedOptions[type].includes(checkbox.value)) {
                 selectedOptions[type].push(checkbox.value);
            }
        }
    });
    console.log('Initial options:', selectedOptions);


    // --- Event Listeners ---

    // Handle clicks on single-choice option buttons
    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            const value = button.dataset.value;

            updateButtonStyles(button); // Update visual style

            selectedOptions[type] = value; // Store the single selected value
            console.log('Selected options:', selectedOptions);
        });
    });

    // Handle changes on multi-choice option checkboxes
    optionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const type = checkbox.dataset.type;
            const value = checkbox.value;

            if (!selectedOptions[type]) {
                selectedOptions[type] = []; // Ensure the array exists
            }

            if (checkbox.checked) {
                // Add value to the array if it's not already there
                if (!selectedOptions[type].includes(value)) {
                    selectedOptions[type].push(value);
                }
            } else {
                // Remove value from the array
                selectedOptions[type] = selectedOptions[type].filter(item => item !== value);
            }
            console.log('Selected options:', selectedOptions);
        });
    });


    // Handle "Generate" button click
    generateBtn.addEventListener('click', () => {
        // --- Replace this with your actual rule generation logic ---
        let generatedText = `--- Сгенерированные Правила ---

`;
        generatedText += `**Настройки:**
`;
        generatedText += `- Жесткость: ${selectedOptions.strictness || 'не выбрана'}
`;
        generatedText += `- Подробность: ${selectedOptions.detail || 'не выбрана'}
`;
        generatedText += `- Структура: ${selectedOptions.structure && selectedOptions.structure.length > 0 ? selectedOptions.structure.join(', ') : 'не выбраны элементы'}
`;
        // Add generation logic based on other selectedOptions

        generatedText += `
**Разделы Правил (Пример):**

`;

        // Example: Conditionally include sections based on 'structure' options
        if (selectedOptions.structure?.includes('intro')) {
            generatedText += `*Раздел: Введение*
`;
            generatedText += `   Это вводная часть правил...

`;
        }
         if (selectedOptions.structure?.includes('definitions')) {
            generatedText += `*Раздел: Определения Терминов*
`;
            generatedText += `   Термин 1: ...
`;
            generatedText += `   Термин 2: ...

`;
        }
        if (selectedOptions.structure?.includes('general')) {
            generatedText += `*Раздел: Общие Положения*
`;
            generatedText += `   Правило 1.1: ...
`;
            generatedText += `   Правило 1.2: ...

`;
        }
         if (selectedOptions.structure?.includes('penalties')) {
            generatedText += `*Раздел: Ответственность и Наказания*
`;
            generatedText += `   Нарушение X карается Y...

`;
        }
        if (selectedOptions.structure?.includes('appeals')) {
            generatedText += `*Раздел: Порядок Обжалования*
`;
            generatedText += `   Апелляции подаются в течение Z дней...

`;
        }

        generatedText += `
--- Конец Правил ---`;
        // --- End of generation logic ---


        rulesOutput.textContent = generatedText;
        downloadBtn.style.display = 'block'; // Show download button (use block for d-grid)
    });

    // Handle "Download" button click
    downloadBtn.addEventListener('click', () => {
        const textToSave = rulesOutput.textContent;
        const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' }); // Specify UTF-8
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_rules.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

});
