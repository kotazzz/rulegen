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

            // Форматируем текст правила, передавая ID модуля для возможной проверки переопределений
            const formattedText = this.formatText(module.textTemplate, selectedOptions, ruleModuleStates, module.id);
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
                             // Format submodule text, passing its ID
                             const formattedSubNote = this.formatText(subModule.textTemplate, selectedOptions, ruleModuleStates, subModule.id);
                             if (formattedSubNote.trim()) { // Only add if there's content
                                 subNotesText += `Примечание ${noteCounter}: ${formattedSubNote}\n`;
                                 noteCounter++;
                             }
                         }
                     });
                     // Use the main module's template, replacing {{subNotes}}
                     const mainNotesTemplate = notesModule.textTemplate || "{{subNotes}}"; // Default if template missing
                     notesContent = this.formatText(mainNotesTemplate, selectedOptions, ruleModuleStates, notesModule.id)
                                        .replace(/\{\{subNotes\}\}/g, subNotesText.trim());

                 } else {
                     // If no submodules, just format the main notes template
                     notesContent = this.formatText(notesModule.textTemplate, selectedOptions, ruleModuleStates, notesModule.id);
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
     * conditions: { sectionId: allowedValueOrArray, 'sectionId.optionKey': boolean, ... }
     * selectedOptions: { sectionId: selectedValueOrArray, ... }
     */
    checkConditions(conditions, selectedOptions) {
        if (!conditions) return true; // No conditions means always show

        for (const key in conditions) {
            const requiredValue = conditions[key];
            let conditionMet = false;

            // Check for boolean condition format 'sectionId.optionKey'
            if (key.includes('.')) {
                const parts = key.split('.');
                if (parts.length === 2) {
                    const sectionId = parts[0];
                    const optionKey = parts[1];
                    const actualSectionValue = selectedOptions[sectionId]; // Should be an array for checkboxes

                    if (Array.isArray(actualSectionValue)) {
                        const isIncluded = actualSectionValue.includes(optionKey);
                        if (requiredValue === true && isIncluded) {
                            conditionMet = true;
                        } else if (requiredValue === false && !isIncluded) {
                            conditionMet = true;
                        }
                    } else {
                        // Handle cases where the section value isn't an array (e.g., single choice button section)
                        // This type of condition ('section.option': true/false) usually makes sense for multi-choice sections.
                        // If used on a single-choice section, the logic might need adjustment based on intent.
                        // For now, assume false if the structure doesn't match expectations.
                        conditionMet = false; 
                    }
                } else {
                    // Malformed key? Treat as unmet.
                    conditionMet = false;
                }
            } else {
                // Handle standard condition format 'sectionId': valueOrArray
                const actualValue = selectedOptions[key];
                const requiredValuesArray = Array.isArray(requiredValue) ? requiredValue : [requiredValue];

                if (actualValue !== undefined && actualValue !== null) {
                    if (Array.isArray(actualValue)) {
                        // Check intersection for multi-select actual values
                        if (requiredValuesArray.some(req => actualValue.includes(req))) {
                            conditionMet = true;
                        }
                    } else {
                        // Check inclusion for single-select actual value
                        if (requiredValuesArray.includes(actualValue)) {
                            conditionMet = true;
                        }
                    }
                }
            }

            // If any condition is not met, return false immediately
            if (!conditionMet) {
                return false;
            }
        }

        return true; // All conditions met
    },

    /**
     * Форматирует текст шаблона.
     * @param {string} template - The template string.
     * @param {object} selectedOptions - The options object (potentially with overrides).
     * @param {object} ruleModuleStates - Module enabled states.
     * @param {string} [moduleId] - The ID of the current module being processed (for checking overrides).
     * @returns {string} The formatted text.
     */
    formatText(template, selectedOptions, ruleModuleStates, moduleId) { 
        if (!template) return "";
        let result = template;

        // Handle {{#if conditionKey}}...{{/if}} blocks
        // TODO: Add support for nested {{#if}} blocks if needed. Current regex is basic.
        result = result.replace(/\{\{#if (\S+?)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, conditionKey, content) => {
            let conditionMet = false;
            
            // Check for rule-specific override first (e.g., rule_moduleId_showActions)
            const overrideKeyShowActions = `rule_${moduleId}_showActions`;
            if (moduleId && selectedOptions.hasOwnProperty(overrideKeyShowActions)) {
                 // Check if the conditionKey matches the generic part (e.g., general.showModerationActions)
                 // This assumes the #if condition relates to the overridable setting.
                 // More robust mapping might be needed for complex cases.
                 if (conditionKey === 'general.showModerationActions') { // Example specific check
                     conditionMet = selectedOptions[overrideKeyShowActions] === true;
                 }
                 // Add checks for other potential overridable conditions if necessary
            } else {
                // If no specific override, check the global condition
                const parts = conditionKey.split('.');
                if (parts.length === 2) {
                    const sectionId = parts[0];
                    const optionKey = parts[1];
                    const sectionValue = selectedOptions[sectionId];
                    if (Array.isArray(sectionValue)) {
                        conditionMet = sectionValue.includes(optionKey);
                    } else {
                        // Handle non-array section values if necessary for #if
                        conditionMet = !!sectionValue; // Simple truthy check for non-arrays
                    }
                } else {
                    conditionMet = !!selectedOptions[conditionKey]; // Check direct boolean flags
                }
            }

            // Recursively format the content if condition is met
            return conditionMet ? this.formatText(content, selectedOptions, ruleModuleStates, moduleId) : "";
        });

        // Handle {{#case section}}...{{#when value}}...{{/when}}...{{/case}} blocks
        result = result.replace(/\{\{#case (\S+?)\}\}([\s\S]*?)\{\{\/case\}\}/g, (match, sectionId, caseContent) => {
            let actualValue;
            
            // Check for rule-specific override first (e.g., rule_moduleId_strictness)
            const overrideKeyStrictness = `rule_${moduleId}_strictness`;
             if (moduleId && sectionId === 'strictness' && selectedOptions.hasOwnProperty(overrideKeyStrictness)) {
                 actualValue = selectedOptions[overrideKeyStrictness];
             } else {
                 // Use global value if no override
                 actualValue = selectedOptions[sectionId];
             }

            let renderedContent = "";
            
            // Find all 'when' tags and their positions within the caseContent
            const whenMatches = [];
            const findWhenRegex = /\{\{#when (\S+?)\}\}/g;
            let regexMatch;
            while ((regexMatch = findWhenRegex.exec(caseContent)) !== null) {
                whenMatches.push({
                    value: regexMatch[1],
                    startIndex: regexMatch.index,
                    tagLength: regexMatch[0].length
                });
            }

            // Iterate through the found 'when' tags to find the one matching actualValue
            for (let i = 0; i < whenMatches.length; i++) {
                const currentMatch = whenMatches[i];

                if (actualValue === currentMatch.value) {
                    // Found the matching 'when' block
                    const contentStartIndex = currentMatch.startIndex + currentMatch.tagLength;
                    let contentEndIndex;

                    // Determine the end index: it's the start of the *next* 'when' tag,
                    // or the end of the entire caseContent if this is the last 'when' tag.
                    if (i + 1 < whenMatches.length) {
                        contentEndIndex = whenMatches[i + 1].startIndex;
                    } else {
                        contentEndIndex = caseContent.length; 
                    }

                    // Extract the content specific to this 'when' block AND TRIM IT
                    const contentWhen = caseContent.substring(contentStartIndex, contentEndIndex).trim(); // <-- Added .trim() here
                    
                    // Recursively format the extracted content
                    // Pass moduleId down for potential nested overrides (though unlikely in #when)
                    renderedContent = this.formatText(contentWhen, selectedOptions, ruleModuleStates, moduleId); 
                    break; // Stop searching once the matching case is found and processed
                }
            }
            return renderedContent; // Return the formatted content of the matched 'when' block
        });

        // Simple placeholder replacement {{key}}
        // TODO: Add error handling for non-existent keys or potentially infinite loops.
        result = result.replace(/\{\{([^}#\/]+)\}\}?/g, (match, key) => {
             // Avoid replacing parts of already processed blocks if syntax overlaps
             // key = key.trim(); // Trim whitespace just in case

             const value = selectedOptions[key];
             if (value !== undefined && value !== null) {
                 return Array.isArray(value) ? value.join(', ') : String(value);
             }
             // console.warn(`Placeholder {{${key}}} not found in selectedOptions.`);
             return ''; // Return empty string if placeholder not found
        });

        // Clean up extra newlines
        result = result.replace(/\n\s*\n/g, '\n');

        return result.trim(); 
    }
};