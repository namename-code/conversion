const API_URL = 'https://www.cbr-xml-daily.com/daily_json.js';

const currencySymbols = {
    RUB: "₽",
    USD: "$",
    EUR: "€",
    CNY: "¥",
    GBP: "£"
};

let exchangeRates = {
    RUB: 1,
    USD: 80.33,
    EUR: 92.73,
    CNY: 11.63,
    GBP: 107.12
};

const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('fromCurrency');
const toCurrencySelect = document.getElementById('toCurrency');
const swapBtn = document.getElementById('swapBtn');
const resultSpan = document.getElementById('result');
const rateInfoSpan = document.getElementById('rateInfo');
const updateInfoSpan = document.getElementById('updateInfo');

function setStatus(message, type = 'loading') {
    updateInfoSpan.textContent = message;
    updateInfoSpan.className = 'update-info ' + type;
}

async function fetchExchangeRates() {
    try {
        setStatus('🔄 Загрузка официальных курсов ЦБ РФ...', 'loading');
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.Valute) {
            exchangeRates.USD = data.Valute.USD.Value;
            exchangeRates.EUR = data.Valute.EUR.Value;
            exchangeRates.CNY = data.Valute.CNY.Value;
            exchangeRates.GBP = data.Valute.GBP.Value;
            exchangeRates.RUB = 1;
            
            const date = data.Date ? new Date(data.Date).toLocaleDateString('ru-RU') : 'сегодня';
            const now = new Date();
            const timeString = now.toLocaleTimeString('ru-RU');
            
            setStatus(`✅ Курсы ЦБ РФ от ${date} • загружены ${timeString}`, 'success');
            
            performConversion();
            
            setTimeout(() => {
                if (updateInfoSpan.textContent.includes('✅')) {
                    updateInfoSpan.className = 'update-info';
                    updateInfoSpan.textContent = '📊 Официальные курсы ЦБ РФ';
                }
            }, 3000);
            
        } else {
            throw new Error('Некорректный ответ от сервера');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки курсов ЦБ РФ:', error);
        setStatus(`⚠️ Ошибка загрузки, используются сохранённые курсы ЦБ РФ`, 'error');
        
        setTimeout(() => {
            if (updateInfoSpan.textContent.includes('⚠️')) {
                updateInfoSpan.className = 'update-info';
                updateInfoSpan.textContent = '📡 Сохранённые курсы ЦБ РФ';
            }
        }, 4000);
        
        performConversion();
    }
}

function convertCurrency(amount, fromCurr, toCurr) {
    if (isNaN(amount) || amount === null || amount === '') {
        return 0;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
        return 0;
    }
    
    if (fromCurr === 'RUB') {
        return amountNum / exchangeRates[toCurr];
    } else if (toCurr === 'RUB') {
        return amountNum * exchangeRates[fromCurr];
    } else {
        const amountInRUB = amountNum * exchangeRates[fromCurr];
        return amountInRUB / exchangeRates[toCurr];
    }
}

function formatNumber(value) {
    if (value === 0) return '0.00';
    return value.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updateRateInfo() {
    const fromCurr = fromCurrencySelect.value;
    const toCurr = toCurrencySelect.value;
    
    if (fromCurr === toCurr) {
        rateInfoSpan.innerHTML = `💵 1 ${fromCurr} = 1.0000 ${toCurr}`;
        return;
    }
    
    const rate = convertCurrency(1, fromCurr, toCurr);
    const reverseRate = convertCurrency(1, toCurr, fromCurr);
    
    rateInfoSpan.innerHTML = `💵 1 ${fromCurr} = ${rate.toFixed(4)} ${toCurr} &nbsp;|&nbsp; 1 ${toCurr} = ${reverseRate.toFixed(4)} ${fromCurr}`;
}

function performConversion() {
    let amountRaw = amountInput.value;
    
    if (amountRaw === "" || amountRaw === null) {
        amountRaw = "0";
    }
    
    const amount = parseFloat(amountRaw);
    
    if (isNaN(amount)) {
        resultSpan.textContent = "Ошибка ввода";
        return;
    }
    
    const fromCurr = fromCurrencySelect.value;
    const toCurr = toCurrencySelect.value;
    
    const convertedAmount = convertCurrency(amount, fromCurr, toCurr);
    const formattedResult = formatNumber(convertedAmount);
    const symbol = currencySymbols[toCurr];
    
    resultSpan.textContent = `${formattedResult} ${symbol} (${toCurr})`;
    updateRateInfo();
}

function swapCurrencies() {
    const fromVal = fromCurrencySelect.value;
    const toVal = toCurrencySelect.value;
    
    fromCurrencySelect.value = toVal;
    toCurrencySelect.value = fromVal;
    
    performConversion();
}

function setupInputValidation() {
    amountInput.addEventListener('input', function(e) {
        let value = this.value;
        value = value.replace(',', '.');
        value = value.replace(/[^\d.-]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        this.value = value;
        performConversion();
    });
    
    amountInput.addEventListener('blur', function() {
        let value = parseFloat(this.value);
        if (isNaN(value)) {
            this.value = "0";
        } else if (value < 0) {
            this.value = "0";
        }
        performConversion();
    });
}

function setupEventListeners() {
    amountInput.addEventListener('input', performConversion);
    fromCurrencySelect.addEventListener('change', performConversion);
    toCurrencySelect.addEventListener('change', performConversion);
    swapBtn.addEventListener('click', swapCurrencies);
}

function startAutoUpdate() {
    fetchExchangeRates();
    setInterval(() => {
        fetchExchangeRates();
    }, 14400000);
}

function init() {
    setupEventListeners();
    setupInputValidation();
    startAutoUpdate();
}

document.addEventListener('DOMContentLoaded', init);