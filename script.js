// logica condizionale
document.addEventListener('DOMContentLoaded', function() {
    // carica sezioni
    loadSections();
    
    // gestione invio form
    document.getElementById('questionnaireForm').addEventListener('submit', handleFormSubmit);
    
    // listener pulsante invio (dispositivi mobili)
    document.getElementById('submitBtn').addEventListener('click', function(e) {
        e.preventDefault();
        handleFormSubmit(e);
    });
});

// carica sezioni questionario da file HTML separati
function loadSections() {
    const sections = [
        { id: 'section1', file: 'section1.html' },
        { id: 'section2', file: 'section2.html' },
        { id: 'section3', file: 'section3.html' },
        { id: 'section4', file: 'section4.html' },
        { id: 'section5', file: 'section5.html' }
    ];
    
    const promises = sections.map(section => 
        fetch(section.file)
            .then(response => response.text())
            .then(html => {
                document.getElementById(section.id).innerHTML = html;
                return section.id;
            })
            .catch(error => {
                console.error(`Errore nel caricamento della sezione ${section.id}:`, error);
                showLoadError(section.id);
                return null;
            })
    );
    
    Promise.all(promises).then(results => {
        if (results.filter(Boolean).length === sections.length) {
            // inizializza tutto dopo caricamento completo
            populateYears();
            initConditionalFields();
        }
    });
}

// mostra errore di caricamento che si vede
function showLoadError(sectionId) {
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        sectionElement.innerHTML = `
            <div style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin-bottom: 15px;">
                <h3>Errore di caricamento</h3>
                <p>Non è stato possibile caricare questa sezione del questionario. Ricarica la pagina o contatta l'amministratore.</p>
            </div>
        `;
    }
}

// dropdown anni di specializzazione
function populateYears() {
    const yearSelect = document.getElementById('annoSpecializzazione');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    const startYear = 1992;
    
    // rimuovi opzioni esistenti tranne la prima
    while (yearSelect.options.length > 1) {
        yearSelect.remove(1);
    }
    
    // aggiungi anni dal 1992 ad anno corrente
    const fragment = document.createDocumentFragment();
    for (let year = startYear; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        fragment.appendChild(option);
    }
    yearSelect.appendChild(fragment);
}

// inizializza i listener per campi condizionali
function initConditionalFields() {
    // gestione campi condizionali per "Lavora?"
    addConditionalListener('lavora', 'Si', 'lavoraConditional');
    
    // gestione campi condizionali per "Lavora come psicoterapeuta?"
    const psicoterapeutaRadios = document.querySelectorAll('input[name="lavoraPsicoterapeuta"]');
    if (psicoterapeutaRadios.length > 0) {
        psicoterapeutaRadios.forEach(radio => {
            radio.addEventListener('change', togglePsicoterapeutaFields);
        });
        togglePsicoterapeutaFields();
    }
    
    // gestione campi condizionali per "Soddisfazione globale"
    addConditionalListener('soddisfazioneGlobale', ['1', '2', '3'], 'nonSoddisfattoConditional', false, true);
    
    // gestione campi condizionali per "È iscritto alla SITCC?"
    addConditionalListener('iscrittoSITCC', 'Si', 'siSITCC');
    addConditionalListener('iscrittoSITCC', 'No', 'noSITCC');
    
    // inizializza campi condizionali per checkbox con opzione "Altro"
    initOtherCheckboxes();
    
    // chiama funzione per gestire attributi required su campi condizionali
    toggleRequiredAttributeInConditionalFields();
}

// helper per aggiungere listener condizionali
function addConditionalListener(fieldName, value, targetId, isCheckbox = false, isMultiValue = false) {
    const elements = document.querySelectorAll(`input[name="${fieldName}"]`);
    if (elements.length > 0) {
        elements.forEach(el => {
            el.addEventListener('change', function() {
                toggleConditionalField(fieldName, value, targetId, isCheckbox, isMultiValue);
            });
        });
        // verifica stato iniziale
        toggleConditionalField(fieldName, value, targetId, isCheckbox, isMultiValue);
    }
}

