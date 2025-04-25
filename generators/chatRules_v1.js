// generators/chatRules_v1.js

const chatRulesGenerator_v1 = {
    id: 'chatRules_v1',
    name: 'Правила Чата (Базовые)',
    description: 'Генератор стандартных правил для чатов с базовыми настройками.',

    // Определяем структуру документа (какие модули отвечают за введение/примечания)
    structure: {
        introModuleId: 'intro-main',
        notesModuleId: 'notes-main',
    },

    // Секции с настройками
    sections: [
        {
            id: 'general',
            title: 'Общие настройки',
            icon: 'fas fa-cog',
            type: 'multi-choice-checkboxes',
            options: [
                { value: 'allowAds', label: 'Разрешить рекламу (с ограничениями)', icon: 'fas fa-bullhorn', checked: false },
                { value: 'allow18plus', label: 'Разрешить контент 18+', icon: 'fas fa-exclamation-triangle', checked: false },
                { value: 'showModerationActions', label: 'Указывать действия модерации', icon: 'fas fa-gavel', checked: true },
                { value: 'includeIntro', label: 'Включить введение', icon: 'fas fa-book-open', checked: true },
                { value: 'includeNotes', label: 'Включить примечания', icon: 'fas fa-sticky-note', checked: true },
            ]
        },
        {
            id: 'strictness',
            title: 'Жесткость наказаний',
            icon: 'fas fa-shield-alt',
            type: 'single-choice-buttons',
            options: [
                { value: 'low', label: 'Низкая', icon: 'fas fa-thumbs-up', style: 'btn-outline-success' }, // Default? Add logic in UI/State
                { value: 'medium', label: 'Средняя', icon: 'fas fa-balance-scale', style: 'btn-outline-warning' },
                { value: 'high', label: 'Высокая', icon: 'fas fa-skull-crossbones', style: 'btn-outline-danger' },
            ]
            // TODO: Set default value (e.g., 'medium') in AppState initialization
        },
        // Можно добавить секцию для выбора конкретных наказаний (варн, мут, бан)
    ],

    // Модули правил
    ruleModules: [
        // --- Структурные модули --- 
        {
            id: 'intro-main',
            name: 'Введение', // Name for the module toggle UI
            type: 'intro', // Special type for engine logic
            conditions: { general: ['includeIntro'] }, // Зависит от чекбокса в секции general
            defaultEnabled: true,
            textTemplate: `Добро пожаловать в наш чат!

Пожалуйста, ведите себя хорошо, уважайте других участников и соблюдайте общепринятые нормы общения. Основные правила сводятся к тому, чтобы не оскорблять никого, не спамить, не нарушать тематику чата и не распространять запрещенный контент. Если вы не уверены в своих действиях, всегда можно обратиться к модератору.

Для подробностей ознакомьтесь с полным списком правил ниже.`
        },
        {
            id: 'notes-main',
            name: 'Примечания', // Name for the module toggle UI
            type: 'notes', // Special type for engine logic
            conditions: { general: ['includeNotes'] },
            defaultEnabled: true,
            textTemplate: `{{subNotes}}`, // Плейсхолдер для вложенных примечаний
            // Определяем вложенные модули (каждый можно будет отключать)
            subModules: [
                {
                    id: 'note-1',
                    name: 'Примечание 1 (Ответственность)',
                    defaultEnabled: true,
                    textTemplate: `Незнание или непонимание правил не освобождает от ответственности.`
                },
                {
                    id: 'note-2',
                    name: 'Примечание 2 (Злостные нарушения)',
                    defaultEnabled: true,
                    textTemplate: `Злостные нарушения, направленные исключительно на нарушение порядка, будут наказываться более строго.`
                },
                {
                    id: 'note-3',
                    name: 'Примечание 3 (Гибкость модерации)',
                    defaultEnabled: true,
                    conditions: { general: ['showModerationActions'] }, // Показывать только если включены действия модерации
                    textTemplate: `Действия модерации не фиксированы строго, несут рекомендательный характер и могут варьироваться в зависимости от конкретной ситуации и тяжести нарушения.`
                },
                {
                    id: 'note-4',
                    name: 'Примечание 4 (Апелляция)',
                    defaultEnabled: true,
                    textTemplate: `Обращайтесь к создателю чата в лс, если вы считаете, что наказание выдано по ошибке.`
                },
                {
                    id: 'note-5',
                    name: 'Примечание 5 (Указание правила)',
                    defaultEnabled: true,
                    conditions: { general: ['showModerationActions'] },
                    textTemplate: `При выдаче наказаний модерации рекомендуется указывать номер и/или название правила.`
                }
            ]
        },

        // --- Основные правила --- 
        {
            id: 'rule-order',
            name: 'Правило 1: Порядок и общение',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Порядок и общение: Правила нацелены на создание порядка в чате. Модератор имеет право накладывать ограничения на участника по любым причинам, если участник нарушает порядок, на основе здравого смысла, даже если конкретное правило не нарушено. Отмазки "Я ни в чем не виноват" и "Нет такого правила" не имеют силы.{{#if general.showModerationActions}}
   - Действия модерации: варн, мут, бан.{{/if}}` // Используем псевдо-условие для движка
        },
        {
            id: 'rule-insults',
            name: 'Правило 2: Оскорбления',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Оскорбления: Запрещено оскорблять участников в любой форме. Запрещены сообщения, унижающие человеческое достоинство, сексуального характера, разжигающие межнациональную рознь, угрозы расправой, угрозы баном, дискриминация по религиозным или другим признакам, пропаганда/обсуждение нацизма, наркотиков, алкоголизма и табакокурения.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}мут (12 часов){{/when}}{{#when medium}}мут (1 день){{/when}}{{#when high}}мут (3 дня), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-spam',
            name: 'Правило 3: Спам и флуд',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Спам и флуд: Запрещены спам, флуд, оффтоп и игнорирование тематики чата в любой форме. Это включает спам медиа, капсом, сообщениями без цели, злоупотребление пингами (@ упоминания), а также попытки помешать общению других в чате.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}варн, мут (6 часов){{/when}}{{#when medium}}варн, мут (12 часов), бан (при рецидиве){{/when}}{{#when high}}мут (1 день), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-media',
            name: 'Правило 4: Запрещенные медиа',
            type: 'main-rule',
            defaultEnabled: true,
            conditions: { general: ['allow18plus', false] }, // Показываем это правило, ТОЛЬКО если 18+ ЗАПРЕЩЕН
            textTemplate: `Запрещенные медиа: Запрещена отправка медиа со сценами жестокого насилия, вирусов, вредоносного ПО, экстремистского или любого другого опасного для здоровья контента.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}мут (1 день){{/when}}{{#when medium}}мут (1 день), немедленный бан (при рецидиве){{/when}}{{#when high}}немедленный бан{{/when}}{{/case}}.{{/if}}`
        },
         {
            id: 'rule-media-18plus',
            name: 'Правило 4 (18+): Запрещенные медиа',
            type: 'main-rule',
            defaultEnabled: true,
            conditions: { general: ['allow18plus', true] }, // Показываем это правило, ТОЛЬКО если 18+ РАЗРЕШЕН
            textTemplate: `Запрещенные медиа (18+): Запрещена отправка медиа со сценами нелегального или чрезмерно жестокого контента (снафф, гуро и т.п.), вирусов, вредоносного ПО, экстремистских материалов. Контент 18+ должен быть помечен соответствующим образом (спойлер).{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}мут (1 день){{/when}}{{#when medium}}мут (1 день), бан (при рецидиве){{/when}}{{#when high}}немедленный бан{{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-ads',
            name: 'Правило 5: Реклама',
            type: 'main-rule',
            defaultEnabled: true,
            conditions: { general: ['allowAds', false] }, // Показываем, если реклама ЗАПРЕЩЕНА
            textTemplate: `Реклама: Запрещена реклама любых ресурсов без согласования с администрацией. Это включает рекламу в личных сообщениях.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}варн, мут (12 часов){{/when}}{{#when medium}}варн, мут (24 часа), бан (при рецидиве){{/when}}{{#when high}}мут (2 дня), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-ads-allowed',
            name: 'Правило 5: Реклама (Разрешена)',
            type: 'main-rule',
            defaultEnabled: true,
            conditions: { general: ['allowAds', true] }, // Показываем, если реклама РАЗРЕШЕНА
            textTemplate: `Реклама: Реклама разрешена только с явного согласия администрации и в специально отведенных для этого местах/времени (если таковые имеются). Несогласованная реклама, в том числе в ЛС, запрещена.{{#if general.showModerationActions}}
   - Действия модерации (за несогласованную рекламу): {{#case strictness}}{{#when low}}варн, мут (6 часов){{/when}}{{#when medium}}варн, мут (12 часов), бан (при рецидиве){{/when}}{{#when high}}мут (1 день), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-conflicts',
            name: 'Правило 6: Конфликты и провокации',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Конфликты и провокации: Нельзя начинать или способствовать конфликту. Запрещены провокации по отношению как к участникам, так и к стаффу с целью проверки компетентности.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}варн, мут (12 часов){{/when}}{{#when medium}}варн, мут (24 часа), бан (при рецидиве){{/when}}{{#when high}}мут (2 дня), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-bullying',
            name: 'Правило 7: Буллинг и троллинг',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Буллинг и троллинг: Запрещен буллинг и троллинг в любой форме в отношении участников и стаффа. Запрещено копирование и пародирование ников, профилей, выдача себя за другое лицо. Любые шутки могут быть восприняты модерацией всерьез.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}варн, мут (12 часов){{/when}}{{#when medium}}варн, мут (24 часа), бан (при рецидиве){{/when}}{{#when high}}мут (2 дня), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-toxic',
            name: 'Правило 8: Токсичное поведение',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Токсичное поведение: Запрещено токсичное и неадекватное отношение к администрации и участникам.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}варн, мут (12 часов){{/when}}{{#when medium}}варн, мут (24 часа), бан (при рецидиве){{/when}}{{#when high}}мут (2 дня), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-politics',
            name: 'Правило 9: Политика и нацистские шутки',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Политика и нацистские шутки: Любые конфликты на политической основе в любом виде влекут за собой мут всех участников конфликта. Запрещены любые шутки, имеющие нацистский контекст.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}мут (12 часов){{/when}}{{#when medium}}мут (24 часа), бан (при рецидиве){{/when}}{{#when high}}мут (3 дня), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-privacy',
            name: 'Правило 10: Конфиденциальность',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Конфиденциальность: Запрещено распространять личные данные других участников без их согласия.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}мут (12 часов){{/when}}{{#when medium}}мут (24 часа), бан (при рецидиве){{/when}}{{#when high}}мут (3 дня), бан (при рецидиве){{/when}}{{/case}}.{{/if}}`
        },
        {
            id: 'rule-bypass',
            name: 'Правило 11: Обход правил',
            type: 'main-rule',
            defaultEnabled: true,
            textTemplate: `Обход правил: Запрещены любые попытки обхода правил.{{#if general.showModerationActions}}
   - Действия модерации: {{#case strictness}}{{#when low}}мут (24 часа){{/when}}{{#when medium}}бан (3 дня){{/when}}{{#when high}}перманентный бан{{/when}}{{/case}}.{{/if}}`
        }
    ]
};

// Регистрация генератора
GeneratorRegistry.register(chatRulesGenerator_v1);
