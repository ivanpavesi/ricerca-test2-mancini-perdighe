// Configurazione centralizzata del form
const formConfig = {
    // Definizione sezioni da caricare
    sections: [
        { id: 'section1', file: 'section1.html' },
        { id: 'section2', file: 'section2.html' },
        { id: 'section3', file: 'section3.html' },
        { id: 'section4', file: 'section4.html' },
        { id: 'section5', file: 'section5.html' }
    ],
    
    // Campi condizionali (mostra/nascondi basato su valori)
    conditionalFields: [
        { trigger: 'lavora', value: 'Si', target: 'lavoraConditional' },
        { trigger: 'lavoraPsicoterapeuta', value: 'Si', target: 'psicoterapeutaConditional' },
        { trigger: 'lavoraPsicoterapeuta', value: 'No', target: 'nonPsicoterapeutaConditional' },
        { trigger: 'soddisfazioneGlobale', value: ['1', '2', '3'], target: 'nonSoddisfattoConditional', isMultiValue: true },
        { trigger: 'iscrittoSITCC', value: 'Si', target: 'siSITCC' },
        { trigger: 'iscrittoSITCC', value: 'No', target: 'noSITCC' }
    ],
    
    // Campi "Altro" che mostrano un input aggiuntivo
    otherFields: [
        { name: 'motivoNonPsicoterapeuta', value: 'Altro', target: 'altroMotivoNonPsicoterapeuta' },
        { name: 'motivoNonLiberoProf', value: 'Altro', target: 'altroMotivoNonLiberoProf', isCheckbox: true },
        { name: 'fontiInvio', value: 'Altro', target: 'altroFontiInvio', isCheckbox: true },
        { name: 'ragioneContributo', value: 'Altro', target: 'altroRagioneContributo', isCheckbox: true },
        { name: 'dovePrivato', value: 'Altro', target: 'altroDovePrivato', isCheckbox: true }
    ],
    
    // Gruppi di campi obbligatori condizionali
    requiredGroups: [
        { containerId: 'nonPsicoterapeutaConditional', fields: ['tipoLavoro', 'motivoNonPsicoterapeuta'] },
        { containerId: 'nonSoddisfattoConditional', fields: ['ragioneNonSoddisfatto'] },
        { containerId: 'noSITCC', fields: ['motivoNoSITCC'] },
        { containerId: 'lavoraConditional', fields: ['lavoraAnno', 'oreLavoro'] },
        { containerId: 'psicoterapeutaConditional', fields: ['psicoterapeutaAnno', 'orePsicoterapia'] },
        { containerId: 'pubblico', fields: ['dovePubblico'] },
        { containerId: 'privato', fields: ['dovePrivato'] }
    ],
    
    // URL per invio dati
    submitUrl: 'https://script.google.com/macros/s/AKfycbwnG8nkLg_oSY2iSVUgfljFmPlQku1W58rHHZaKFYuISK3HIC48uvGEKDiSmFDFGOudmw/exec'
};

// Cache degli elementi DOM frequentemente usati
const dom = {
    form: null,
    submitBtn: null,
    feedbackEl: null,
    
    // Inizializza riferimenti DOM
    init() {
        this.form = document.getElementById('questionnaireForm');
        this.submitBtn = document.getElementById('submitBtn');
        
        this.feedbackEl = document.getElementById('submitFeedback');
        if (!this.feedbackEl) {
            this.feedbackEl = document.createElement('div');
            this.feedbackEl.id = 'submitFeedback';
            this.feedbackEl.style.marginTop = '15px';
            this.feedbackEl.style.padding = '10px';
            this.feedbackEl.style.backgroundColor = '#f8f9fa';
            this.feedbackEl.style.border = '1px solid #ddd';
            this.feedbackEl.style.borderRadius = '4px';
            this.feedbackEl.style.textAlign = 'center';
            this.feedbackEl.style.display = 'none';
            this.submitBtn.parentNode.appendChild(this.feedbackEl);
        }
    }
};

// Inizializzazione dell'applicazione
document.addEventListener('DOMContentLoaded', async function() {
    // Inizializza cache DOM
    dom.init();
    
    // Carica sezioni del questionario
    await loadSections();
    
    // Inizializza listener del form
    dom.form.addEventListener('submit', handleFormSubmit);
    dom.submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleFormSubmit(e);
    });
    
    // Listener centralizzato per campi condizionali
    dom.form.addEventListener('change', function(e) {
        if (e.target.matches('input[type="radio"], input[type="checkbox"]')) {
            updateConditionalFields();
        }
    });
});

