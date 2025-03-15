// direct-submit-simple.js - versione semplificata contro conflitti
document.addEventListener('DOMContentLoaded', function() {
    // Attendi il caricamento completo
    setTimeout(function() {
        console.log("Simple direct submit applied");
        
        // event listener al form
        const form = document.getElementById('questionnaireForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                // lascia che script.js gestisca la validazione
                // funzione di invio dati ordinati
                if (validateForm()) {
                    e.preventDefault(); // Previeni invio standard solo se validazione passa
                    sendOrderedData();
                }
            });
        }
        
        // event listener anche al pulsante
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                // evento click processato normalmente
                // listener aggiuntivo per l'evento submit 
            });
        }
    }, 2000);
});

// inviare i dati in modo ordinato
function sendOrderedData() {
    // fb visivo
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso...';
    
    // dati dal form
    const form = document.getElementById('questionnaireForm');
    const formData = new FormData(form);
    const formDataObj = {};
    
    // dati
    formData.forEach((value, key) => {
        if (formDataObj[key]) {
            if (!Array.isArray(formDataObj[key])) {
                formDataObj[key] = [formDataObj[key]];
            }
            formDataObj[key].push(value);
        } else {
            formDataObj[key] = value;
        }
    });
    
    // array in stringhe
    for (const key in formDataObj) {
        if (Array.isArray(formDataObj[key])) {
            formDataObj[key] = formDataObj[key].join(', ');
        }
    }
    
    // ordine  campi
    const fieldOrder = [
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
    
    // crea URLSearchParams
    const params = new URLSearchParams();
    
    // aggiungi campi in ordine
    fieldOrder.forEach(field => {
        if (field in formDataObj) {
            params.append(field, formDataObj[field]);
        } else {
            params.append(field, '');
        }
    });
    
    // aggiungi campi extra se presenti
    for (const field in formDataObj) {
        if (!fieldOrder.includes(field)) {
            params.append(field, formDataObj[field]);
        }
    }
    
    // url dello script
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwnG8nkLg_oSY2iSVUgfljFmPlQku1W58rHHZaKFYuISK3HIC48uvGEKDiSmFDFGOudmw/exec';
    
    // invio dati
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        mode: 'cors',
        redirect: 'follow',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Errore nella risposta del server: ' + response.status);
        }
        return response.text();
    })
    .then(() => {
        // messaggio ringraziamento
        document.getElementById('thankYouMessage').style.display = 'block';
        
        // nascondi form
        setTimeout(() => {
            const formSections = document.querySelectorAll('.section, .submit-group');
            formSections.forEach(section => {
                section.style.display = 'none';
            });
        }, 1000);
        
        // scorri fino a messaggio
        document.getElementById('thankYouMessage').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
        console.error('Errore:', error);
        alert('Si è verificato un errore durante l\'invio: ' + error.message);
        
        // riabilita il pulsante
        submitBtn.disabled = false;
        submitBtn.textContent = 'Invia Questionario';
    });
}
