// js/state.js

const AppState = {
    currentGeneratorId: null,
    selectedOptions: {},
    ruleModuleStates: {},
    presets: {},

    setCurrentGenerator(generatorId) {
        this.currentGeneratorId = generatorId;
        const generator = GeneratorRegistry.getGenerator(generatorId);
        
        if (generator) {
            // Initialize options with defaults from generator definitions
            this.initializeOptionsFromGenerator(generator);
            this.initializeModulesFromGenerator(generator);
        } else {
            // Reset options when generator changes
            this.selectedOptions = {}; 
            this.ruleModuleStates = {};
        }
        
        console.log(`Current generator set to: ${generatorId}`);
    },

    // New method to initialize options from generator defaults
    initializeOptionsFromGenerator(generator) {
        // Start with a clean slate
        this.selectedOptions = {};
        
        // Initialize each section's options
        if (generator.sections) {
            generator.sections.forEach(section => {
                switch(section.type) {
                    case 'single-choice-buttons':
                        // For single-choice options, find default or use first
                        const defaultButtonOption = section.options.find(opt => opt.default);
                        if (defaultButtonOption) {
                            this.selectedOptions[section.id] = defaultButtonOption.value;
                        } else if (section.options.length > 0) {
                            this.selectedOptions[section.id] = section.options[0].value;
                        }
                        break;
                        
                    case 'multi-choice-checkboxes':
                        // For checkboxes, initialize an array with all checked options
                        this.selectedOptions[section.id] = [];
                        section.options.forEach(opt => {
                            if (opt.checked) {
                                this.selectedOptions[section.id].push(opt.value);
                            }
                        });
                        break;
                        
                    // Add cases for other section types
                }
            });
        }
        
        console.log('Options initialized from generator defaults:', this.selectedOptions);
    },
    
    // New method to initialize module states from generator defaults
    initializeModulesFromGenerator(generator) {
        this.ruleModuleStates = {};
        
        if (generator.ruleModules) {
            generator.ruleModules.forEach(module => {
                // Set default state from module definition
                this.ruleModuleStates[module.id] = module.defaultEnabled !== undefined ? module.defaultEnabled : true;
                
                // Also handle sub-modules if present
                if (module.subModules) {
                    module.subModules.forEach(subModule => {
                        this.ruleModuleStates[subModule.id] = subModule.defaultEnabled !== undefined ? subModule.defaultEnabled : true;
                    });
                }
            });
        }
        
        console.log('Module states initialized from generator defaults:', this.ruleModuleStates);
    },

    updateOption(sectionId, optionValue) {
        // For single-choice sections
        this.selectedOptions[sectionId] = optionValue;
        console.log('State updated - selectedOptions:', JSON.stringify(this.selectedOptions));
        // UI updates or dependency checks are handled elsewhere
    },

    updateMultiOption(sectionId, optionValue, isSelected) {
        if (!this.selectedOptions[sectionId]) {
            this.selectedOptions[sectionId] = [];
        }
        
        const currentValues = this.selectedOptions[sectionId];
        
        if (isSelected) {
            // Add to array if not already included
            if (!currentValues.includes(optionValue)) {
                currentValues.push(optionValue);
            }
        } else {
            // Remove from array
            const index = currentValues.indexOf(optionValue);
            if (index > -1) {
                currentValues.splice(index, 1);
            }
        }
        
        console.log('State updated - selectedOptions:', JSON.stringify(this.selectedOptions));
    },

    updateRuleModuleState(moduleId, isEnabled) {
        this.ruleModuleStates[moduleId] = isEnabled;
        console.log('State updated - ruleModuleStates:', JSON.stringify(this.ruleModuleStates));
    },

    // --- Preset Management ---
    loadPreset(name) {
        const preset = this.presets[name];
        if (preset) {
            this.selectedOptions = JSON.parse(JSON.stringify(preset.options || {})); // Deep copy
            this.ruleModuleStates = JSON.parse(JSON.stringify(preset.modules || {})); // Deep copy
            console.log(`Preset '${name}' loaded.`);
            return true;
        } else {
            console.warn(`Preset '${name}' not found.`);
            return false;
        }
    },

    savePreset(name) {
        if (!name) {
            console.error("Preset name cannot be empty.");
            return false;
        }
        this.presets[name] = {
            options: JSON.parse(JSON.stringify(this.selectedOptions)), // Deep copy
            modules: JSON.parse(JSON.stringify(this.ruleModuleStates))  // Deep copy
        };
        console.log(`Preset '${name}' saved.`);
        
        // Save to localStorage for persistence
        try {
            localStorage.setItem('rulegen_presets', JSON.stringify(this.presets));
        } catch (e) {
            console.warn("Failed to save presets to localStorage:", e);
        }
        
        return true;
    },

    getPresets() {
        // If presets are empty, try to load from localStorage
        if (Object.keys(this.presets).length === 0) {
            try {
                const savedPresets = localStorage.getItem('rulegen_presets');
                if (savedPresets) {
                    this.presets = JSON.parse(savedPresets);
                    console.log("Loaded presets from localStorage");
                }
            } catch (e) {
                console.warn("Failed to load presets from localStorage:", e);
            }
        }
        
        return this.presets;
    },

    // --- Settings Import/Export ---
    getSettings() {
        return {
            generatorId: this.currentGeneratorId,
            options: this.selectedOptions,
            modules: this.ruleModuleStates
        };
    },

    loadSettings(settings) {
        if (!settings || !settings.generatorId || !GeneratorRegistry.getGenerator(settings.generatorId)) {
            console.error("Invalid settings object or generator ID.");
            return false;
        }
        this.currentGeneratorId = settings.generatorId;
        this.selectedOptions = settings.options || {};
        this.ruleModuleStates = settings.modules || {};
        console.log(`Settings loaded for generator '${this.currentGeneratorId}'.`);
        return true;
    }
};
