(function() {
    'use strict';

    // ===== DOM refs =====
    const passwordOutput = document.getElementById('passwordOutput');
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    const useUpper = document.getElementById('useUpper');
    const useLower = document.getElementById('useLower');
    const useNumbers = document.getElementById('useNumbers');
    const useSymbols = document.getElementById('useSymbols');
    const excludeAmbiguous = document.getElementById('excludeAmbiguous');
    const usePronounceable = document.getElementById('usePronounceable');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const entropyDisplay = document.getElementById('entropyDisplay');
    const entropyMetric = document.getElementById('entropyMetric');
    const strengthMetric = document.getElementById('strengthMetric');
    const crackTimeMetric = document.getElementById('crackTimeMetric');

    // ===== Conjuntos de caracteres =====
    const CHARSETS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/'
    };
    const AMBIGUOUS = 'il1O0';

    // Sílabas para senhas pronunciáveis (combinações CVC)
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

    // ===== Utilitário criptográfico =====
    function getRandomBytes(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    }

    // ===== Gerador principal =====
    function generatePassword() {
        const length = parseInt(lengthSlider.value, 10);
        const includeUpper = useUpper.checked;
        const includeLower = useLower.checked;
        const includeNumbers = useNumbers.checked;
        const includeSymbols = useSymbols.checked;
        const excludeAmb = excludeAmbiguous.checked;
        const pronounceable = usePronounceable.checked;

        // Monta charset base
        let charset = '';
        if (includeUpper) charset += CHARSETS.upper;
        if (includeLower) charset += CHARSETS.lower;
        if (includeNumbers) charset += CHARSETS.numbers;
        if (includeSymbols) charset += CHARSETS.symbols;

        // Remove ambíguos se marcado
        if (excludeAmb) {
            charset = charset.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
        }

        // Se nenhum tipo selecionado, força lower
        if (charset.length === 0) {
            charset = CHARSETS.lower;
        }

        // --- Modo Pronunciável (baseado em sílabas) ---
        if (pronounceable) {
            let password = '';
            // Garante comprimento aproximado: cada sílaba tem 2~3 caracteres
            const numSyllables = Math.max(2, Math.round(length / 2.5));
            const available = [...SYLLABLES];
            for (let i = 0; i < numSyllables; i++) {
                const idx = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * available.length);
                let syl = available[idx % available.length];
                // Capitaliza aleatoriamente
                if (includeUpper && Math.random() > 0.6) {
                    syl = syl.charAt(0).toUpperCase() + syl.slice(1);
                }
                password += syl;
            }
            // Ajusta para o tamanho exato (corta ou completa com caracteres aleatórios)
            while (password.length < length) {
                const idx = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * charset.length);
                password += charset[idx % charset.length];
            }
            if (password.length > length) {
                password = password.slice(0, length);
            }
            // Garante que tenha pelo menos um número/símbolo se requisitado
            if (includeNumbers && !/\d/.test(password)) {
                const digit = CHARSETS.numbers[Math.floor(Math.random() * CHARSETS.numbers.length)];
                const pos = Math.floor(Math.random() * password.length);
                password = password.slice(0, pos) + digit + password.slice(pos + 1);
            }
            if (includeSymbols && !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?/]/.test(password)) {
                const sym = CHARSETS.symbols[Math.floor(Math.random() * CHARSETS.symbols.length)];
                const pos = Math.floor(Math.random() * password.length);
                password = password.slice(0, pos) + sym + password.slice(pos + 1);
            }
            return password;
        }

        // --- Modo padrão (aleatório puro) ---
        const charsetArray = charset.split('');
        const charsetLength = charsetArray.length;
        const passwordArray = new Array(length);

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * charsetLength);
            passwordArray[i] = charsetArray[randomIndex % charsetLength];
        }

        // Garantia de inclusão (força pelo menos 1 de cada tipo selecionado)
        const ensureTypes = [];
        if (includeUpper) ensureTypes.push(CHARSETS.upper);
        if (includeLower) ensureTypes.push(CHARSETS.lower);
        if (includeNumbers) ensureTypes.push(CHARSETS.numbers);
        if (includeSymbols) ensureTypes.push(CHARSETS.symbols);

        for (let type of ensureTypes) {
            let typeChars = type.split('').filter(c => !excludeAmb || !AMBIGUOUS.includes(c));
            if (typeChars.length === 0) continue;
            const char = typeChars[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * typeChars.length)];
            const pos = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * passwordArray.length);
            passwordArray[pos] = char;
        }

        return passwordArray.join('');
    }

    // ===== Cálculo de Entropia (embasamento científico) =====
    function calculateEntropy(password, charsetSize) {
        if (!password || password.length === 0) return 0;
        // Shannon entropy: E = L * log2(N)  (bits)
        // onde L = comprimento, N = tamanho do conjunto de caracteres
        return password.length * Math.log2(charsetSize);
    }

    function getCharsetSize() {
        let size = 0;
        if (useUpper.checked) size += CHARSETS.upper.length;
        if (useLower.checked) size += CHARSETS.lower.length;
        if (useNumbers.checked) size += CHARSETS.numbers.length;
        if (useSymbols.checked) size += CHARSETS.symbols.length;
        if (excludeAmbiguous.checked) {
            // desconta ambiguos de cada conjunto (aproximado)
            const amb = AMBIGUOUS.split('');
            let removed = 0;
            if (useUpper.checked) removed += amb.filter(c => CHARSETS.upper.includes(c)).length;
            if (useLower.checked) removed += amb.filter(c => CHARSETS.lower.includes(c)).length;
            if (useNumbers.checked) removed += amb.filter(c => CHARSETS.numbers.includes(c)).length;
            size = Math.max(1, size - removed);
        }
        return size > 0 ? size : 1;
    }

    function estimateCrackTime(entropyBits) {
        // Assumindo 10^9 tentativas/seg (ataque GPU)
        const attemptsPerSecond = 1e9;
        const totalAttempts = Math.pow(2, entropyBits);
        const seconds = totalAttempts / attemptsPerSecond;
        if (seconds < 60) return 'menos de 1 minuto';
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutos`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} horas`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} dias`;
        if (seconds < 3.1536e12) return `${Math.round(seconds / 31536000)} anos`;
        return '> bilhões de anos';
    }

    function getStrength(entropy) {
        if (entropy < 40) return 'Fraca ⚠️';
        if (entropy < 60) return 'Moderada 🔶';
        if (entropy < 80) return 'Forte ✅';
        if (entropy < 100) return 'Muito Forte 🛡️';
        return 'Nível Militar 🚀';
    }

    // ===== Atualizar UI =====
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

    // ===== Gerar e exibir =====
    function generateAndDisplay() {
        const password = generatePassword();
        updateUI(password);
    }

    // ===== Copiar =====
    function copyPassword() {
        const pwd = passwordOutput.value;
        if (!pwd) return;
        navigator.clipboard.writeText(pwd).then(() => {
            const original = copyBtn.textContent;
            copyBtn.textContent = '✅';
            setTimeout(() => copyBtn.textContent = original, 1500);
        }).catch(() => {
            // fallback
            passwordOutput.select();
            document.execCommand('copy');
        });
    }

    // ===== Eventos =====
    lengthSlider.addEventListener('input', () => {
        lengthValue.textContent = lengthSlider.value;
        generateAndDisplay();
    });

    [useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous, usePronounceable].forEach(el => {
        el.addEventListener('change', generateAndDisplay);
    });

    generateBtn.addEventListener('click', generateAndDisplay);
    refreshBtn.addEventListener('click', generateAndDisplay);
    copyBtn.addEventListener('click', copyPassword);

    // Geração inicial
    generateAndDisplay();

    // Atualiza entropia a cada 2s (por segurança, mas já é reativa)
    setInterval(() => {
        const pwd = passwordOutput.value;
        if (pwd) {
            const charsetSize = getCharsetSize();
            const entropy = calculateEntropy(pwd, charsetSize);
            entropyDisplay.textContent = entropy.toFixed(1);
            entropyMetric.textContent = entropy.toFixed(1) + ' bits';
        }
    }, 3000);

})();