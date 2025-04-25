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
        // TODO: Apply default state from generator definition
        // TODO: Apply loaded preset/settings state if applicable
    },

    renderOptions(generator) {
        this.optionsContainer.innerHTML = ''; // Clear previous options
        generator.sections.forEach(section => {
            const card = document.createElement('div');
            card.className = 'card shadow-sm';
            // Optional: Add dependsOn check here to hide/disable the whole card

            const header = document.createElement('div');
            header.className = 'card-header';
            header.innerHTML = `<i class="${section.icon || 'fas fa-cog'}"></i> ${section.title}`;
            card.appendChild(header);

            const body = document.createElement('div');
            body.className = 'card-body';

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
        // TODO: Initialize UI elements based on AppState.selectedOptions
        // TODO: Apply dependsOn logic to individual elements
    },

    createButtonGroup(section) {
        const group = document.createElement('div');
        group.className = 'btn-group w-100';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', section.title);

        section.options.forEach(option => {
            const button = document.createElement('button');
            button.type = 'button';
            // Determine initial style based on state or default
            const isActive = AppState.selectedOptions[section.id] === option.value; // Simplified
            button.className = `btn ${isActive ? option.style.replace('outline-', '') : option.style || 'btn-outline-secondary'} rule-option`;
            if (isActive) button.classList.add('active');

            button.dataset.type = section.id; // Use section ID as type
            button.dataset.value = option.value;
            button.innerHTML = `<i class="${option.icon || ''}"></i> ${option.label}`;

            // Add dependsOn data attributes if present
            // if (option.dependsOn) { ... }

            button.addEventListener('click', (e) => {
                this.handleOptionButtonClick(e.currentTarget, section.id);
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
        // Determine initial state
        input.checked = AppState.selectedOptions[section.id]?.includes(option.value) ?? option.checked ?? false;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.innerHTML = `<i class="${option.icon || ''}"></i> ${option.label}`;

         // Add dependsOn data attributes if present
         // if (option.dependsOn) { ... }

        input.addEventListener('change', (e) => {
            this.handleOptionCheckboxChange(e.currentTarget, section.id);
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

        generator.ruleModules.forEach(module => {
            const div = document.createElement('div');
            div.className = 'form-check';

            const input = document.createElement('input');
            input.className = 'form-check-input rule-module-toggle';
            input.type = 'checkbox';
            input.value = module.id;
            input.id = `module-${module.id}`;
            // Determine initial state
            input.checked = AppState.ruleModuleStates[module.id] ?? module.defaultEnabled ?? true;
            AppState.updateRuleModuleState(module.id, input.checked); // Initialize state if needed

            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = input.id;
            label.textContent = module.name || `Модуль: ${module.id}`;

            // Add dependsOn data attributes if present
            // if (module.dependsOn) { ... }

            input.addEventListener('change', (e) => {
                AppState.updateRuleModuleState(module.id, e.target.checked);
                // Optionally trigger preview update or dependency check
            });

            div.appendChild(input);
            div.appendChild(label);
            this.modulesContainer.appendChild(div);
        });
        // TODO: Apply dependsOn logic
    },

    updatePresetList() {
        const presets = AppState.getPresets(); // Assuming this loads/returns presets
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
            const baseStyle = btn.dataset.style || 'btn-outline-secondary'; // Need to store base style
            btn.classList.remove('active', baseStyle.replace('outline-', ''));
            btn.classList.add(isCurrent ? baseStyle.replace('outline-', '') : baseStyle);
            if (isCurrent) btn.classList.add('active');
        });

        // TODO: Check dependencies
    },

    handleOptionCheckboxChange(checkbox, sectionId) {
        const value = checkbox.value;
        const isSelected = checkbox.checked;
        AppState.updateMultiOption(sectionId, value, isSelected);
        // TODO: Check dependencies
    },

    handleGenerateClick() {
        const generator = GeneratorRegistry.getGenerator(AppState.currentGeneratorId);
        if (generator) {
            const rulesText = RuleEngine.generate(generator, AppState.selectedOptions, AppState.ruleModuleStates);
            this.displayGeneratedRules(rulesText);
        } else {
            this.displayGeneratedRules('Ошибка: Генератор не выбран или не найден.');
        }
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
            }
        });
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

        // Note: Event listeners for dynamically created options/modules are added during rendering
    }
};