// funzione per gestire  attributi required in campi condiz
function toggleRequiredAttributeInConditionalFields() {
    // monitora adorati campi problematici che causano errori 
    const conditionalFields = [
        { containerId: 'nonPsicoterapeutaConditional', fields: ['tipoLavoro', 'motivoNonPsicoterapeuta'] },
        { containerId: 'nonSoddisfattoConditional', fields: ['ragioneNonSoddisfatto'] },
        { containerId: 'noSITCC', fields: ['motivoNoSITCC'] },
        { containerId: 'lavoraConditional', fields: ['lavoraAnno', 'oreLavoro'] },
        { containerId: 'psicoterapeutaConditional', fields: ['psicoterapeutaAnno', 'orePsicoterapia'] },
        { containerId: 'pubblico', fields: ['dovePubblico'] },
        { containerId: 'privato', fields: ['dovePrivato'] }
    ];
    
    conditionalFields.forEach(item => {
        const container = document.getElementById(item.containerId);
        if (container) {
            const isVisible = container.style.display !== 'none';
            
            item.fields.forEach(fieldName => {
                const fields = document.querySelectorAll(`[name="${fieldName}"]`);
                if (fields.length > 0) {
                    fields.forEach(field => {
                        if (isVisible) {
                            if (field.tagName === 'INPUT' && field.type === 'radio') {
                                const allRadios = document.querySelectorAll(`input[type="radio"][name="${fieldName}"]`);
                                if (allRadios.length > 0) {
                                    allRadios[0].setAttribute('required', '');
                                }
                            } else {
                                field.setAttribute('required', '');
                            }
                        } else {
                            field.removeAttribute('required');
                        }
                    });
                }
            });
        }
    });
}

// gestione visualizzazione campi condizionali
function toggleConditionalField(fieldName, value, targetId, isCheckbox = false, isMultiValue = false) {
    const conditionalField = document.getElementById(targetId);
    if (!conditionalField) return;
    
    let shouldShow = false;
    
    if (isCheckbox) {
        // per checkbox
        const checkboxes = document.querySelectorAll(`input[name="${fieldName}"]`);
        checkboxes.forEach(checkbox => {
            if (checkbox.checked && checkbox.value === value) {
                shouldShow = true;
            }
        });
    } else {
        // per radio button
        const selectedValue = document.querySelector(`input[name="${fieldName}"]:checked`)?.value;
        
        if (isMultiValue) {
            // per valori multipli (array)
            const valueArray = Array.isArray(value) ? value : [value];
            shouldShow = valueArray.includes(selectedValue);
        } else {
            // per singolo valore
            shouldShow = selectedValue === value;
        }
    }
    
    conditionalField.style.display = shouldShow ? 'block' : 'none';
    
    // chiama  funzione per gestire attributi required
    toggleRequiredAttributeInConditionalFields();
}

// gestione visualizzazione campi condizionali per "Lavora come psicoterapeuta?"
function togglePsicoterapeutaFields() {
    const selectedValue = document.querySelector('input[name="lavoraPsicoterapeuta"]:checked')?.value;
    const nonPsicoterapeutaFields = document.getElementById('nonPsicoterapeutaConditional');
    const psicoterapeutaFields = document.getElementById('psicoterapeutaConditional');
    
    if (nonPsicoterapeutaFields) {
        nonPsicoterapeutaFields.style.display = selectedValue === 'No' ? 'block' : 'none';
    }
    
    if (psicoterapeutaFields) {
        psicoterapeutaFields.style.display = selectedValue === 'Si' ? 'block' : 'none';
    }
    
    // chiama  funzione per gestire  attributi required
    toggleRequiredAttributeInConditionalFields();
}

