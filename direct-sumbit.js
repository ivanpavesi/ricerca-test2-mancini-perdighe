// direct-submit-simple.js - versione semplificata contro conflitti
document.addEventListener('DOMContentLoaded', function() {
    // Attendi il caricamento completo
    setTimeout(function() {
        console.log("Simple direct submit applied");
        
        // event listener al form
        var form = document.getElementById('questionnaireForm');
        if (form) {
            if (form.attachEvent) {
                // Per IE8 e versioni precedenti
                form.attachEvent('onsubmit', function(e) {
                    if (validateForm()) {
                        e.returnValue = false; // Equivalente a preventDefault in IE
                        sendOrderedData();
                    }
                });
            } else {
                // Per browser moderni
                form.addEventListener('submit', function(e) {
                    if (validateForm()) {
                        e.preventDefault();
                        sendOrderedData();
                    }
                });
            }
        }
        
        // event listener anche al pulsante
        var submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            if (submitBtn.attachEvent) {
                // Per IE8 e versioni precedenti
                submitBtn.attachEvent('onclick', function() {
                    // evento click processato normalmente
                });
            } else {
                // Per browser moderni
                submitBtn.addEventListener('click', function() {
                    // evento click processato normalmente
                });
            }
        }
    }, 2000);
});

// inviare i dati in modo ordinato
function sendOrderedData() {
    // fb visivo
    var submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso...';
    
    // dati dal form
    var form = document.getElementById('questionnaireForm');
    var formData = new FormData(form);
    var formDataObj = {};
    
    // Compatibilità con vecchi browser che non supportano FormData.forEach
    var entries = formDataToArray(formData);
    for (var i = 0; i < entries.length; i++) {
        var key = entries[i].key;
        var value = entries[i].value;
        
        if (formDataObj[key]) {
            if (!Array.isArray(formDataObj[key])) {
                formDataObj[key] = [formDataObj[key]];
            }
            formDataObj[key].push(value);
        } else {
            formDataObj[key] = value;
        }
    }
    
    // array in stringhe
    for (var key in formDataObj) {
        if (Array.isArray(formDataObj[key])) {
            formDataObj[key] = formDataObj[key].join(', ');
        }
    }
    
    // ordine campi
    var fieldOrder = [
      'eta', 'sesso', 'annoSpecializzazione', 'cittaSpecializzazione', 'corso', 'precedentiSpecializzazioni',
      'lavora', 'lavoraAnno', 'oreLavoro', 'settoreLavoro',
      'lavoraPsicoterapeuta',
      'tipoLavoro', 'motivoNonPsicoterapeuta', 'specificaAltroMotivo',
      'motivoNonLiberoProf', 'specificaAltroMotivoNonLiberoProf',
      'psicoterapeutaAnno', 'settorePsicoterapeuta', 
      'dovePubblico',
      'dovePrivato', 'specificaAltroDovePrivato',
      'orePsicoterapia', 'orePiattaforme', 'oreOnline',
      'soddisfazioneGlobale', 'ragioneNonSoddisfatto',
      'soddisfazioneEconomica', 'soddisfazioneGratificazione',
      'fontiInvio', 'specificaAltroFontiInvio',
      'traguardiProfessionali', 'distanzaTraguardi', 'fiduciaColmare',
      'contributoScuola', 'ragioneContributo', 'specificaAltroRagioneContributo',
      'soddisfazioneCompetenze', 'spendibilitaCompetenze', 'efficaciaCompetenza',
      'pazientiFormazione', 'oreFormazione', 'aspettiCambiare', 'puntiForza',
      'iscrittoSITCC', 'motivoSiSITCC', 'motivoNoSITCC'
    ];
    
    // Creiamo manualmente una stringa di parametri URL invece di usare URLSearchParams
    var paramsArray = [];
    
    // aggiungi campi in ordine
    for (var i = 0; i < fieldOrder.length; i++) {
        var field = fieldOrder[i];
        if (field in formDataObj) {
            paramsArray.push(encodeURIComponent(field) + '=' + encodeURIComponent(formDataObj[field]));
        } else {
            paramsArray.push(encodeURIComponent(field) + '=');
        }
    }
    
    // aggiungi campi extra se presenti
    for (var field in formDataObj) {
        if (fieldOrder.indexOf(field) === -1) {
            paramsArray.push(encodeURIComponent(field) + '=' + encodeURIComponent(formDataObj[field]));
        }
    }
    
    var paramsString = paramsArray.join('&');
    
    // url dello script
    var scriptURL = 'https://script.google.com/macros/s/AKfycbwnG8nkLg_oSY2iSVUgfljFmPlQku1W58rHHZaKFYuISK3HIC48uvGEKDiSmFDFGOudmw/exec';
    
    // Usa XMLHttpRequest invece di fetch per compatibilità con browser più vecchi
    var xhr = new XMLHttpRequest();
    xhr.open('POST', scriptURL, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 400) {
            // messaggio ringraziamento
            document.getElementById('thankYouMessage').style.display = 'block';
            
            // nascondi form
            setTimeout(function() {
                var formSections = document.querySelectorAll('.section, .submit-group');
                for (var i = 0; i < formSections.length; i++) {
                    formSections[i].style.display = 'none';
                }
            }, 1000);
            
            // scorri fino a messaggio
            var thankYouMessage = document.getElementById('thankYouMessage');
            if (thankYouMessage.scrollIntoView) {
                thankYouMessage.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo(0, thankYouMessage.offsetTop);
            }
        } else {
            console.error('Errore nella risposta del server: ' + xhr.status);
            alert('Si è verificato un errore durante l\'invio: ' + xhr.status);
            
            // riabilita il pulsante
            submitBtn.disabled = false;
            submitBtn.textContent = 'Invia Questionario';
        }
    };
    
    xhr.onerror = function() {
        console.error('Errore di connessione');
        alert('Si è verificato un errore di connessione durante l\'invio');
        
        // riabilita il pulsante
        submitBtn.disabled = false;
        submitBtn.textContent = 'Invia Questionario';
    };
    
    xhr.send(paramsString);
}

// Funzione helper per convertire FormData in array per browser più vecchi
function formDataToArray(formData) {
    var result = [];
    
    // Prova a usare il metodo entries() se disponibile
    if (formData.entries && typeof formData.entries === 'function') {
        try {
            var entries = formData.entries();
            var item = entries.next();
            while (!item.done) {
                result.push({key: item.value[0], value: item.value[1]});
                item = entries.next();
            }
            return result;
        } catch (e) {
            // Se entries() fallisce, usiamo il metodo alternativo
        }
    }
    
    // Metodo alternativo: raccogliamo i dati dal form manualmente
    var form = document.getElementById('questionnaireForm');
    var elements = form.elements;
    
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var name = element.name;
        
        if (!name) continue;
        
        if (element.type === 'checkbox' || element.type === 'radio') {
            if (element.checked) {
                result.push({key: name, value: element.value});
            }
        } else if (element.type !== 'button' && element.type !== 'submit' && element.type !== 'reset') {
            result.push({key: name, value: element.value});
        }
    }
    
    return result;
}