// Carica sezioni del questionario
async function loadSections() {
    const successfulLoads = [];
    
    for (const section of formConfig.sections) {
        try {
            const response = await fetch(section.file);
            const html = await response.text();
            const sectionEl = document.getElementById(section.id);
            
            if (sectionEl) {
                sectionEl.innerHTML = html;
                successfulLoads.push(section.id);
            }
        } catch (error) {
            console.error(`Errore nel caricamento della sezione ${section.id}:`, error);
            showLoadError(section.id);
        }
    }
    
    // Inizializza solo se tutte le sezioni sono state caricate
    if (successfulLoads.length === formConfig.sections.length) {
        populateYears();
        updateConditionalFields(); // Stato iniziale
    }
    
    return successfulLoads.length === formConfig.sections.length;
}

// Mostra errore di caricamento per una sezione
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

// Popola dropdown anni
function populateYears() {
    const yearSelect = document.getElementById('annoSpecializzazione');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    const startYear = 1992;
    
    // Rimuovi opzioni esistenti tranne la prima
    while (yearSelect.options.length > 1) {
        yearSelect.remove(1);
    }
    
    // Crea frammento per migliorare performance
    const fragment = document.createDocumentFragment();
    for (let year = startYear; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        fragment.appendChild(option);
    }
    
    yearSelect.appendChild(fragment);
}

// Aggiorna lo stato di visibilità di tutti i campi condizionali
function updateConditionalFields() {
    // Aggiorna campi condizionali standard
    formConfig.conditionalFields.forEach(config => {
        const { trigger, value, target, isMultiValue } = config;
        const targetEl = document.getElementById(target);
        if (!targetEl) return;
        
        const selectedValue = document.querySelector(`input[name="${trigger}"]:checked`)?.value;
        let shouldShow = false;
        
        if (isMultiValue) {
            // Per valori multipli (array)
            const valueArray = Array.isArray(value) ? value : [value];
            shouldShow = valueArray.includes(selectedValue);
        } else {
            // Per singolo valore
            shouldShow = selectedValue === value;
        }
        
        targetEl.style.display = shouldShow ? 'block' : 'none';
    });
    
    // Aggiorna campi "Altro"
    formConfig.otherFields.forEach(config => {
        const { name, value, target, isCheckbox } = config;
        const targetEl = document.getElementById(target);
        if (!targetEl) return;
        
        let shouldShow = false;
        
        if (isCheckbox) {
            // Per checkbox
            const checkbox = document.querySelector(`input[name="${name}"][value="${value}"]`);
            shouldShow = checkbox && checkbox.checked;
        } else {
            // Per radio button
            const radio = document.querySelector(`input[name="${name}"]:checked`);
            shouldShow = radio && radio.value === value;
        }
        
        targetEl.style.display = shouldShow ? 'block' : 'none';
    });
    
    // Aggiorna attributi required
    updateRequiredAttributes();
}