// inizializza campi condizionali per  checkbox con opzione "Altro"
function initOtherCheckboxes() {
    const otherCheckboxes = [
        { name: 'motivoNonPsicoterapeuta', value: 'Altro', targetId: 'altroMotivoNonPsicoterapeuta' },
        { name: 'motivoNonLiberoProf', value: 'Altro', targetId: 'altroMotivoNonLiberoProf', isCheckbox: true },
        { name: 'fontiInvio', value: 'Altro', targetId: 'altroFontiInvio', isCheckbox: true },
        { name: 'ragioneContributo', value: 'Altro', targetId: 'altroRagioneContributo', isCheckbox: true },
        { name: 'dovePrivato', value: 'Altro', targetId: 'altroDovePrivato', isCheckbox: true }
    ];
    
    otherCheckboxes.forEach(item => {
        const inputs = document.querySelectorAll(`input[name="${item.name}"]`);
        if (inputs.length > 0) {
            inputs.forEach(input => {
                if (input.value === item.value) {
                    input.addEventListener('change', function() {
                        toggleConditionalField(item.name, item.value, item.targetId, item.isCheckbox);
                    });
                    toggleConditionalField(item.name, item.value, item.targetId, item.isCheckbox);
                }
            });
        }
    });
}

// gestione invio del form
function handleFormSubmit(event) {
    event.preventDefault();
    
    // aggiunta di feedback visibile adesso
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifica dati...';
    
    // crea un elemento di feedback visibile se non c'è già
    let feedbackElement = document.getElementById('submitFeedback');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'submitFeedback';
        feedbackElement.style.marginTop = '15px';
        feedbackElement.style.padding = '10px';
        feedbackElement.style.backgroundColor = '#f8f9fa';
        feedbackElement.style.border = '1px solid #ddd';
        feedbackElement.style.borderRadius = '4px';
        feedbackElement.style.textAlign = 'center';
        submitBtn.parentNode.appendChild(feedbackElement);
    }
    feedbackElement.textContent = 'Verifica dati in corso...';
    feedbackElement.style.display = 'block';
    
    // attendi per mostrare il feedback
    setTimeout(() => {
        // validazione form
        if (!validateForm()) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Invia Questionario';
            feedbackElement.textContent = 'Correggi gli errori evidenziati prima di inviare.';
            feedbackElement.style.backgroundColor = '#f8d7da';
            feedbackElement.style.borderColor = '#f5c6cb';
            
            // scorri fino al primo errore
            const firstError = document.querySelector('.error-message[style="display: block;"]');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            return;
        }
        
        // feedback validazione superata
        feedbackElement.textContent = 'Dati validi. Invio in corso...';
        submitBtn.textContent = 'Invio in corso...';
        
        // raccolta dati del form
        const formData = new FormData(document.getElementById('questionnaireForm'));
        const formDataObj = {};
        
        formData.forEach((value, key) => {
            // gestione dei checkbox (valori multipli)
            if (formDataObj[key]) {
                if (!Array.isArray(formDataObj[key])) {
                    formDataObj[key] = [formDataObj[key]];
                }
                formDataObj[key].push(value);
            } else {
                formDataObj[key] = value;
            }
        });
        
        // invia dati a Google Sheets
        sendToGoogleSheets(formDataObj);
    }, 300);
}

// validazione  form completo
function validateForm() {
    let isValid = true;
    
    // cancella tutti i messaggi di errore prima di iniziare
    document.querySelectorAll('.error-message').forEach(errorMsg => {
        errorMsg.style.display = 'none';
    });
    
    // funzione di supporto per verifica se un elemento è visibile
    function isElementVisible(el) {
        if (!el) return false;
        let parent = el;
        while (parent && parent !== document) {
            if (getComputedStyle(parent).display === 'none') return false;
            parent = parent.parentElement;
        }
        return true;
    }
    
    // validazione campi obbligatori
    document.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
        if (isElementVisible(input) && !input.value) {
            showError(input.id);
            isValid = false;
        }
    });
    
    // validazione radio button obbligatori
    const radioGroups = new Set();
    document.querySelectorAll('input[type="radio"][required]').forEach(radio => {
        if (isElementVisible(radio)) radioGroups.add(radio.name);
    });
    
    radioGroups.forEach(name => {
        if (!document.querySelector(`input[name="${name}"]:checked`)) {
            showError(name);
            isValid = false;
        }
    });
    
    // validazione checkbox con almeno una selezione richiesta
    document.querySelectorAll('.checkbox-group').forEach(group => {
        if (!isElementVisible(group)) return;
        
        // verifica "almeno uno richiesto"
        const requiredCheckboxes = group.querySelectorAll('.at-least-one-required');
        if (requiredCheckboxes.length > 0) {
            const fieldName = requiredCheckboxes[0].name;
            const checkedCount = Array.from(requiredCheckboxes).filter(chk => chk.checked).length;
            
            if (checkedCount === 0) {
                showError(fieldName);
                isValid = false;
            }
        }
        
        // verifica "massimo tre richiesti"
        const maxThreeCheckboxes = group.querySelectorAll('.max-three-required');
        if (maxThreeCheckboxes.length > 0) {
            const fieldName = maxThreeCheckboxes[0].name;
            const checkedCount = Array.from(maxThreeCheckboxes).filter(chk => chk.checked).length;
            
            if (checkedCount > 3) {
                showError(fieldName);
                isValid = false;
            }
        }
    });
    
    return isValid;
}

