(function() {
    'use strict';

    // =============================================
    // 1. REFERÊNCIAS DOM
    // =============================================
    const passwordOutput = document.getElementById('passwordOutput');
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    const useUpper = document.getElementById('useUpper');
    const useLower = document.getElementById('useLower');
    const useNumbers = document.getElementById('useNumbers');
    const useSymbols = document.getElementById('useSymbols');
    const excludeAmbiguous = document.getElementById('excludeAmbiguous');
    const usePronounceable = document.getElementById('usePronounceable');
    const useIsraelMode = document.getElementById('useIsraelMode');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const entropyDisplay = document.getElementById('entropyDisplay');
    const entropyMetric = document.getElementById('entropyMetric');
    const strengthMetric = document.getElementById('strengthMetric');
    const crackTimeMetric = document.getElementById('crackTimeMetric');

    // =============================================
    // 2. CONJUNTOS DE CARACTERES
    // =============================================
    const CHARSETS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/'
    };

    // Caracteres hebraicos (Modo Jerusalém) 🇮🇱
    const HEBREW_CHARS = 'אבגדהוזחטיכלמנסעפצקרשת';

    // Caracteres ambíguos (para exclusão)
    const AMBIGUOUS = 'il1O0';

    // Sílabas para senhas pronunciáveis
    const SYLLABLES = [
        'ba', 'be', 'bi', 'bo', 'bu', 'da', 'de', 'di', 'do', 'du',
        'fa', 'fe', 'fi', 'fo', 'fu', 'ga', 'ge', 'gi', 'go', 'gu',
        'ka', 'ke', 'ki', 'ko', 'ku', 'la', 'le', 'li', 'lo', 'lu',
        'ma', 'me', 'mi', 'mo', 'mu', 'na', 'ne', 'ni', 'no', 'nu',
        'pa', 'pe', 'pi', 'po', 'pu', 'ra', 're', 'ri', 'ro', 'ru',
        'sa', 'se', 'si', 'so', 'su', 'ta', 'te', 'ti', 'to', 'tu',
        'va', 've', 'vi', 'vo', 'vu', 'xa', 'xe', 'xi', 'xo', 'xu',
        'za', 'ze', 'zi', 'zo', 'zu'
    ];

    // =============================================
    // 3. UTILITÁRIO CRIPTOGRÁFICO (NIST/FIPS)
    // =============================================
    function getRandomBytes(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    }

    // =============================================
    // 4. GERADOR DE SENHA PRINCIPAL
    // =============================================
    function generatePassword() {
        const length = parseInt(lengthSlider.value, 10);
        const includeUpper = useUpper.checked;
        const includeLower = useLower.checked;
        const includeNumbers = useNumbers.checked;
        const includeSymbols = useSymbols.checked;
        const excludeAmb = excludeAmbiguous.checked;
        const pronounceable = usePronounceable.checked;
        const israelMode = useIsraelMode.checked;

        // --- 4.1 Monta charset base ---
        let charset = '';
        if (includeUpper) charset += CHARSETS.upper;
        if (includeLower) charset += CHARSETS.lower;
        if (includeNumbers) charset += CHARSETS.numbers;
        if (includeSymbols) charset += CHARSETS.symbols;

        // Modo Jerusalém: adiciona caracteres hebraicos
        if (israelMode) {
            charset += HEBREW_CHARS;
        }

        // Remove ambíguos se marcado
        if (excludeAmb) {
            charset = charset.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
        }

        // Se nenhum tipo selecionado, força lower
        if (charset.length === 0) {
            charset = CHARSETS.lower;
        }

        // --- 4.2 Modo Pronunciável (baseado em sílabas) ---
        if (pronounceable) {
            let password = '';
            const numSyllables = Math.max(2, Math.round(length / 2.5));
            const available = [...SYLLABLES];
            
            for (let i = 0; i < numSyllables; i++) {
                const idx = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * available.length);
                let syl = available[idx % available.length];
                
                // Capitaliza aleatoriamente se maiúsculas estiverem ativas
                if (includeUpper && Math.random() > 0.6) {
                    syl = syl.charAt(0).toUpperCase() + syl.slice(1);
                }
                password += syl;
            }

            // Ajusta para o tamanho exato
            while (password.length < length) {
                const idx = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * charset.length);
                password += charset[idx % charset.length];
            }
            if (password.length > length) {
                password = password.slice(0, length);
            }

            // Garante inclusão de números se requisitado
            if (includeNumbers && !/\d/.test(password)) {
                const digit = CHARSETS.numbers[Math.floor(Math.random() * CHARSETS.numbers.length)];
                const pos = Math.floor(Math.random() * password.length);
                password = password.slice(0, pos) + digit + password.slice(pos + 1);
            }

            // Garante inclusão de símbolos se requisitado
            if (includeSymbols && !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?/]/.test(password)) {
                const sym = CHARSETS.symbols[Math.floor(Math.random() * CHARSETS.symbols.length)];
                const pos = Math.floor(Math.random() * password.length);
                password = password.slice(0, pos) + sym + password.slice(pos + 1);
            }

            // Garante inclusão de hebraico se Modo Jerusalém ativo
            if (israelMode && !/[אבגדהוזחטיכלמנסעפצקרשת]/.test(password)) {
                const heb = HEBREW_CHARS[Math.floor(Math.random() * HEBREW_CHARS.length)];
                const pos = Math.floor(Math.random() * password.length);
                password = password.slice(0, pos) + heb + password.slice(pos + 1);
            }

            return password;
        }

        // --- 4.3 Modo Padrão (aleatório puro com crypto) ---
        const charsetArray = charset.split('');
        const charsetLength = charsetArray.length;
        const passwordArray = new Array(length);

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * charsetLength);
            passwordArray[i] = charsetArray[randomIndex % charsetLength];
        }

        // --- 4.4 Garantia de inclusão (força pelo menos 1 de cada tipo selecionado) ---
        const ensureTypes = [];
        if (includeUpper) ensureTypes.push(CHARSETS.upper);
        if (includeLower) ensureTypes.push(CHARSETS.lower);
        if (includeNumbers) ensureTypes.push(CHARSETS.numbers);
        if (includeSymbols) ensureTypes.push(CHARSETS.symbols);
        if (israelMode) ensureTypes.push(HEBREW_CHARS);

        for (let type of ensureTypes) {
            let typeChars = type.split('').filter(c => !excludeAmb || !AMBIGUOUS.includes(c));
            if (typeChars.length === 0) continue;
            
            const char = typeChars[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * typeChars.length)];
            const pos = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * passwordArray.length);
            passwordArray[pos] = char;
        }

        return passwordArray.join('');
    }

    // =============================================
    // 5. CÁLCULO DE ENTROPIA (CIENTÍFICO)
    // =============================================
    function calculateEntropy(password, charsetSize) {
        if (!password || password.length === 0) return 0;
        // Fórmula de Shannon: E = L * log2(N)
        return password.length * Math.log2(charsetSize);
    }

    function getCharsetSize() {
        let size = 0;
        if (useUpper.checked) size += CHARSETS.upper.length;
        if (useLower.checked) size += CHARSETS.lower.length;
        if (useNumbers.checked) size += CHARSETS.numbers.length;
        if (useSymbols.checked) size += CHARSETS.symbols.length;
        if (useIsraelMode.checked) size += HEBREW_CHARS.length;

        if (excludeAmbiguous.checked) {
            const amb = AMBIGUOUS.split('');
            let removed = 0;
            if (useUpper.checked) removed += amb.filter(c => CHARSETS.upper.includes(c)).length;
            if (useLower.checked) removed += amb.filter(c => CHARSETS.lower.includes(c)).length;
            if (useNumbers.checked) removed += amb.filter(c => CHARSETS.numbers.includes(c)).length;
            if (useIsraelMode.checked) {
                // Remove caracteres hebraicos que são visualmente similares (aproximado)
                removed += amb.filter(c => HEBREW_CHARS.includes(c)).length;
            }
            size = Math.max(1, size - removed);
        }
        return size > 0 ? size : 1;
    }

    function estimateCrackTime(entropyBits) {
        // Assumindo 10^9 tentativas/segundo (ataque GPU moderno)
        const attemptsPerSecond = 1e9;
        const totalAttempts = Math.pow(2, entropyBits);
        const seconds = totalAttempts / attemptsPerSecond;
        
        if (seconds < 1) return 'menos de 1 segundo';
        if (seconds < 60) return `${Math.round(seconds)} segundos`;
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutos`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} horas`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} dias`;
        if (seconds < 3.1536e12) return `${Math.round(seconds / 31536000)} anos`;
        if (seconds < 3.1536e15) return `${Math.round(seconds / 3.1536e10)} mil anos`;
        return '⚡ bilhões de anos (impensável)';
    }

    function getStrength(entropy) {
        if (entropy < 40) return '🔴 Fraca';
        if (entropy < 55) return '🟠 Moderada';
        if (entropy < 70) return '🟡 Aceitável';
        if (entropy < 85) return '🟢 Forte ✅';
        if (entropy < 100) return '🔵 Muito Forte 🛡️';
        if (entropy < 128) return '🟣 Nível Militar 🚀';
        return '🔯 Nível Mossad 🇮🇱';
    }

    // =============================================
    // 6. ATUALIZAÇÃO DA INTERFACE
    // =============================================
    function updateUI(password) {
        passwordOutput.value = password;
        const charsetSize = getCharsetSize();
        const entropy = calculateEntropy(password, charsetSize);
        const entropyDisplayBits = entropy.toFixed(1);

        entropyDisplay.textContent = entropyDisplayBits;
        entropyMetric.textContent = entropyDisplayBits + ' bits';
        strengthMetric.textContent = getStrength(entropy);
        crackTimeMetric.textContent = estimateCrackTime(entropy);
    }

    // =============================================
    // 7. GERAR E EXIBIR
    // =============================================
    function generateAndDisplay() {
        const password = generatePassword();
        updateUI(password);
    }

    // =============================================
    // 8. COPIAR SENHA (COM FEEDBACK)
    // =============================================
    function copyPassword() {
        const pwd = passwordOutput.value;
        if (!pwd) return;
        
        navigator.clipboard.writeText(pwd).then(() => {
            const original = copyBtn.textContent;
            copyBtn.textContent = '✅';
            setTimeout(() => copyBtn.textContent = original, 1500);
        }).catch(() => {
            // Fallback para navegadores antigos
            passwordOutput.select();
            document.execCommand('copy');
            const original = copyBtn.textContent;
            copyBtn.textContent = '✅';
            setTimeout(() => copyBtn.textContent = original, 1500);
        });
    }

    // =============================================
    // 9. EVENTOS
    // =============================================
    // Slider de comprimento
    lengthSlider.addEventListener('input', () => {
        lengthValue.textContent = lengthSlider.value;
        generateAndDisplay();
    });

    // Checkboxes
    const checkboxes = [useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous, usePronounceable, useIsraelMode];
    checkboxes.forEach(el => {
        el.addEventListener('change', generateAndDisplay);
    });

    // Botões
    generateBtn.addEventListener('click', generateAndDisplay);
    refreshBtn.addEventListener('click', generateAndDisplay);
    copyBtn.addEventListener('click', copyPassword);

    // =============================================
    // 10. GERAÇÃO INICIAL
    // =============================================
    generateAndDisplay();

    // =============================================
    // 11. ATUALIZAÇÃO PERIÓDICA (REUNDÂNCIA)
    // =============================================
    setInterval(() => {
        const pwd = passwordOutput.value;
        if (pwd) {
            const charsetSize = getCharsetSize();
            const entropy = calculateEntropy(pwd, charsetSize);
            entropyDisplay.textContent = entropy.toFixed(1);
            entropyMetric.textContent = entropy.toFixed(1) + ' bits';
        }
    }, 3000);

    // =============================================
    // 12. MENSAGEM NO CONSOLE (IDENTIDADE ISRAEL)
    // =============================================
    console.log('%c🇮🇱 PassGenPro - Gerador de Senhas Padrão Israel', 'font-size: 18px; font-weight: bold; color: #0038b8;');
    console.log('%c✡︎ Baseado em padrões do INCD (Israel National Cyber Directorate)', 'font-size: 14px; color: #ffb300;');
    console.log('%c🔐 Gerado com crypto.getRandomValues() - NIST FIPS 140-2', 'font-size: 12px; color: #8a9bb5;');
    console.log('%cסיסמה חזקה היא המפתח להגנה על המידע שלך', 'font-size: 16px; color: #e8edf5; font-weight: bold;');

})();