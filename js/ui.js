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
    hideAdvancedBtn: null, // Will be created dynamically
    
    init() {
        this.populateGeneratorSelect();
        this.bindEvents();
        // Load initial generator UI
        const initialGeneratorId = this.generatorSelect.value;
        if (initialGeneratorId) {
            this.renderGeneratorUI(initialGeneratorId);
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
        this.renderOptions(generator);
        this.renderRuleModules(generator);
        this.updatePresetList();
        this.clearOutput();
        
        // Add advanced mode toggle only once (moved from renderRuleModules)
        this.renderAdvancedModeControls();
        
        // Check dependencies AFTER rendering all elements
        this.checkAndApplyDependencies();
    },

    renderAdvancedModeControls() {
        // Add advanced mode toggle at the top of the modules container
        const advancedModeContainer = document.createElement('div');
        advancedModeContainer.className = 'card mb-3';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body py-2'; // Smaller padding
        
        // Create toggle for advanced mode
        this.advancedModeToggle = document.createElement('div');
        this.advancedModeToggle.className = 'form-check form-switch mb-2';
        
        const advancedModeCheckbox = document.createElement('input');
        advancedModeCheckbox.className = 'form-check-input';
        advancedModeCheckbox.type = 'checkbox';
        advancedModeCheckbox.id = 'advanced-mode-toggle';
        advancedModeCheckbox.checked = AppState.selectedOptions.advancedMode === true;
        
        const advancedModeLabel = document.createElement('label');
        advancedModeLabel.className = 'form-check-label';
        advancedModeLabel.htmlFor = 'advanced-mode-toggle';
        advancedModeLabel.textContent = 'Расширенный режим';
        
        this.advancedModeToggle.appendChild(advancedModeCheckbox);
        this.advancedModeToggle.appendChild(advancedModeLabel);
        
        // Create button to show/hide advanced settings
        this.hideAdvancedBtn = document.createElement('button');
        this.hideAdvancedBtn.className = 'btn btn-sm btn-outline-secondary w-100';
        this.hideAdvancedBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Скрыть дополнительные настройки';
        this.hideAdvancedBtn.style.display = advancedModeCheckbox.checked ? 'block' : 'none';
        
        // Events
        advancedModeCheckbox.addEventListener('change', (e) => {
            const isAdvanced = e.target.checked;
            AppState.selectedOptions.advancedMode = isAdvanced;
            
            // Show/hide per-rule settings
            this.toggleAdvancedModeVisibility(isAdvanced);
            
            // Show/hide hide button
            this.hideAdvancedBtn.style.display = isAdvanced ? 'block' : 'none';
            
            // Уничтожаем все тултипы при переключении режима
            this.destroyAllTooltips();
        });
        
        this.hideAdvancedBtn.addEventListener('click', () => {
            const btn = this.hideAdvancedBtn;
            const isHidden = btn.dataset.hidden === 'true';
            
            this.toggleAdvancedSettingsVisibility(!isHidden);
            
            // Update button text
            btn.innerHTML = isHidden ? 
                '<i class="fas fa-eye-slash"></i> Скрыть дополнительные настройки' : 
                '<i class="fas fa-eye"></i> Показать дополнительные настройки';
            btn.dataset.hidden = isHidden ? 'false' : 'true';
            
            // Уничтожаем все тултипы при изменении видимости
            this.destroyAllTooltips();
        });
        
        cardBody.appendChild(this.advancedModeToggle);
        cardBody.appendChild(this.hideAdvancedBtn);
        advancedModeContainer.appendChild(cardBody);
        
        // Insert at the top of the modules container
        if (this.modulesContainer.firstChild) {
            this.modulesContainer.insertBefore(advancedModeContainer, this.modulesContainer.firstChild);
        } else {
            this.modulesContainer.appendChild(advancedModeContainer);
        }
        
        // Initial state
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
        // Show/hide all advanced settings containers
        document.querySelectorAll('.advanced-settings').forEach(el => {
            el.style.display = isVisible ? 'block' : 'none';
        });
        
        // Show/hide regular modules based on advanced mode
        document.querySelectorAll('.regular-modules').forEach(el => {
            el.style.display = isVisible ? 'none' : 'block';
        });
        
        // Make sure all tooltips are destroyed when switching modes
        this.destroyAllTooltips();
    },
    
    toggleAdvancedSettingsVisibility(isVisible) {
        // Show/hide individual advanced settings within containers
        document.querySelectorAll('.advanced-setting-item').forEach(el => {
            el.style.display = isVisible ? 'block' : 'none';
        });
    },
    
    renderOptions(generator) {
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
        this.modulesContainer.innerHTML = ''; // Clear previous modules
        if (!generator.ruleModules || generator.ruleModules.length === 0) {
            this.modulesContainer.innerHTML = '<p class="text-muted">Модули правил не определены для этого генератора.</p>';
            return;
        }

        // Create container for regular modules
        const mainModulesContainer = document.createElement('div');
        mainModulesContainer.className = 'regular-modules mb-3 border rounded p-2';
        
        const mainModulesTitle = document.createElement('div');
        mainModulesTitle.className = 'mb-2 fw-bold';
        mainModulesTitle.textContent = 'Основные Модули';
        mainModulesContainer.appendChild(mainModulesTitle);

        // Render regular modules - removed duplicate call to renderAdvancedModeControls
        generator.ruleModules.filter(m => !m.isAdvanced).forEach(module => {
            const moduleElement = this.createModuleElement(module);
            mainModulesContainer.appendChild(moduleElement);
        });
        
        this.modulesContainer.appendChild(mainModulesContainer);

        // Initialize advanced settings containers for each rule that supports it
        this.createAdvancedRuleSettings(generator);
    },
    
    createModuleElement(module) {
        const div = document.createElement('div');
        div.className = 'form-check module-container';
        div.dataset.moduleId = module.id;

        const input = document.createElement('input');
        input.className = 'form-check-input rule-module-toggle';
        input.type = 'checkbox';
        input.value = module.id;
        input.id = `module-${module.id}`;

        // Get state from AppState or use default
        const isEnabled = AppState.ruleModuleStates[module.id] !== undefined 
            ? AppState.ruleModuleStates[module.id] 
            : (module.defaultEnabled !== undefined ? module.defaultEnabled : true);
        
        // Update AppState if needed
        if (AppState.ruleModuleStates[module.id] === undefined) {
            AppState.updateRuleModuleState(module.id, isEnabled);
        }
        
        input.checked = isEnabled;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.textContent = module.name || `Модуль: ${module.id}`;

        // Add tooltip with dependency info
        if (module.conditions) {
            let tooltip = '';
            for (const key in module.conditions) {
                if (key.includes('.')) {
                    const [section, option] = key.split('.');
                    tooltip += `Зависит от: "${option}" в разделе "${section}"\n`;
                }
            }
            if (tooltip) {
                label.title = tooltip;
                label.dataset.bsToggle = 'tooltip';
                label.dataset.bsPlacement = 'right';
            }
        }

        // Add dependsOn attribute for dependency checking
        if (module.conditions) {
            div.dataset.dependsOn = JSON.stringify(module.conditions);
        }

        input.addEventListener('change', (e) => {
            AppState.updateRuleModuleState(module.id, e.target.checked);
            // Check dependencies after state change
            this.checkAndApplyDependencies();
        });

        div.appendChild(input);
        div.appendChild(label);
        return div;
    },
    
    createAdvancedRuleSettings(generator) {
        // Create container for advanced settings (initially hidden)
        const advancedContainer = document.createElement('div');
        advancedContainer.className = 'advanced-settings mt-3 border rounded p-2';
        advancedContainer.style.display = AppState.selectedOptions.advancedMode === true ? 'block' : 'none';
        
        const advancedTitle = document.createElement('div');
        advancedTitle.className = 'mb-2 fw-bold';
        advancedTitle.textContent = 'Расширенные Настройки Правил';
        advancedContainer.appendChild(advancedTitle);
        
        // Add advanced settings for each main rule
        const mainRules = generator.ruleModules.filter(m => 
            m.type === 'main-rule' && 
            m.textTemplate && 
            m.textTemplate.includes('{{#if general.showModerationActions}}')
        );
        
        if (mainRules.length === 0) {
            const noSettings = document.createElement('div');
            noSettings.className = 'text-muted small';
            noSettings.textContent = 'Нет правил с расширенными настройками';
            advancedContainer.appendChild(noSettings);
        } else {
            mainRules.forEach(rule => {
                const ruleSettings = this.createRuleAdvancedSettings(rule);
                advancedContainer.appendChild(ruleSettings);
            });
        }
        
        this.modulesContainer.appendChild(advancedContainer);
    },
    
    createRuleAdvancedSettings(rule) {
        // Create container for this rule's settings
        const container = document.createElement('div');
        container.className = 'rule-advanced-settings mb-2 pb-2 border-bottom';
        container.dataset.ruleId = rule.id;
        
        // Rule title
        const title = document.createElement('div');
        title.className = 'mb-1 fw-bold';
        title.textContent = rule.name;
        container.appendChild(title);
        
        // Override global settings option
        const overrideContainer = document.createElement('div');
        overrideContainer.className = 'form-check mb-2 advanced-setting-item';
        
        const overrideInput = document.createElement('input');
        overrideInput.className = 'form-check-input';
        overrideInput.type = 'checkbox';
        overrideInput.id = `override-${rule.id}`;
        
        // Get state from AppState or initialize
        const ruleSettings = AppState.selectedOptions.ruleSettings || {};
        const thisRuleSettings = ruleSettings[rule.id] || {};
        
        overrideInput.checked = thisRuleSettings.override === true;
        
        const overrideLabel = document.createElement('label');
        overrideLabel.className = 'form-check-label';
        overrideLabel.htmlFor = overrideInput.id;
        overrideLabel.textContent = 'Переопределить глобальные настройки';
        
        overrideContainer.appendChild(overrideInput);
        overrideContainer.appendChild(overrideLabel);
        container.appendChild(overrideContainer);
        
        // Settings that become visible when override is checked
        const settingsContainer = document.createElement('div');
        settingsContainer.className = 'ps-4 advanced-settings-detail';
        settingsContainer.style.display = overrideInput.checked ? 'block' : 'none';
        
        // 1. Show moderation actions checkbox
        const showActions = document.createElement('div');
        showActions.className = 'form-check mb-2 advanced-setting-item';
        
        const showActionsInput = document.createElement('input');
        showActionsInput.className = 'form-check-input';
        showActionsInput.type = 'checkbox';
        showActionsInput.id = `show-actions-${rule.id}`;
        showActionsInput.checked = thisRuleSettings.showActions !== false; // Default to true
        
        const showActionsLabel = document.createElement('label');
        showActionsLabel.className = 'form-check-label';
        showActionsLabel.htmlFor = showActionsInput.id;
        showActionsLabel.textContent = 'Показывать действия модерации';
        
        showActions.appendChild(showActionsInput);
        showActions.appendChild(showActionsLabel);
        settingsContainer.appendChild(showActions);
        
        // 2. Strictness settings (if rule uses strictness levels)
        if (rule.textTemplate.includes('{{#case strictness}}')) {
            const strictnessContainer = document.createElement('div');
            strictnessContainer.className = 'mb-2 advanced-setting-item strictness-container';
            strictnessContainer.dataset.dependsOnAction = 'true'; // Маркер зависимости от showActions
            
            const strictnessLabel = document.createElement('div');
            strictnessLabel.className = 'mb-1 small';
            strictnessLabel.textContent = 'Жесткость наказаний:';
            strictnessContainer.appendChild(strictnessLabel);
            
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group btn-group-sm w-100';
            
            // Add buttons for each strictness level
            const levels = [
                { value: 'low', label: 'Низкая', style: 'btn-outline-success' },
                { value: 'medium', label: 'Средняя', style: 'btn-outline-warning' },
                { value: 'high', label: 'Высокая', style: 'btn-outline-danger' }
            ];
            
            // Current value from settings or global default
            const currentValue = thisRuleSettings.strictness || AppState.selectedOptions.strictness || 'low';
            
            levels.forEach(level => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `btn ${level.value === currentValue ? level.style.replace('outline-', '') : level.style}`;
                btn.textContent = level.label;
                btn.dataset.value = level.value;
                btn.dataset.style = level.style;
                
                if (level.value === currentValue) {
                    btn.classList.add('active');
                }
                
                btn.addEventListener('click', e => {
                    // Update UI
                    btnGroup.querySelectorAll('button').forEach(b => {
                        const style = b.dataset.style;
                        b.classList.remove('active', style.replace('outline-', ''));
                        b.classList.add(style);
                    });
                    
                    btn.classList.remove(btn.dataset.style);
                    btn.classList.add('active', btn.dataset.style.replace('outline-', ''));
                    
                    // Update state
                    if (!ruleSettings[rule.id]) ruleSettings[rule.id] = {};
                    ruleSettings[rule.id].strictness = btn.dataset.value;
                    AppState.selectedOptions.ruleSettings = ruleSettings;
                });
                
                btnGroup.appendChild(btn);
            });
            
            strictnessContainer.appendChild(btnGroup);
            settingsContainer.appendChild(strictnessContainer);
            
            // Disable strictness if actions not shown
            if (!showActionsInput.checked) {
                strictnessContainer.classList.add('disabled-by-dependency');
                strictnessContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
            }
        }
        
        // Event for override toggle
        overrideInput.addEventListener('change', e => {
            const isOverride = e.target.checked;
            settingsContainer.style.display = isOverride ? 'block' : 'none';
            
            // Update state
            if (!ruleSettings[rule.id]) ruleSettings[rule.id] = {};
            ruleSettings[rule.id].override = isOverride;
            AppState.selectedOptions.ruleSettings = ruleSettings;
            
            // If turning off override, remove custom settings
            if (!isOverride) {
                delete ruleSettings[rule.id].strictness;
                delete ruleSettings[rule.id].showActions;
            }
            
            // Уничтожаем тултипы при изменении видимости
            this.destroyAllTooltips();
        });
        
        // Event for show actions toggle
        showActionsInput.addEventListener('change', e => {
            const showActions = e.target.checked;
            
            // Update state
            if (!ruleSettings[rule.id]) ruleSettings[rule.id] = {};
            ruleSettings[rule.id].showActions = showActions;
            AppState.selectedOptions.ruleSettings = ruleSettings;
            
            // Toggle strictness container based on show actions
            const strictnessContainer = settingsContainer.querySelector('.strictness-container');
            if (strictnessContainer) {
                if (showActions) {
                    strictnessContainer.classList.remove('disabled-by-dependency');
                    strictnessContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
                } else {
                    strictnessContainer.classList.add('disabled-by-dependency');
                    strictnessContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
                }
            }
            
            // Уничтожаем тултипы при изменении состояния
            this.destroyAllTooltips();
        });
        
        container.appendChild(settingsContainer);
        return container;
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
        const generator = GeneratorRegistry.getGenerator(AppState.currentGeneratorId);
        if (generator) {
            // Apply advanced settings overrides if needed
            this.applyAdvancedSettingsOverrides();
            
            // Generate rules
            const rulesText = RuleEngine.generate(generator, AppState.selectedOptions, AppState.ruleModuleStates);
            this.displayGeneratedRules(rulesText);
        } else {
            this.displayGeneratedRules('Ошибка: Генератор не выбран или не найден.');
        }
    },
    
    applyAdvancedSettingsOverrides() {
        // Check if we're in advanced mode
        if (AppState.selectedOptions.advancedMode !== true) return;
        
        // Get rule settings
        const ruleSettings = AppState.selectedOptions.ruleSettings || {};
        
        // Create temporary copy of options for rule generation
        const tempOptions = JSON.parse(JSON.stringify(AppState.selectedOptions));
        
        // Apply per-rule overrides to temporary options
        for (const ruleId in ruleSettings) {
            const settings = ruleSettings[ruleId];
            
            // If override is enabled, add rule-specific options
            if (settings.override === true) {
                // Set rule-specific strictness
                if (settings.strictness) {
                    tempOptions[`rule_${ruleId}_strictness`] = settings.strictness;
                }
                
                // Set rule-specific show actions flag
                if (settings.showActions !== undefined) {
                    if (settings.showActions) {
                        if (!tempOptions[`rule_${ruleId}_options`]) {
                            tempOptions[`rule_${ruleId}_options`] = [];
                        }
                        tempOptions[`rule_${ruleId}_options`].push('showActions');
                    }
                }
            }
        }
        
        // Replace options with temp options including overrides
        AppState.selectedOptions = tempOptions;
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
            }
        }
    },

    handleExportSettings() {
        const settings = AppState.getSettings();
        Exporter.exportSettings(settings);
    },

    handleImportSettings() {
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
     * Applies dependency checks and updates UI accordingly.
     */
    checkAndApplyDependencies() {
        // Check section cards with dependencies
        this.optionsContainer.querySelectorAll('.card[data-depends-on]').forEach(card => {
            const met = this.areDependenciesMet(card);
            
            // Add tooltip with dependency info
            if (!met && !card.dataset.bsToggle) {
                card.dataset.bsToggle = 'tooltip';
                card.dataset.bsPlacement = 'top';
                card.title = 'Эта настройка зависит от другой опции, которая отключена';
            }
            
            // Apply disabled style to entire card
            card.classList.toggle('disabled-by-dependency', !met);
            
            // Disable all inputs and buttons
            card.querySelectorAll('input, button').forEach(el => {
                el.disabled = !met;
            });
        });

        // Check module dependencies
        this.modulesContainer.querySelectorAll('.module-container[data-depends-on]').forEach(div => {
            const met = this.areDependenciesMet(div);
            div.classList.toggle('disabled-by-dependency', !met);
            
            // Add tooltip explaining dependency
            if (!met && !div.dataset.bsToggle) {
                div.dataset.bsToggle = 'tooltip';
                div.dataset.bsPlacement = 'top';
                div.title = 'Этот модуль зависит от отключенной опции';
            }
            
            // Disable checkbox
            const checkbox = div.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.disabled = !met;
                
                // If dependencies not met, uncheck and update state
                if (!met && checkbox.checked) {
                    checkbox.checked = false;
                    AppState.updateRuleModuleState(checkbox.value, false);
                }
            }
        });

        // Check option-level dependencies
        this.optionsContainer.querySelectorAll('.form-check[data-depends-on]').forEach(check => {
            const met = this.areDependenciesMet(check);
            check.classList.toggle('disabled-by-dependency', !met);
            
            // Disable checkbox
            const checkbox = check.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.disabled = !met;
                
                // If dependencies not met, uncheck and update state
                if (!met && checkbox.checked) {
                    checkbox.checked = false;
                    AppState.updateMultiOption(checkbox.dataset.type, checkbox.value, false);
                }
            }
        });
        
        // Перед инициализацией новых тултипов уничтожаем существующие
        this.destroyAllTooltips();
        
        // Initialize Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
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
