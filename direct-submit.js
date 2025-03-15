// URL dello script Google Apps Script
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec';

// Funzione per inviare i dati
function submitForm(formData) {
    // Mostra indicatore di caricamento
    showLoading(true);
    
    // Usa XMLHttpRequest invece di fetch per compatibilità
    var xhr = new XMLHttpRequest();
    xhr.open('POST', SCRIPT_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            showLoading(false);
            
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.result === 'success') {
                        showThankYouMessage();
                    } else {
                        showError('Errore durante l\'invio: ' + (response.error || 'Errore sconosciuto'));
                    }
                } catch (e) {
                    showError('Errore nel parsing della risposta');
                }
            } else {
                showError('Errore di connessione: ' + xhr.status);
            }
        }
    };
    
    // Converti FormData in stringa URL-encoded
    var params = [];
    // Usa un approccio più compatibile invece di for...of
    var entries = formData.entries();
    var entry = entries.next();
    while (!entry.done) {
        var pair = entry.value;
        params.push(encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]));
        entry = entries.next();
    }
    
    xhr.send(params.join('&'));
}

// Funzioni di supporto
function showLoading(show) {
    var loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

function showThankYouMessage() {
    document.getElementById('questionnaireForm').style.display = 'none';
    document.getElementById('thankYouMessage').style.display = 'block';
}

function showError(message) {
    var errorElement = document.getElementById('errorMessage');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        errorElement.className = 'error-message';
        document.querySelector('.container').appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}