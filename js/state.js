// js/state.js

const AppState = {
    currentGeneratorId: null,
    selectedOptions: {},
    ruleModuleStates: {},
    // Initialize with an empty object, will be populated from localStorage or defaults
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
        // Start with a clean slate, including advanced settings
        this.selectedOptions = {
            advancedMode: false, // Default advanced mode to off
            ruleSettings: {}     // Clear rule-specific settings
        };

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
                } else {
                    // Add a default test preset if nothing is in localStorage
                    this.presets = {
                        'Test Preset': {
                            options: {
                                general: ['allowAds', 'showModerationActions', 'includeIntro', 'includeNotes'],
                                strictness: 'high',
                                advancedMode: true, // Enable advanced mode for testing
                                ruleSettings: {
                                    'rule-insults': { override: true, showActions: true, strictness: 'low' },
                                    'rule-spam': { override: true, showActions: false } // Example: hide actions for spam
                                }
                            },
                            modules: {
                                'intro-main': true,
                                'notes-main': true,
                                'note-1': true,
                                'note-2': false, // Disable one note for testing
                                'note-3': true,
                                'note-4': true,
                                'note-5': true,
                                'rule-order': true,
                                'rule-insults': true,
                                'rule-spam': true,
                                'rule-media': false, // Should be automatically handled by conditions
                                'rule-media-18plus': false, // Should be automatically handled by conditions
                                'rule-ads': false, // Should be automatically handled by conditions
                                'rule-ads-allowed': true, // Enable the allowed ads rule
                                'rule-conflicts': true,
                                'rule-bullying': false, // Disable one rule for testing
                                'rule-toxic': true,
                                'rule-politics': true,
                                'rule-privacy': true,
                                'rule-bypass': true
                            }
                        }
                    };
                    console.log("Initialized with default test preset.");
                }
            } catch (e) {
                console.warn("Failed to load or initialize presets:", e);
                this.presets = {}; // Ensure presets is an object even on error
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
        console.log("Attempting to load settings:", JSON.stringify(settings)); // DEBUG
        if (!settings || !settings.generatorId || !GeneratorRegistry.getGenerator(settings.generatorId)) {
            console.error("Invalid settings object or generator ID.");
            alert("Неверный формат файла настроек или не найден указанный генератор."); // User feedback
            return false;
        }
        this.currentGeneratorId = settings.generatorId;
        // Ensure deep copies when loading to prevent reference issues
        this.selectedOptions = JSON.parse(JSON.stringify(settings.options || {}));
        this.ruleModuleStates = JSON.parse(JSON.stringify(settings.modules || {}));
        console.log(`Settings successfully loaded for generator '${this.currentGeneratorId}'.`); // DEBUG
        console.log(" - Loaded Options:", JSON.stringify(this.selectedOptions)); // DEBUG
        console.log(" - Loaded Modules:", JSON.stringify(this.ruleModuleStates)); // DEBUG
        return true;
    }
};