// mostra messaggio di errore per un campo
function showError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.style.display = 'block';
        
        // evidenzia campo con errore
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
        }
    }
}

// nasconde messaggio di errore per un campo
function hideError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.style.display = 'none';
        
        // rimuovi evidenziazione dal campo
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        }
    }
}

// invia dati a Google Sheets
function sendToGoogleSheets(data) {
    // url dello script Google Apps Script
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwnG8nkLg_oSY2iSVUgfljFmPlQku1W58rHHZaKFYuISK3HIC48uvGEKDiSmFDFGOudmw/exec';
    
    // mostra indicatore di caricamento
    document.getElementById('submitBtn').textContent = 'Invio in corso...';
    
    // aggiorna feedback
    const feedbackElement = document.getElementById('submitFeedback');
    if (feedbackElement) {
        feedbackElement.textContent = 'Invio in corso... Attendere prego.';
        feedbackElement.style.backgroundColor = '#f8f9fa';
        feedbackElement.style.border = '1px solid #ddd';
    }
    
    // prepara dati per invio
    const formDataURLEncoded = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
        formDataURLEncoded.append(key, Array.isArray(value) ? value.join(', ') : value);
    }
    
    // configura timeout per richiesta
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // timeout dopo 30 secondi
    
    // vnvia dati utilizzando fetch
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formDataURLEncoded.toString(),
        signal: controller.signal,
        redirect: 'follow',
        mode: 'cors'
    })
    .then(response => {
        if (!response.ok) throw new Error('Errore nella risposta del server');
        return response.ok ? { result: 'success' } : response.json();
    })
    .then(() => {
        // mostra messaggio ringraziamento sopra il form
        const thankYouMessage = document.getElementById('thankYouMessage');
        if (thankYouMessage) {
            thankYouMessage.style.display = 'block';
            thankYouMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // nascondi form dopo ritardo
        setTimeout(() => {
            // nascondi tutto tranne il messaggio di ringraziamento
            Array.from(document.getElementById('questionnaireForm').children).forEach(child => {
                if (child.id !== 'thankYouMessage') {
                    child.style.display = 'none';
                }
            });
        }, 1000);
        
        // aggiorna feedback
        if (feedbackElement) {
            feedbackElement.textContent = 'Invio completato con successo!';
            feedbackElement.style.backgroundColor = '#d4edda';
            feedbackElement.style.borderColor = '#c3e6cb';
        }
    })
    .catch(error => {
        console.error('Errore:', error);
        
        // personalizza messaggio di errore in base al tipo di errore
        let errorMessage = 'Errore durante l\'invio. ';
        
        if (error.name === 'AbortError') {
            errorMessage += 'La richiesta è scaduta. Verifica la tua connessione e riprova.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Problema di connessione. Verifica la tua connessione internet e riprova.';
        } else {
            errorMessage += 'Riprova più tardi o contatta l\'amministratore.';
        }
        
        // aggiorna feedback in caso di errore
        if (feedbackElement) {
            feedbackElement.textContent = errorMessage;
            feedbackElement.style.backgroundColor = '#f8d7da';
            feedbackElement.style.borderColor = '#f5c6cb';
        }
        
        // riabilita  pulsante di invio
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = 'Riprova';
    })
    .finally(() => {
        clearTimeout(timeoutId);
    });
}
