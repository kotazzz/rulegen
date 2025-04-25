// js/ui.js

const UI = {
    generatorSelect: document.getElementById('generator-select'),
    optionsContainer: document.getElementById('generator-options-container'),
    modulesContainer: document.getElementById('rule-modules-container'),
    rulesOutput: document.getElementById('generated-rules'),
    generateBtn: document.getElementById('generate-btn'),
    downloadBtn: document.getElementById('download-btn'),
    copyBtn: document.getElementById('copy-rules-btn'),
    presetSelect: document.getElementById('preset-select'),
    loadPresetBtn: document.getElementById('load-preset-btn'),
    savePresetNameInput: document.getElementById('save-preset-name'),
    savePresetBtn: document.getElementById('save-preset-btn'),
    importSettingsBtn: document.getElementById('import-settings-btn'),
    exportSettingsBtn: document.getElementById('export-settings-btn'),
    // New UI elements for advanced mode
    advancedModeToggle: null, // Will be created dynamically
    
    init() {
        this.populateGeneratorSelect();
        this.bindEvents();
        // Load initial generator UI
        const initialGeneratorId = this.generatorSelect.value || GeneratorRegistry.getDefaultGenerator()?.id;
        if (initialGeneratorId) {
            this.generatorSelect.value = initialGeneratorId; // Ensure dropdown reflects the initial generator
            this.renderGeneratorUI(initialGeneratorId);
        } else {
            console.warn("No generators registered or default found.");
            this.optionsContainer.innerHTML = '<p class="text-warning">Нет доступных генераторов.</p>';
        }
    },

    populateGeneratorSelect() {
        const generators = GeneratorRegistry.getAllGenerators();
        this.generatorSelect.innerHTML = ''; // Clear existing options
        generators.forEach(gen => {
            const option = document.createElement('option');
            option.value = gen.id;
            option.textContent = gen.name;
            this.generatorSelect.appendChild(option);
        });
    },

    renderGeneratorUI(generatorId) {
        const generator = GeneratorRegistry.getGenerator(generatorId);
        if (!generator) {
            console.error(`Generator with ID '${generatorId}' not found.`);
            this.optionsContainer.innerHTML = '<p class="text-danger">Ошибка: Генератор не найден.</p>';
            this.modulesContainer.innerHTML = '';
            return;
        }

        AppState.setCurrentGenerator(generatorId);
        
        // Destroy existing tooltips before rendering new elements
        this.destroyAllTooltips(); 
        
        this.renderOptions(generator);
        this.renderRuleModules(generator); // This now also calls createAdvancedRuleSettings internally
        this.updatePresetList();
        this.clearOutput();
        
        // Add advanced mode toggle only once (moved from renderRuleModules)
        // Check if advanced controls already exist, remove if so before re-rendering
        const existingAdvancedControls = this.modulesContainer.querySelector('.card.mb-3');
        if (existingAdvancedControls) {
            existingAdvancedControls.remove();
        }
        this.renderAdvancedModeControls(); // Render fresh controls based on current state
        
        // Check dependencies AFTER rendering all elements
        this.checkAndApplyDependencies();
        
        // TODO: Add visual feedback (e.g., toast) when generator UI is loaded/updated.
    },

    renderAdvancedModeControls() {
        // Container for the switch
        const advancedModeContainer = document.createElement('div');
        advancedModeContainer.className = 'card mb-3';
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body py-2';

        // Create toggle switch for advanced mode
        this.advancedModeToggle = document.createElement('div');
        this.advancedModeToggle.className = 'form-check form-switch'; // Removed mb-2

        const advancedModeCheckbox = document.createElement('input');
        advancedModeCheckbox.className = 'form-check-input';
        advancedModeCheckbox.type = 'checkbox';
        advancedModeCheckbox.id = 'advanced-mode-toggle';
        // Ensure state is read correctly, default to false if undefined
        advancedModeCheckbox.checked = AppState.selectedOptions.advancedMode === true; 

        const advancedModeLabel = document.createElement('label');
        advancedModeLabel.className = 'form-check-label';
        advancedModeLabel.htmlFor = 'advanced-mode-toggle';
        advancedModeLabel.textContent = 'Расширенный режим';

        this.advancedModeToggle.appendChild(advancedModeCheckbox);
        this.advancedModeToggle.appendChild(advancedModeLabel);

        // Event Listener for the toggle switch
        advancedModeCheckbox.addEventListener('change', (e) => {
            const isAdvanced = e.target.checked;
            AppState.selectedOptions.advancedMode = isAdvanced;

            // Toggle visibility of integrated advanced settings
            this.toggleAdvancedModeVisibility(isAdvanced);

            // Destroy and reapply tooltips/dependencies
            this.destroyAllTooltips();
            this.checkAndApplyDependencies();
        });

        cardBody.appendChild(this.advancedModeToggle);
        advancedModeContainer.appendChild(cardBody);

        // Insert the switch container at the top of the modules list
        if (this.modulesContainer.firstChild) {
            this.modulesContainer.insertBefore(advancedModeContainer, this.modulesContainer.firstChild);
        } else {
            this.modulesContainer.appendChild(advancedModeContainer);
        }

        // Apply initial visibility based on state
        this.toggleAdvancedModeVisibility(advancedModeCheckbox.checked);
    },
    
    // Метод для уничтожения всех тултипов
    destroyAllTooltips() {
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                const tooltip = bootstrap.Tooltip.getInstance(el);
                if (tooltip) {
                    tooltip.dispose();
                }
            });
        }
    },
    
    toggleAdvancedModeVisibility(isVisible) {
        // Toggle visibility of all integrated advanced settings containers
        document.querySelectorAll('.advanced-module-settings').forEach(el => {
            el.style.display = isVisible ? 'block' : 'none';
        });

        // No need to toggle .regular-modules or .advanced-settings anymore

        // Destroy tooltips as visibility changes might affect positioning/existence
        this.destroyAllTooltips();
        // Re-apply dependencies might be needed if visibility affects layout significantly
        this.checkAndApplyDependencies();
    },
    
    renderOptions(generator) {
        // Destroy tooltips before clearing
        this.destroyAllTooltips();
        this.optionsContainer.innerHTML = ''; // Clear previous options
        
        generator.sections.forEach(section => {
            const card = document.createElement('div');
            card.className = 'card shadow-sm mb-3';
            
            // Add dependsOn data attribute if present
            if (section.dependsOn) {
                card.dataset.dependsOn = JSON.stringify(section.dependsOn);
            }

            const header = document.createElement('div');
            header.className = 'card-header';
            header.innerHTML = `<i class="${section.icon || 'fas fa-cog'}"></i> ${section.title}`;
            card.appendChild(header);

            const body = document.createElement('div');
            body.className = 'card-body';

            // Adjust body padding for better fit
            if (section.type === 'single-choice-buttons') {
                body.className += ' p-2'; // Less padding for button groups
            }

            switch (section.type) {
                case 'single-choice-buttons':
                    body.appendChild(this.createButtonGroup(section));
                    break;
                case 'multi-choice-checkboxes':
                    section.options.forEach(option => {
                        body.appendChild(this.createCheckbox(section, option));
                    });
                    break;
                // Add cases for other section types (e.g., sliders, inputs)
                default:
                    body.innerHTML = `<p class="text-muted">Неизвестный тип секции: ${section.type}</p>`;
            }

            card.appendChild(body);
            this.optionsContainer.appendChild(card);
        });
    },

    createButtonGroup(section) {
        const group = document.createElement('div');
        group.className = 'btn-group w-100';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', section.title);

        // Get the current value from AppState or find the default
        let currentValue = AppState.selectedOptions[section.id];
        
        if (currentValue === undefined) {
            // If no state is saved, use default from definition
            const defaultOption = section.options.find(opt => opt.default === true);
            currentValue = defaultOption ? defaultOption.value : section.options[0]?.value;
            
            // Initialize state with default
            if (currentValue) {
                AppState.updateOption(section.id, currentValue);
            }
        }

        section.options.forEach(option => {
            const button = document.createElement('button');
            button.type = 'button';
            const isActive = currentValue === option.value;
            
            // Store the base style for later style toggling
            const baseStyle = option.style || 'btn-outline-secondary';
            button.dataset.style = baseStyle;
            
            button.className = `btn ${isActive ? baseStyle.replace('outline-', '') : baseStyle} rule-option`;
            if (isActive) button.classList.add('active');

            button.dataset.type = section.id;
            button.dataset.value = option.value;
            button.innerHTML = `<i class="${option.icon || ''}"></i> ${option.label}`;

            // Add dependsOn data attribute if present
            if (option.dependsOn) {
                button.dataset.dependsOn = JSON.stringify(option.dependsOn);
            }

            button.addEventListener('click', (e) => {
                if (!e.currentTarget.classList.contains('disabled')) {
                    this.handleOptionButtonClick(e.currentTarget, section.id);
                }
            });
            group.appendChild(button);
        });
        
        return group;
    },

    createCheckbox(section, option) {
        const div = document.createElement('div');
        div.className = 'form-check';

        const input = document.createElement('input');
        input.className = 'form-check-input rule-option-checkbox';
        input.type = 'checkbox';
        input.value = option.value;
        input.id = `check-${section.id}-${option.value}`;
        input.dataset.type = section.id;
        
        // Get array of selected values from AppState
        const sectionValues = AppState.selectedOptions[section.id] || [];
        // Set checked based on state or default
        input.checked = sectionValues.includes(option.value);
        
        // If not in state but should be checked by default, update state
        if (!sectionValues.includes(option.value) && option.checked) {
            AppState.updateMultiOption(section.id, option.value, true);
            input.checked = true;
        }

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.innerHTML = `<i class="${option.icon || ''}"></i> ${option.label}`;

        // Add dependsOn data attribute if present
        if (option.dependsOn) {
            div.dataset.dependsOn = JSON.stringify(option.dependsOn);
        }

        input.addEventListener('change', (e) => {
            if (!e.currentTarget.classList.contains('disabled')) {
                this.handleOptionCheckboxChange(e.currentTarget, section.id);
            }
        });

        div.appendChild(input);
        div.appendChild(label);
        return div;
    },

    renderRuleModules(generator) {
        this.destroyAllTooltips();
        // Clear only the modules, not the advanced switch container if it exists
        const modulesContent = this.modulesContainer.querySelectorAll('.module-container, .regular-modules, .advanced-settings'); // Select old containers too for cleanup
        modulesContent.forEach(el => el.remove());

        if (!generator.ruleModules || generator.ruleModules.length === 0) {
            const placeholder = document.createElement('p');
            placeholder.className = 'text-muted p-2';
            placeholder.textContent = 'Модули правил не определены для этого генератора.';
            this.modulesContainer.appendChild(placeholder);
            return;
        }

        // Render modules directly into the modulesContainer
        generator.ruleModules
            // .filter(m => !m.isAdvanced) // No longer filter, show all
            .forEach(module => {
                const moduleElement = this.createModuleElement(module); // Will now include advanced settings container if applicable
                this.modulesContainer.appendChild(moduleElement);
            });

        // REMOVE call to createAdvancedRuleSettings
        // Apply initial visibility for advanced settings based on current mode
        this.toggleAdvancedModeVisibility(AppState.selectedOptions.advancedMode === true);
    },
    
    createModuleElement(module) {
        const div = document.createElement('div');
        div.className = 'module-container'; // Removed form-check, added border/margin in CSS
        div.dataset.moduleId = module.id;

        // --- Checkbox and Label ---
        const checkLabelContainer = document.createElement('div');
        checkLabelContainer.className = 'form-check'; // Keep form-check structure for checkbox+label part

        const input = document.createElement('input');
        input.className = 'form-check-input rule-module-toggle';
        input.type = 'checkbox';
        input.value = module.id;
        input.id = `module-${module.id}`;

        const isEnabled = AppState.ruleModuleStates[module.id] !== undefined
            ? AppState.ruleModuleStates[module.id]
            : (module.defaultEnabled !== undefined ? module.defaultEnabled : true);
        if (AppState.ruleModuleStates[module.id] === undefined) {
            AppState.updateRuleModuleState(module.id, isEnabled);
        }
        input.checked = isEnabled;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.textContent = module.name || `Модуль: ${module.id}`;

        checkLabelContainer.appendChild(input);
        checkLabelContainer.appendChild(label);
        // Dependency icon will be added later if needed next to the label

        div.appendChild(checkLabelContainer); // Add checkbox+label part

        // --- Dependency Attribute ---
        if (module.conditions) {
            div.dataset.dependsOn = JSON.stringify(module.conditions);
        }

        // --- Event Listener for Module Toggle ---
        input.addEventListener('change', (e) => {
            AppState.updateRuleModuleState(module.id, e.target.checked);
            this.checkAndApplyDependencies();
        });

        // --- Integrated Advanced Settings (if applicable) ---
        const canHaveAdvancedSettings = module.type === 'main-rule' && module.textTemplate &&
                                       (module.textTemplate.includes('{{#if general.showModerationActions}}') || module.textTemplate.includes('{{#case strictness}}'));

        if (canHaveAdvancedSettings) {
            const advancedSettingsContainer = document.createElement('div');
            advancedSettingsContainer.className = 'advanced-module-settings';
            // Initially hidden, visibility controlled by toggleAdvancedModeVisibility
            advancedSettingsContainer.style.display = AppState.selectedOptions.advancedMode === true ? 'block' : 'none';

            const ruleSettings = AppState.selectedOptions.ruleSettings || {};
            const thisRuleSettings = ruleSettings[module.id] || {};

            // 1. Override Checkbox
            const overrideContainer = document.createElement('div');
            overrideContainer.className = 'form-check mb-2'; // Removed advanced-setting-item

            const overrideInput = document.createElement('input');
            overrideInput.className = 'form-check-input';
            overrideInput.type = 'checkbox';
            overrideInput.id = `override-${module.id}`;
            overrideInput.checked = thisRuleSettings.override === true;

            const overrideLabel = document.createElement('label');
            overrideLabel.className = 'form-check-label small'; // Make label smaller
            overrideLabel.htmlFor = overrideInput.id;
            overrideLabel.textContent = 'Переопределить глобальные настройки для этого правила';

            overrideContainer.appendChild(overrideInput);
            overrideContainer.appendChild(overrideLabel);
            advancedSettingsContainer.appendChild(overrideContainer);

            // Container for settings dependent on override
            const overrideDependentSettings = document.createElement('div');
            overrideDependentSettings.className = 'ps-3'; // Indent override-dependent settings
            overrideDependentSettings.style.display = overrideInput.checked ? 'block' : 'none';

            // 2. Show Actions Checkbox (if applicable)
            if (module.textTemplate.includes('{{#if general.showModerationActions}}')) {
                const showActionsContainer = document.createElement('div');
                showActionsContainer.className = 'form-check mb-2'; // Removed advanced-setting-item

                const showActionsInput = document.createElement('input');
                showActionsInput.className = 'form-check-input';
                showActionsInput.type = 'checkbox';
                showActionsInput.id = `show-actions-${module.id}`;
                // Default to true if override is on but showActions is undefined in state
                showActionsInput.checked = thisRuleSettings.override ? (thisRuleSettings.showActions !== false) : (AppState.selectedOptions.general?.includes('showModerationActions'));


                const showActionsLabel = document.createElement('label');
                showActionsLabel.className = 'form-check-label small';
                showActionsLabel.htmlFor = showActionsInput.id;
                showActionsLabel.textContent = 'Показывать действия модерации';

                showActionsContainer.appendChild(showActionsInput);
                showActionsContainer.appendChild(showActionsLabel);
                overrideDependentSettings.appendChild(showActionsContainer);

                 // Event for show actions toggle
                showActionsInput.addEventListener('change', e => {
                    const show = e.target.checked;
                    if (!ruleSettings[module.id]) ruleSettings[module.id] = {};
                    ruleSettings[module.id].showActions = show;
                    AppState.selectedOptions.ruleSettings = ruleSettings;

                    // Toggle strictness container based on show actions
                    const strictnessContainer = advancedSettingsContainer.querySelector('.strictness-container');
                    if (strictnessContainer) {
                        const isDisabled = !show;
                        strictnessContainer.classList.toggle('disabled-by-dependency', isDisabled);
                        strictnessContainer.querySelectorAll('button').forEach(btn => btn.disabled = isDisabled);
                    }
                    this.destroyAllTooltips(); // Destroy tooltips on change
                    this.checkAndApplyDependencies(); // Recheck dependencies
                });
            }

            // 3. Strictness Buttons (if applicable)
            if (module.textTemplate.includes('{{#case strictness}}')) {
                const strictnessContainer = document.createElement('div');
                strictnessContainer.className = 'strictness-container'; // Removed mb-2, advanced-setting-item
                // strictnessContainer.dataset.dependsOnAction = 'true'; // Dependency handled by event listener now

                const strictnessLabel = document.createElement('div');
                strictnessLabel.className = 'mb-1 small';
                strictnessLabel.textContent = 'Жесткость наказаний:';
                strictnessContainer.appendChild(strictnessLabel);

                const btnGroup = document.createElement('div');
                btnGroup.className = 'btn-group btn-group-sm w-100';

                const levels = [
                    { value: 'low', label: 'Низкая', style: 'btn-outline-success' },
                    { value: 'medium', label: 'Средняя', style: 'btn-outline-warning' },
                    { value: 'high', label: 'Высокая', style: 'btn-outline-danger' }
                ];

                // Determine current value: rule setting -> global setting -> default 'low'
                const globalStrictness = AppState.selectedOptions.strictness || 'low';
                const currentStrictnessValue = thisRuleSettings.strictness || globalStrictness;
                const showActionsCurrently = thisRuleSettings.override ? (thisRuleSettings.showActions !== false) : (AppState.selectedOptions.general?.includes('showModerationActions'));


                levels.forEach(level => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    const isActive = level.value === currentStrictnessValue;
                    btn.className = `btn ${isActive ? level.style.replace('outline-', '') : level.style}`;
                    if(isActive) btn.classList.add('active');
                    btn.textContent = level.label;
                    btn.dataset.value = level.value;
                    btn.dataset.style = level.style;
                    btn.disabled = !showActionsCurrently; // Disable if showActions is off

                    btn.addEventListener('click', e => {
                        if (btn.disabled) return;
                        const selectedStrictness = btn.dataset.value;
                        // Update UI
                        btnGroup.querySelectorAll('button').forEach(b => {
                            const style = b.dataset.style;
                            b.classList.remove('active', style.replace('outline-', ''));
                            if (!b.classList.contains(style)) b.classList.add(style);
                        });
                        btn.classList.remove(btn.dataset.style);
                        btn.classList.add('active', btn.dataset.style.replace('outline-', ''));

                        // Update state
                        if (!ruleSettings[module.id]) ruleSettings[module.id] = {};
                        ruleSettings[module.id].strictness = selectedStrictness;
                        AppState.selectedOptions.ruleSettings = ruleSettings;
                    });
                    btnGroup.appendChild(btn);
                });

                strictnessContainer.appendChild(btnGroup);
                overrideDependentSettings.appendChild(strictnessContainer);

                 // Initial disabled state for strictness
                 if (!showActionsCurrently) {
                     strictnessContainer.classList.add('disabled-by-dependency');
                 }
            }

            advancedSettingsContainer.appendChild(overrideDependentSettings);

            // Event for override toggle
            overrideInput.addEventListener('change', e => {
                const isOverride = e.target.checked;
                overrideDependentSettings.style.display = isOverride ? 'block' : 'none';

                if (!ruleSettings[module.id]) ruleSettings[module.id] = {};
                ruleSettings[module.id].override = isOverride;

                if (!isOverride) {
                    // Clear specific settings when override is turned off
                    delete ruleSettings[module.id].strictness;
                    delete ruleSettings[module.id].showActions;
                } else {
                     // When turning ON, ensure defaults are set if not present
                     const showActionsInput = advancedSettingsContainer.querySelector(`#show-actions-${module.id}`);
                     if (showActionsInput && ruleSettings[module.id].showActions === undefined) {
                         ruleSettings[module.id].showActions = true; // Default to true when enabling override
                         showActionsInput.checked = true;
                     }
                     // Strictness will default to global or 'low' if not set
                }
                AppState.selectedOptions.ruleSettings = ruleSettings;

                this.destroyAllTooltips();
                this.checkAndApplyDependencies(); // Recheck dependencies
            });


            div.appendChild(advancedSettingsContainer);
        }

        return div;
    },

    updatePresetList() {
        const presets = AppState.getPresets();
        this.presetSelect.innerHTML = '<option selected disabled>Загрузить пресет...</option>';
        for (const name in presets) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            this.presetSelect.appendChild(option);
        }
    },

    displayGeneratedRules(text) {
        this.rulesOutput.textContent = text;
        this.downloadBtn.style.display = text ? 'block' : 'none';
        this.copyBtn.style.display = text ? 'block' : 'none';
    },

    clearOutput() {
        this.rulesOutput.textContent = 'Выберите генератор и настройте параметры слева.';
        this.downloadBtn.style.display = 'none';
        this.copyBtn.style.display = 'none';
    },

    // --- Event Handlers ---
    handleGeneratorChange(event) {
        const generatorId = event.target.value;
        this.renderGeneratorUI(generatorId);
    },

    handleOptionButtonClick(button, sectionId) {
        const value = button.dataset.value;
        AppState.updateOption(sectionId, value);

        // Update button styles in the group
        const group = button.closest('.btn-group');
        group.querySelectorAll('.rule-option').forEach(btn => {
            const isCurrent = btn === button;
            // Get style from dataset
            const baseStyle = btn.dataset.style || 'btn-outline-secondary';
            
            // Reset to outline style
            btn.classList.remove('active');
            const solidStyle = baseStyle.replace('outline-', '');
            btn.classList.remove(solidStyle);
            btn.classList.add(baseStyle);
            
            // Apply active style if current
            if (isCurrent) {
                btn.classList.add('active');
                btn.classList.remove(baseStyle);
                btn.classList.add(solidStyle);
            }
        });

        // Check dependencies after state update
        this.checkAndApplyDependencies();
    },

    handleOptionCheckboxChange(checkbox, sectionId) {
        const value = checkbox.value;
        const isSelected = checkbox.checked;
        AppState.updateMultiOption(sectionId, value, isSelected);
        
        // Check dependencies after state update
        this.checkAndApplyDependencies();
    },

    handleGenerateClick() {
        // TODO: Add loading indicator while generating
        const generator = GeneratorRegistry.getGenerator(AppState.currentGeneratorId);
        if (generator) {
            // Create a DEEP COPY of options to pass to the engine, 
            // so advanced overrides don't permanently change AppState
            let optionsForGeneration = JSON.parse(JSON.stringify(AppState.selectedOptions));

            // Apply advanced settings overrides to the copy if needed
            optionsForGeneration = this.applyAdvancedSettingsOverrides(optionsForGeneration);
            
            // Generate rules using the potentially modified copy
            const rulesText = RuleEngine.generate(generator, optionsForGeneration, AppState.ruleModuleStates);
            this.displayGeneratedRules(rulesText);
        } else {
            this.displayGeneratedRules('Ошибка: Генератор не выбран или не найден.');
        }
        // TODO: Remove loading indicator
    },
    
    /**
     * Applies advanced rule settings overrides to a *copy* of the options.
     * Returns the modified options object.
     * @param {object} optionsToModify - A copy of AppState.selectedOptions.
     * @returns {object} The options object with overrides applied.
     */
    applyAdvancedSettingsOverrides(optionsToModify) {
        // Check if we're in advanced mode
        if (optionsToModify.advancedMode !== true) return optionsToModify;
        
        // Get rule settings
        const ruleSettings = optionsToModify.ruleSettings || {};
        
        // Apply per-rule overrides
        for (const ruleId in ruleSettings) {
            const settings = ruleSettings[ruleId];
            
            // If override is enabled for this rule
            if (settings.override === true) {
                // Override strictness: Use rule-specific strictness if set, otherwise keep global
                if (settings.strictness) {
                    // Store rule-specific strictness under a unique key to avoid conflict
                    // The RuleEngine's formatText needs to be aware of this pattern
                    optionsToModify[`rule_${ruleId}_strictness`] = settings.strictness; 
                }
                
                // Override showActions: Use rule-specific setting if set
                if (settings.showActions !== undefined) {
                    // Store rule-specific flag under a unique key
                    optionsToModify[`rule_${ruleId}_showActions`] = settings.showActions;
                }
            }
        }
        
        // We don't need the ruleSettings object itself during generation anymore
        // delete optionsToModify.ruleSettings; // Optional: clean up the temporary object

        return optionsToModify; // Return the modified copy
    },

    handleDownloadClick() {
        const text = this.rulesOutput.textContent;
        const generator = GeneratorRegistry.getGenerator(AppState.currentGeneratorId);
        const filename = generator ? `${generator.id}_rules.txt` : 'generated_rules.txt';
        Exporter.downloadText(text, filename);
    },

    handleCopyClick() {
        const text = this.rulesOutput.textContent;
        navigator.clipboard.writeText(text).then(() => {
            // Optional: Show temporary success message
            const originalText = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
            setTimeout(() => { this.copyBtn.innerHTML = originalText; }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Не удалось скопировать текст.');
        });
    },

    handleSavePreset() {
        const name = this.savePresetNameInput.value.trim();
        if (AppState.savePreset(name)) {
            this.savePresetNameInput.value = ''; // Clear input
            this.updatePresetList(); // Refresh dropdown
        }
    },

    handleLoadPreset() {
        const name = this.presetSelect.value;
        if (name && name !== 'Загрузить пресет...') {
            if (AppState.loadPreset(name)) {
                // Re-render UI completely to reflect loaded state
                this.renderGeneratorUI(AppState.currentGeneratorId);
                // Generate preview based on loaded settings
                this.handleGenerateClick();
                // Reset dropdown to placeholder
                this.presetSelect.selectedIndex = 0; 
                // TODO: Add visual feedback (e.g., toast) that preset was loaded.
            } else {
                // TODO: Add visual feedback (e.g., toast/alert) that loading failed.
            }
        }
    },

    handleExportSettings() {
        // TODO: Add visual feedback (e.g., toast) on successful export.
        const settings = AppState.getSettings();
        Exporter.exportSettings(settings);
    },

    handleImportSettings() {
        // TODO: Add visual feedback (e.g., toast) on successful/failed import.
        Exporter.importSettings((settings) => {
            if (AppState.loadSettings(settings)) {
                // Ensure the correct generator is selected in the dropdown
                this.generatorSelect.value = AppState.currentGeneratorId;
                // Re-render UI
                this.renderGeneratorUI(AppState.currentGeneratorId);
                // Generate preview
                this.handleGenerateClick();
            }
        });
    },

    /**
     * Checks if an element's dependencies are met.
     */
    areDependenciesMet(element) {
        if (!element.dataset.dependsOn) return true;

        try {
            const dependencies = JSON.parse(element.dataset.dependsOn);
            return RuleEngine.checkConditions(dependencies, AppState.selectedOptions);
        } catch (e) {
            console.error("Error parsing dependsOn data:", e, element.dataset.dependsOn);
            return true; // Fail open if parsing fails
        }
    },

    /**
     * Generates HTML content for the dependency tooltip.
     * @param {object} dependencies - The dependency object from data-depends-on.
     * @returns {string} HTML string for the tooltip.
     */
    getDependencyTooltipHTML(dependencies) {
        if (!dependencies) return '';
        let html = '<ul class="list-unstyled mb-0 small">';
        html += '<li>Зависит от:</li>';
        for (const key in dependencies) {
            const requiredValue = dependencies[key];
            let conditionText = '';
            if (key.includes('.')) {
                const [sectionId, optionKey] = key.split('.');
                conditionText = `Опция '<strong>${optionKey}</strong>' в секции '<strong>${sectionId}</strong>' должна быть ${requiredValue ? '<strong>включена</strong>' : '<strong>выключена</strong>'}`;
            } else {
                const sectionId = key;
                const values = Array.isArray(requiredValue) ? requiredValue.join(', ') : requiredValue;
                conditionText = `Секция '<strong>${sectionId}</strong>' должна иметь значение: <strong>${values}</strong>`;
            }
            html += `<li>- ${conditionText}</li>`;
        }
        html += '</ul>';
        return html;
    },

    /**
     * Applies dependency checks and updates UI accordingly, adding info icons with tooltips.
     */
    checkAndApplyDependencies() {
        this.destroyAllTooltips(); // Destroy first

        const elementsToCheck = [
            // Check cards first
            ...this.optionsContainer.querySelectorAll('.card[data-depends-on]'),
            // Then check modules
            ...this.modulesContainer.querySelectorAll('.module-container[data-depends-on]'),
            // Then check individual options within cards
            ...this.optionsContainer.querySelectorAll('.form-check[data-depends-on]')
        ];

        elementsToCheck.forEach(element => {
            const met = this.areDependenciesMet(element);
            // Find icon *within* the current element only
            const existingIcon = element.querySelector(':scope > .dependency-info-icon, :scope > .form-check > .dependency-info-icon, :scope > .card-header > .dependency-info-icon');
            // Determine where to put the icon (usually after label or header text)
            const targetElementForIcon = element.querySelector('label, .card-header') || element.firstChild; // Fallback

            if (!met) {
                // Dependencies NOT met
                element.classList.add('disabled-by-dependency');
                // Disable direct children inputs/buttons, but allow info icon interaction
                element.querySelectorAll(':scope > input, :scope > button, :scope > .form-check > input, :scope > .btn-group > button').forEach(el => el.disabled = true);

                // Uncheck checkboxes if dependencies are not met
                const checkbox = element.querySelector(':scope > .form-check > input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                     checkbox.checked = false;
                     if (element.matches('.module-container')) {
                         AppState.updateRuleModuleState(checkbox.value, false);
                     } else if (checkbox.classList.contains('rule-option-checkbox')) {
                         AppState.updateMultiOption(checkbox.dataset.type, checkbox.value, false);
                     }
                }

                if (!existingIcon && targetElementForIcon) {
                    const icon = document.createElement('span');
                    icon.className = 'dependency-info-icon ms-2';
                    icon.innerHTML = '<i class="fas fa-info-circle text-muted"></i>';

                    try {
                        const dependencies = JSON.parse(element.dataset.dependsOn);
                        const tooltipTitle = this.getDependencyTooltipHTML(dependencies);

                        icon.dataset.bsToggle = 'tooltip';
                        icon.dataset.bsPlacement = 'right';
                        icon.dataset.bsHtml = 'true';
                        icon.setAttribute('title', tooltipTitle);

                        // Insert the icon *after* the target (label/header)
                        targetElementForIcon.insertAdjacentElement('afterend', icon);

                    } catch (e) {
                        console.error("Error processing dependsOn data for icon:", e, element.dataset.dependsOn);
                    }
                }
            } else {
                // Dependencies ARE met
                element.classList.remove('disabled-by-dependency');
                 // Enable direct children inputs/buttons
                element.querySelectorAll(':scope > input, :scope > button, :scope > .form-check > input, :scope > .btn-group > button').forEach(el => el.disabled = false);

                if (existingIcon) {
                    // Tooltip disposal happens in destroyAllTooltips
                    existingIcon.remove();
                }
            }
        });

        // Initialize Bootstrap tooltips for any icons that were added
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('.dependency-info-icon[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                // Check if instance already exists ONLY IF destroyAllTooltips wasn't called (which it is)
                // if (!bootstrap.Tooltip.getInstance(tooltipTriggerEl)) {
                    return new bootstrap.Tooltip(tooltipTriggerEl);
                // }
                // return null;
            });
        }
    },

    bindEvents() {
        this.generatorSelect.addEventListener('change', this.handleGeneratorChange.bind(this));
        this.generateBtn.addEventListener('click', this.handleGenerateClick.bind(this));
        this.downloadBtn.addEventListener('click', this.handleDownloadClick.bind(this));
        this.copyBtn.addEventListener('click', this.handleCopyClick.bind(this));
        this.savePresetBtn.addEventListener('click', this.handleSavePreset.bind(this));
        this.loadPresetBtn.addEventListener('click', this.handleLoadPreset.bind(this));
        this.exportSettingsBtn.addEventListener('click', this.handleExportSettings.bind(this));
        this.importSettingsBtn.addEventListener('click', this.handleImportSettings.bind(this));
    }
};