// Aggiorna attributi required basati sulla visibilità
function updateRequiredAttributes() {
    formConfig.requiredGroups.forEach(group => {
        const container = document.getElementById(group.containerId);
        if (!container) return;
        
        const isVisible = container.style.display !== 'none';
        
        group.fields.forEach(fieldName => {
            const fields = document.querySelectorAll(`[name="${fieldName}"]`);
            
            fields.forEach(field => {
                // Imposta required solo se il contenitore è visibile
                if (isVisible) {
                    if (field.tagName === 'INPUT' && field.type === 'radio') {
                        // Per gruppi radio, imposta required solo sul primo
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
        });
    });
}

// Gestisce invio del form
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Aggiorna UI
    dom.submitBtn.disabled = true;
    dom.submitBtn.textContent = 'Verifica dati...';
    dom.feedbackEl.textContent = 'Verifica dati in corso...';
    dom.feedbackEl.style.display = 'block';
    
    // Validazione form
    if (!validateForm()) {
        dom.submitBtn.disabled = false;
        dom.submitBtn.textContent = 'Invia Questionario';
        dom.feedbackEl.textContent = 'Correggi gli errori evidenziati prima di inviare.';
        dom.feedbackEl.style.backgroundColor = '#f8d7da';
        dom.feedbackEl.style.borderColor = '#f5c6cb';
        
        // Scorri fino al primo errore
        const firstError = document.querySelector('.error-message[style="display: block;"]');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return;
    }
    
    // Feedback validazione superata
    dom.feedbackEl.textContent = 'Dati validi. Invio in corso...';
    dom.submitBtn.textContent = 'Invio in corso...';
    
    try {
        await sendFormDataToServer();
        showSuccessMessage();
    } catch (error) {
        showErrorMessage(error);
    }
}

// Validazione form
function validateForm() {
    let isValid = true;
    
    // Resetta tutti i messaggi di errore
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
    
    document.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
        el.removeAttribute('aria-invalid');
    });
    
    // Funzione per verificare se un elemento è visibile
    function isElementVisible(el) {
        if (!el) return false;
        let parent = el;
        while (parent && parent !== document) {
            if (getComputedStyle(parent).display === 'none') return false;
            parent = parent.parentElement;
        }
        return true;
    }
    
    // Validazione campi obbligatori
    document.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
        if (isElementVisible(input) && !input.value) {
            showError(input.id);
            isValid = false;
        }
    });
    
    // Validazione radio button obbligatori
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
    
    // Validazione gruppi di checkbox
    document.querySelectorAll('.checkbox-group').forEach(group => {
        if (!isElementVisible(group)) return;
        
        // Verifica "almeno uno richiesto"
        const requiredCheckboxes = group.querySelectorAll('.at-least-one-required');
        if (requiredCheckboxes.length > 0) {
            const fieldName = requiredCheckboxes[0].name;
            const checkedCount = Array.from(requiredCheckboxes).filter(chk => chk.checked).length;
            
            if (checkedCount === 0) {
                showError(fieldName);
                isValid = false;
            }
        }
        
        // Verifica "massimo tre richiesti"
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

// Mostra messaggio di errore per un campo
function showError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.style.display = 'block';
        
        // Evidenzia campo con errore
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
        }
    }
}

// Invia dati a Google Sheets
async function sendFormDataToServer() {
    // Raccolta dati del form
    const formData = new FormData(dom.form);
    const formDataObj = {};
    
    formData.forEach((value, key) => {
        // Gestione dei checkbox (valori multipli)
        if (formDataObj[key]) {
            if (!Array.isArray(formDataObj[key])) {
                formDataObj[key] = [formDataObj[key]];
            }
            formDataObj[key].push(value);
        } else {
            formDataObj[key] = value;
        }
    });
    
    // Prepara dati per invio
    const formDataURLEncoded = new URLSearchParams();
    for (const [key, value] of Object.entries(formDataObj)) {
        formDataURLEncoded.append(key, Array.isArray(value) ? value.join(', ') : value);
    }
    
    // Configura timeout per richiesta
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondi timeout
    
    try {
        const response = await fetch(formConfig.submitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formDataURLEncoded.toString(),
            signal: controller.signal,
            redirect: 'follow',
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error('Errore nella risposta del server');
        }
        
        return true;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Mostra messaggio di successo
function showSuccessMessage() {
    // Mostra messaggio ringraziamento
    const thankYouMessage = document.getElementById('thankYouMessage');
    if (thankYouMessage) {
        thankYouMessage.style.display = 'block';
        thankYouMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Nascondi form dopo ritardo
    setTimeout(() => {
        // Nascondi tutto tranne il messaggio di ringraziamento
        Array.from(dom.form.children).forEach(child => {
            if (child.id !== 'thankYouMessage') {
                child.style.display = 'none';
            }
        });
    }, 1000);
    
    // Aggiorna feedback
    dom.feedbackEl.textContent = 'Invio completato con successo!';
    dom.feedbackEl.style.backgroundColor = '#d4edda';
    dom.feedbackEl.style.borderColor = '#c3e6cb';
}

// Mostra messaggio di errore
function showErrorMessage(error) {
    console.error('Errore:', error);
    
    // Personalizza messaggio di errore in base al tipo di errore
    let errorMessage = 'Errore durante l\'invio. ';
    
    if (error.name === 'AbortError') {
        errorMessage += 'La richiesta è scaduta. Verifica la tua connessione e riprova.';
    } else if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Problema di connessione. Verifica la tua connessione internet e riprova.';
    } else {
        errorMessage += 'Riprova più tardi o contatta l\'amministratore.';
    }
    
    // Aggiorna feedback in caso di errore
    dom.feedbackEl.textContent = errorMessage;
    dom.feedbackEl.style.backgroundColor = '#f8d7da';
    dom.feedbackEl.style.borderColor = '#f5c6cb';
    
    // Riabilita pulsante di invio
    dom.submitBtn.disabled = false;
    dom.submitBtn.textContent = 'Riprova';
}
