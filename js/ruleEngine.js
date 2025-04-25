// js/ruleEngine.js

const RuleEngine = {

    generate(generator, selectedOptions, ruleModuleStates) {
        if (!generator) return "Ошибка: Генератор не определен.";

        let output = "";
        let ruleCounter = 1;

        // 1. Введение (если включено и определено)
        const introModuleId = generator.structure?.introModuleId;
        if (introModuleId && ruleModuleStates[introModuleId] !== false && generator.ruleModules.find(m => m.id === introModuleId)) {
            const introModule = generator.ruleModules.find(m => m.id === introModuleId);
            if (this.checkConditions(introModule.conditions, selectedOptions)) {
                 output += this.formatText(introModule.textTemplate, selectedOptions, ruleModuleStates) + "\n\n";
            }
        }

        // 2. Основные правила (нумерованные)
        output += "Правила чата\n\n"; // Add title for main rules section
        const mainRuleModules = generator.ruleModules.filter(m => m.type === 'main-rule' && m.id !== introModuleId && m.id !== generator.structure?.notesModuleId);

        mainRuleModules.forEach(module => {
            // Включен ли модуль пользователем?
            if (ruleModuleStates[module.id] === false) return; // Skip if explicitly disabled

            // Выполняются ли условия для показа модуля?
            if (!this.checkConditions(module.conditions, selectedOptions)) return;

            // Форматируем текст правила
            const formattedText = this.formatText(module.textTemplate, selectedOptions, ruleModuleStates);
            // Add numbering only if the formatted text is not empty
            if (formattedText.trim()) {
                output += `${ruleCounter}. ${formattedText}\n\n`;
                ruleCounter++;
            }
        });

        // 3. Примечания/Послесловие (если включено и определено)
        const notesModuleId = generator.structure?.notesModuleId;
        if (notesModuleId && ruleModuleStates[notesModuleId] !== false && generator.ruleModules.find(m => m.id === notesModuleId)) {
             const notesModule = generator.ruleModules.find(m => m.id === notesModuleId);
             if (this.checkConditions(notesModule.conditions, selectedOptions)) {
                 // Обработка вложенных примечаний (если они есть и управляются отдельно)
                 let notesContent = "";
                 let noteCounter = 1;
                 if (notesModule.subModules) {
                     let subNotesText = "";
                     notesModule.subModules.forEach(subModule => {
                         if (ruleModuleStates[subModule.id] !== false && this.checkConditions(subModule.conditions, selectedOptions)) {
                             // Format submodule text before adding prefix
                             const formattedSubNote = this.formatText(subModule.textTemplate, selectedOptions, ruleModuleStates);
                             if (formattedSubNote.trim()) { // Only add if there's content
                                 subNotesText += `Примечание ${noteCounter}: ${formattedSubNote}\n`;
                                 noteCounter++;
                             }
                         }
                     });
                     // Use the main module's template, replacing {{subNotes}}
                     const mainNotesTemplate = notesModule.textTemplate || "{{subNotes}}"; // Default if template missing
                     notesContent = this.formatText(mainNotesTemplate, selectedOptions, ruleModuleStates)
                                        .replace(/\{\{subNotes\}\}/g, subNotesText.trim());

                 } else {
                     // If no submodules, just format the main notes template
                     notesContent = this.formatText(notesModule.textTemplate, selectedOptions, ruleModuleStates);
                 }

                 // Add the notes section only if it has content
                 if (notesContent.trim()) {
                    output += notesContent.trim() + "\n";
                 }
             }
        }

        return output.trim();
    },

    /**
     * Проверяет, выполняются ли условия для отображения модуля/опции.
     * conditions: { sectionId: [allowedValue1, allowedValue2], sectionId2: allowedValue, ... }
     * selectedOptions: { sectionId: selectedValue, sectionId2: [val1, val2], ... }
     */
    checkConditions(conditions, selectedOptions) {
        if (!conditions) return true; // No conditions means always show

        for (const sectionId in conditions) {
            const requiredValue = conditions[sectionId];
            const actualValue = selectedOptions[sectionId]; // Can be string, array, boolean, or undefined

            if (typeof requiredValue === 'boolean') {
                // Handling boolean conditions (e.g., { general: ['allow18plus', true] })
                // Check if the *actual* value (which might be an array for checkboxes)
                // contains the key part ('allow18plus') and if the required value is true,
                // OR if it *doesn't* contain the key part and the required value is false.
                const keyToCheck = sectionId; // In this structure, sectionId holds the key like 'allow18plus'
                const isPresent = Array.isArray(actualValue) ? actualValue.includes(keyToCheck) : actualValue === keyToCheck; // Simplified check

                // This logic needs refinement based on how boolean options are stored in selectedOptions.
                // Assuming checkboxes store their value in an array under the sectionId:
                // e.g., selectedOptions.general = ['allowAds', 'showModerationActions']

                // Let's refine the condition structure slightly in the generator:
                // conditions: { 'general.allow18plus': true } // Check if 'allow18plus' is in the 'general' array
                // conditions: { 'general.allow18plus': false } // Check if 'allow18plus' is NOT in the 'general' array

                const parts = sectionId.split('.');
                if (parts.length === 2) {
                    const realSectionId = parts[0];
                    const optionKey = parts[1];
                    const actualSectionValue = selectedOptions[realSectionId]; // Should be an array for checkboxes

                    if (!Array.isArray(actualSectionValue)) {
                         // If the section isn't an array (e.g., not a checkbox section), this condition type is likely wrong
                         // Or handle single-choice boolean options if necessary
                         if (requiredValue === true && actualSectionValue !== optionKey) return false;
                         if (requiredValue === false && actualSectionValue === optionKey) return false;
                         continue; // Check next condition
                    }

                    const isIncluded = actualSectionValue.includes(optionKey);

                    if (requiredValue === true && !isIncluded) {
                        return false; // Required true, but not included
                    }
                    if (requiredValue === false && isIncluded) {
                        return false; // Required false, but is included
                    }
                } else {
                     // Original logic for non-boolean conditions (string or array comparison)
                     const requiredValuesArray = Array.isArray(requiredValue) ? requiredValue : [requiredValue];

                     if (actualValue === undefined || actualValue === null) return false; // Required section not selected

                     if (Array.isArray(actualValue)) {
                         // Check intersection for multi-select actual values
                         if (!requiredValuesArray.some(req => actualValue.includes(req))) {
                             return false;
                         }
                     } else {
                         // Check inclusion for single-select actual value
                         if (!requiredValuesArray.includes(actualValue)) {
                             return false;
                         }
                     }
                }

            } else {
                 // Original logic for non-boolean conditions (string or array comparison)
                 const requiredValuesArray = Array.isArray(requiredValue) ? requiredValue : [requiredValue];

                 if (actualValue === undefined || actualValue === null) return false; // Required section not selected

                 if (Array.isArray(actualValue)) {
                     // Check intersection for multi-select actual values
                     if (!requiredValuesArray.some(req => actualValue.includes(req))) {
                         return false;
                     }
                 } else {
                     // Check inclusion for single-select actual value
                     if (!requiredValuesArray.includes(actualValue)) {
                         return false;
                     }
                 }
            }
        }
        return true; // All conditions met
    },

    /**
     * Форматирует текст шаблона, заменяя плейсхолдеры вида {{sectionId}} или {{sectionId.optionValue}}.
     * Пока простая замена, можно усложнить.
     */
    formatText(template, selectedOptions, ruleModuleStates) { // Added ruleModuleStates if needed for conditions
        if (!template) return "";
        let result = template;

        // Handle {{#if section.option}}...{{/if}} blocks
        result = result.replace(/\{\{#if (\S+?)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, conditionKey, content) => {
            // Condition check needs to be robust
            // Example: conditionKey = "general.showModerationActions"
            const parts = conditionKey.split('.');
            let conditionMet = false;
            if (parts.length === 2) {
                const sectionId = parts[0];
                const optionKey = parts[1];
                const sectionValue = selectedOptions[sectionId]; // Could be array (checkboxes) or string (buttons)

                if (Array.isArray(sectionValue)) { // Checkbox section
                    conditionMet = sectionValue.includes(optionKey);
                } else { // Button section (or other single value)
                    // Simple truthy check might suffice, or specific value check if needed
                     conditionMet = !!sectionValue; // Example: check if any option is selected in the section
                     // Or more specific: conditionMet = sectionValue === optionKey; (if checking for a specific button value)
                     // For the generator's use case, it seems to check if the *flag* exists in the array:
                     if (Array.isArray(selectedOptions[sectionId])) {
                         conditionMet = selectedOptions[sectionId].includes(optionKey);
                     } else {
                         // Fallback or error? Assume false if not an array for this type of check.
                         conditionMet = false;
                     }
                }
            } else {
                 // Handle simple boolean flags if stored directly? e.g., {{#if someFlag}}
                 conditionMet = !!selectedOptions[conditionKey];
            }

            // Recursively format the content if condition is met
            return conditionMet ? this.formatText(content, selectedOptions, ruleModuleStates) : "";
        });

        // Handle {{#case section}}...{{#when value}}...{{/when}}...{{/case}} blocks
        result = result.replace(/\{\{#case (\S+?)\}\}([\s\S]*?)\{\{\/case\}\}/g, (match, sectionId, caseContent) => {
            const actualValue = selectedOptions[sectionId];
            let renderedContent = "";
            // Find {{#when value}} blocks within the case content
            const whenRegex = /\{\{#when (\S+?)\}\}([\s\S]*?)(?=\{\{#when|\{\{\/case\}\})/g;
            let whenMatch;
            while ((whenMatch = whenRegex.exec(caseContent)) !== null) {
                const expectedValue = whenMatch[1];
                const contentWhen = whenMatch[2];
                if (actualValue === expectedValue) {
                    // Recursively format the content for the matching 'when'
                    renderedContent = this.formatText(contentWhen, selectedOptions, ruleModuleStates);
                    break; // Found the matching case, stop searching
                }
            }
            return renderedContent;
        });

        // Простая замена плейсхолдеров вида {{sectionId}}
        result = result.replace(/\{\{([^}]+)\}\}?/g, (match, key) => {
             // Avoid replacing parts of already processed blocks if syntax overlaps
             if (key.startsWith('#') || key.startsWith('/')) return match;

             const value = selectedOptions[key];
             if (value !== undefined && value !== null) {
                 // Handle potential loops if a value itself contains {{...}} - unlikely here
                 return Array.isArray(value) ? value.join(', ') : String(value);
             }
             // Check ruleModuleStates as well? Maybe not needed for simple replacement.
             // console.warn(`Placeholder {{${key}}} not found in selectedOptions.`);
             return ''; // Return empty string if placeholder not found, instead of the placeholder itself
        });

        // TODO: Добавить более сложную логику форматирования, если нужно
        // Например, подстановку конкретных текстов в зависимости от значения опции

        // Clean up extra newlines that might result from empty blocks
        result = result.replace(/\n\s*\n/g, '\n');

        return result.trim(); // Trim final result
    }
};