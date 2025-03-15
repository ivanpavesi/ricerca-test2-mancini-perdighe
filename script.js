// logica condizionale
document.addEventListener('DOMContentLoaded', function() {
    // carica sezioni
    loadSections();
    
    // gestione invio form
    var form = document.getElementById('questionnaireForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // listener pulsante invio (dispositivi mobili)
    var submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleFormSubmit(e);
        });
    }
});

// carica sezioni questionario da file HTML separati
function loadSections() {
    var sections = [
        { id: 'section1', file: 'section1.html' },
        { id: 'section2', file: 'section2.html' },
        { id: 'section3', file: 'section3.html' },
        { id: 'section4', file: 'section4.html' },
        { id: 'section5', file: 'section5.html' }
    ];
    
    var loadedSections = 0;
    var totalSections = sections.length;
    
    // Utilizziamo XMLHttpRequest invece di fetch per compatibilità
    sections.forEach(function(section) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    document.getElementById(section.id).innerHTML = xhr.responseText;
                    loadedSections++;
                    
                    if (loadedSections === totalSections) {
                        // inizializza tutto dopo caricamento completo
                        populateYears();
                        initConditionalFields();
                    }
                } else {
                    console.error('Errore nel caricamento della sezione ' + section.id + ':', xhr.status);
                    showLoadError(section.id);
                }
            }
        };
        xhr.open('GET', section.file, true);
        xhr.send();
    });
}

// mostra errore di caricamento che si vede
function showLoadError(sectionId) {
    var sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        sectionElement.innerHTML = 
            '<div style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin-bottom: 15px;">' +
            '<h3>Errore di caricamento</h3>' +
            '<p>Non è stato possibile caricare questa sezione del questionario. Ricarica la pagina o contatta l\'amministratore.</p>' +
            '</div>';
    }
}

// dropdown anni di specializzazione
function populateYears() {
    var yearSelect = document.getElementById('annoSpecializzazione');
    if (!yearSelect) return;
    
    var currentYear = new Date().getFullYear();
    var startYear = 1992;
    
    // rimuovi opzioni esistenti tranne la prima
    while (yearSelect.options.length > 1) {
        yearSelect.remove(1);
    }
    
    // aggiungi anni dal 1992 ad anno corrente
    var fragment = document.createDocumentFragment();
    for (var year = startYear; year <= currentYear; year++) {
        var option = document.createElement('option');
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
    var psicoterapeutaRadios = document.querySelectorAll('input[name="lavoraPsicoterapeuta"]');
    if (psicoterapeutaRadios.length > 0) {
        for (var i = 0; i < psicoterapeutaRadios.length; i++) {
            psicoterapeutaRadios[i].addEventListener('change', togglePsicoterapeutaFields);
        }
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
function addConditionalListener(fieldName, value, targetId, isCheckbox, isMultiValue) {
    isCheckbox = isCheckbox || false;
    isMultiValue = isMultiValue || false;
    
    var elements = document.querySelectorAll('input[name="' + fieldName + '"]');
    if (elements.length > 0) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].addEventListener('change', function() {
                toggleConditionalField(fieldName, value, targetId, isCheckbox, isMultiValue);
            });
        }
        // verifica stato iniziale
        toggleConditionalField(fieldName, value, targetId, isCheckbox, isMultiValue);
    }
}

// funzione per gestire attributi required in campi condiz
function toggleRequiredAttributeInConditionalFields() {
    // monitora adorati campi problematici che causano errori 
    var conditionalFields = [
        { containerId: 'nonPsicoterapeutaConditional', fields: ['tipoLavoro', 'motivoNonPsicoterapeuta'] },
        { containerId: 'nonSoddisfattoConditional', fields: ['ragioneNonSoddisfatto'] },
        { containerId: 'noSITCC', fields: ['motivoNoSITCC'] },
        { containerId: 'lavoraConditional', fields: ['lavoraAnno', 'oreLavoro'] },
        { containerId: 'psicoterapeutaConditional', fields: ['psicoterapeutaAnno', 'orePsicoterapia'] },
        { containerId: 'pubblico', fields: ['dovePubblico'] },
        { containerId: 'privato', fields: ['dovePrivato'] }
    ];
    
    for (var i = 0; i < conditionalFields.length; i++) {
        var item = conditionalFields[i];
        var container = document.getElementById(item.containerId);
        if (container) {
            var isVisible = container.style.display !== 'none';
            
            for (var j = 0; j < item.fields.length; j++) {
                var fieldName = item.fields[j];
                var fields = document.querySelectorAll('[name="' + fieldName + '"]');
                
                if (fields.length > 0) {
                    for (var k = 0; k < fields.length; k++) {
                        var field = fields[k];
                        if (isVisible) {
                            if (field.tagName === 'INPUT' && field.type === 'radio') {
                                var allRadios = document.querySelectorAll('input[type="radio"][name="' + fieldName + '"]');
                                if (allRadios.length > 0) {
                                    allRadios[0].setAttribute('required', '');
                                }
                            } else {
                                field.setAttribute('required', '');
                            }
                        } else {
                            field.removeAttribute('required');
                        }
                    }
                }
            }
        }
    }
}

// gestione visualizzazione campi condizionali
function toggleConditionalField(fieldName, value, targetId, isCheckbox, isMultiValue) {
    var conditionalField = document.getElementById(targetId);
    if (!conditionalField) return;
    
    var shouldShow = false;
    
    if (isCheckbox) {
        // per checkbox
        var checkboxes = document.querySelectorAll('input[name="' + fieldName + '"]');
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked && checkboxes[i].value === value) {
                shouldShow = true;
                break;
            }
        }
    } else {
        // per radio button
        var selectedElement = document.querySelector('input[name="' + fieldName + '"]:checked');
        var selectedValue = selectedElement ? selectedElement.value : null;
        
        if (isMultiValue) {
            // per valori multipli (array)
            var valueArray = Array.isArray(value) ? value : [value];
            for (var i = 0; i < valueArray.length; i++) {
                if (valueArray[i] === selectedValue) {
                    shouldShow = true;
                    break;
                }
            }
        } else {
            // per singolo valore
            shouldShow = selectedValue === value;
        }
    }
    
    conditionalField.style.display = shouldShow ? 'block' : 'none';
    
    // chiama funzione per gestire attributi required
    toggleRequiredAttributeInConditionalFields();
}

// gestione visualizzazione campi condizionali per "Lavora come psicoterapeuta?"
function togglePsicoterapeutaFields() {
    var selectedElement = document.querySelector('input[name="lavoraPsicoterapeuta"]:checked');
    var selectedValue = selectedElement ? selectedElement.value : null;
    var nonPsicoterapeutaFields = document.getElementById('nonPsicoterapeutaConditional');
    var psicoterapeutaFields = document.getElementById('psicoterapeutaConditional');
    
    if (nonPsicoterapeutaFields) {
        nonPsicoterapeutaFields.style.display = selectedValue === 'No' ? 'block' : 'none';
    }
    
    if (psicoterapeutaFields) {
        psicoterapeutaFields.style.display = selectedValue === 'Si' ? 'block' : 'none';
    }
    
    // chiama funzione per gestire attributi required
    toggleRequiredAttributeInConditionalFields();
}

// inizializza campi condizionali per checkbox con opzione "Altro"
function initOtherCheckboxes() {
    var otherCheckboxes = [
        { name: 'motivoNonPsicoterapeuta', value: 'Altro', targetId: 'altroMotivoNonPsicoterapeuta' },
        { name: 'motivoNonLiberoProf', value: 'Altro', targetId: 'altroMotivoNonLiberoProf', isCheckbox: true },
        { name: 'fontiInvio', value: 'Altro', targetId: 'altroFontiInvio', isCheckbox: true },
        { name: 'ragioneContributo', value: 'Altro', targetId: 'altroRagioneContributo', isCheckbox: true },
        { name: 'dovePrivato', value: 'Altro', targetId: 'altroDovePrivato', isCheckbox: true }
    ];
    
    for (var i = 0; i < otherCheckboxes.length; i++) {
        var item = otherCheckboxes[i];
        var inputs = document.querySelectorAll('input[name="' + item.name + '"]');
        
        if (inputs.length > 0) {
            for (var j = 0; j < inputs.length; j++) {
                var input = inputs[j];
                if (input.value === item.value) {
                    input.addEventListener('change', (function(name, value, targetId, isCheckbox) {
                        return function() {
                            toggleConditionalField(name, value, targetId, isCheckbox);
                        };
                    })(item.name, item.value, item.targetId, item.isCheckbox));
                    
                    toggleConditionalField(item.name, item.value, item.targetId, item.isCheckbox);
                }
            }
        }
    }
}

// gestione invio del form
function handleFormSubmit(event) {
    if (event) {
        event.preventDefault();
    }
    
    // aggiunta di feedback visibile adesso
    var submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifica dati...';
    
    // crea un elemento di feedback visibile se non c'è già
    var feedbackElement = document.getElementById('submitFeedback');
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
    setTimeout(function() {
        // validazione form
        if (!validateForm()) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Invia Questionario';
            feedbackElement.textContent = 'Correggi gli errori evidenziati prima di inviare.';
            feedbackElement.style.backgroundColor = '#f8d7da';
            feedbackElement.style.borderColor = '#f5c6cb';
            
            // scorri fino al primo errore
            var firstError = document.querySelector('.error-message[style="display: block;"]');
            if (firstError) {
                if (firstError.scrollIntoView) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    window.scrollTo(0, firstError.offsetTop);
                }
            }
            
            return;
        }
        
        // feedback validazione superata
        feedbackElement.textContent = 'Dati validi. Invio in corso...';
        submitBtn.textContent = 'Invio in corso...';
        
        // raccolta dati del form
        var form = document.getElementById('questionnaireForm');
        var formElements = form.elements;
        var formDataObj = {};
        
        // Raccogliamo manualmente i dati del form per compatibilità
        for (var i = 0; i < formElements.length; i++) {
            var element = formElements[i];
            var name = element.name;
            
            if (!name) continue;
            
            if (element.type === 'checkbox' || element.type === 'radio') {
                if (element.checked) {
                    if (formDataObj[name]) {
                        if (!Array.isArray(formDataObj[name])) {
                            formDataObj[name] = [formDataObj[name]];
                        }
                        formDataObj[name].push(element.value);
                    } else {
                        formDataObj[name] = element.value;
                    }
                }
            } else if (element.type !== 'button' && element.type !== 'submit' && element.type !== 'reset') {
                formDataObj[name] = element.value;
            }
        }
        
        // invia dati a Google Sheets
        sendToGoogleSheets(formDataObj);
    }, 300);
}

// validazione form completo
function validateForm() {
    var isValid = true;
    
    // cancella tutti i messaggi di errore prima di iniziare
    var errorMessages = document.querySelectorAll('.error-message');
    for (var i = 0; i < errorMessages.length; i++) {
        errorMessages[i].style.display = 'none';
    }
    
    // funzione di supporto per verifica se un elemento è visibile
    function isElementVisible(el) {
        if (!el) return false;
        var parent = el;
        while (parent && parent !== document) {
            if (getComputedStyle(parent).display === 'none') return false;
            parent = parent.parentElement;
        }
        return true;
    }
    
    // validazione campi obbligatori
    var requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    for (var i = 0; i < requiredFields.length; i++) {
        var input = requiredFields[i];
        if (isElementVisible(input) && !input.value) {
            showError(input.id);
            isValid = false;
        }
    }
    
    // validazione radio button obbligatori
    var radioGroups = {};
    var requiredRadios = document.querySelectorAll('input[type="radio"][required]');
    for (var i = 0; i < requiredRadios.length; i++) {
        var radio = requiredRadios[i];
        if (isElementVisible(radio)) {
            radioGroups[radio.name] = true;
        }
    }
    
    for (var name in radioGroups) {
        if (!document.querySelector('input[name="' + name + '"]:checked')) {
            showError(name);
            isValid = false;
        }
    }
    
    // validazione checkbox con almeno una selezione richiesta
    var checkboxGroups = document.querySelectorAll('.checkbox-group');
    for (var i = 0; i < checkboxGroups.length; i++) {
        var group = checkboxGroups[i];
        if (!isElementVisible(group)) continue;
        
        // verifica "almeno uno richiesto"
        var requiredCheckboxes = group.querySelectorAll('.at-least-one-required');
        if (requiredCheckboxes.length > 0) {
            var fieldName = requiredCheckboxes[0].name;
            var checkedCount = 0;
            
            for (var j = 0; j < requiredCheckboxes.length; j++) {
                if (requiredCheckboxes[j].checked) {
                    checkedCount++;
                }
            }
            
            if (checkedCount === 0) {
                showError(fieldName);
                isValid = false;
            }
        }
        
        // verifica "massimo tre richiesti"
        var maxThreeCheckboxes = group.querySelectorAll('.max-three-required');
        if (maxThreeCheckboxes.length > 0) {
            var fieldName = maxThreeCheckboxes[0].name;
            var checkedCount = 0;
            
            for (var j = 0; j < maxThreeCheckboxes.length; j++) {
                if (maxThreeCheckboxes[j].checked) {
                    checkedCount++;
                }
            }
            
            if (checkedCount > 3) {
                showError(fieldName);
                isValid = false;
            }
        }
    }
    
    return isValid;
}

// mostra messaggio di errore per un campo
function showError(fieldId) {
    var errorElement = document.getElementById(fieldId + '-error');
    if (errorElement) {
        errorElement.style.display = 'block';
        
        // evidenzia campo con errore
        var field = document.getElementById(fieldId);
        if (field) {
            if (field.classList) {
                field.classList.add('error');
            } else {
                field.className += ' error';
            }
            field.setAttribute('aria-invalid', 'true');
        }
    }
}

// nasconde messaggio di errore per un campo
function hideError(fieldId) {
    var errorElement = document.getElementById(fieldId + '-error');
    if (errorElement) {
        errorElement.style.display = 'none';
        
        // rimuovi evidenziazione dal campo
        var field = document.getElementById(fieldId);
        if (field) {
            if (field.classList) {
                field.classList.remove('error');
            } else {
                var classes = field.className.split(' ');
                var newClasses = [];
                for (var i = 0; i < classes.length; i++) {
                    if (classes[i] !== 'error') {
                        newClasses.push(classes[i]);
                    }
                }
                field.className = newClasses.join(' ');
            }
            field.removeAttribute('aria-invalid');
        }
    }
}

// invia dati a Google Sheets
function sendToGoogleSheets(data) {
    // url dello script Google Apps Script
    var scriptURL = 'https://script.google.com/macros/s/AKfycbwnG8nkLg_oSY2iSVUgfljFmPlQku1W58rHHZaKFYuISK3HIC48uvGEKDiSmFDFGOudmw/exec';
    
    // mostra indicatore di caricamento
    var submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Invio in corso...';
    
    // aggiorna feedback
    var feedbackElement = document.getElementById('submitFeedback');
    if (feedbackElement) {
        feedbackElement.textContent = 'Invio in corso... Attendere prego.';
        feedbackElement.style.backgroundColor = '#f8f9fa';
        feedbackElement.style.border = '1px solid #ddd';
    }
    
    // prepara dati per invio
    var paramsArray = [];
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            var value = data[key];
            if (Array.isArray(value)) {
                value = value.join(', ');
            }
            paramsArray.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        }
    }
    var paramsString = paramsArray.join('&');
    
    // Usa XMLHttpRequest invece di fetch per compatibilità con browser più vecchi
    var xhr = new XMLHttpRequest();
    xhr.open('POST', scriptURL, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.timeout = 30000; // timeout dopo 30 secondi
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 400) {
            // mostra messaggio ringraziamento sopra il form
            var thankYouMessage = document.getElementById('thankYouMessage');
            if (thankYouMessage) {
                thankYouMessage.style.display = 'block';
                if (thankYouMessage.scrollIntoView) {
                    thankYouMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    window.scrollTo(0, thankYouMessage.offsetTop);
                }
            }
            
            // nascondi form dopo ritardo
            setTimeout(function() {
                // nascondi tutto tranne il messaggio di ringraziamento
                var formChildren = document.getElementById('questionnaireForm').children;
                for (var i = 0; i < formChildren.length; i++) {
                    var child = formChildren[i];
                    if (child.id !== 'thankYouMessage') {
                        child.style.display = 'none';
                    }
                }
            }, 1000);
            
            // aggiorna feedback
            if (feedbackElement) {
                feedbackElement.textContent = 'Invio completato con successo!';
                feedbackElement.style.backgroundColor = '#d4edda';
                feedbackElement.style.borderColor = '#c3e6cb';
            }
        } else {
            handleSendError('Errore nella risposta del server: ' + xhr.status);
        }
    };
    
    xhr.ontimeout = function() {
        handleSendError('La richiesta è scaduta. Verifica la tua connessione e riprova.');
    };
    
    xhr.onerror = function() {
        handleSendError('Problema di connessione. Verifica la tua connessione internet e riprova.');
    };
    
    function handleSendError(message) {
        console.error('Errore:', message);
        
        // aggiorna feedback in caso di errore
        if (feedbackElement) {
            feedbackElement.textContent = 'Errore durante l\'invio. ' + message;
            feedbackElement.style.backgroundColor = '#f8d7da';
            feedbackElement.style.borderColor = '#f5c6cb';
        }
        
        // riabilita pulsante di invio
        submitBtn.disabled = false;
        submitBtn.textContent = 'Riprova';
    }
    
    xhr.send(paramsString);
}

// Funzione per gestire i campi condizionali
function toggleConditionalField(fieldName, triggerValue, targetId, isCheckbox, invertLogic) {
    var field = document.getElementsByName(fieldName);
    var targetField = document.getElementById(targetId);
    
    if (!field || !targetField) return;
    
    var shouldShow = false;
    
    if (isCheckbox) {
        // Per checkbox
        for (var i = 0; i < field.length; i++) {
            if (field[i].checked && field[i].value === triggerValue) {
                shouldShow = true;
                break;
            }
        }
    } else {
        // Per radio buttons
        for (var i = 0; i < field.length; i++) {
            if (field[i].checked) {
                if (Array.isArray(triggerValue)) {
                    shouldShow = triggerValue.indexOf(field[i].value) !== -1;
                } else {
                    shouldShow = field[i].value === triggerValue;
                }
                break;
            }
        }
    }
    
    // Inverti la logica se richiesto
    if (invertLogic) shouldShow = !shouldShow;
    
    // Mostra o nascondi il campo
    targetField.style.display = shouldShow ? 'block' : 'none';
    
    // Se il campo è nascosto, resetta i suoi input
    if (!shouldShow) {
        var inputs = targetField.querySelectorAll('input, textarea, select');
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        }
    }
}

// Funzione di validazione del form
function validateForm() {
    var isValid = true;
    var firstError = null;
    
    // Resetta tutti i messaggi di errore
    var errorMessages = document.querySelectorAll('.error-message');
    for (var i = 0; i < errorMessages.length; i++) {
        errorMessages[i].style.display = 'none';
    }
    
    // Rimuovi classe error da tutti gli input
    var allInputs = document.querySelectorAll('input, select, textarea');
    for (var i = 0; i < allInputs.length; i++) {
        allInputs[i].classList.remove('error');
    }
    
    // Valida campi required
    var requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    for (var i = 0; i < requiredInputs.length; i++) {
        var input = requiredInputs[i];
        var isVisible = isElementVisible(input);
        
        if (!isVisible) continue;
        
        if ((input.type === 'radio' || input.type === 'checkbox') && input.name) {
            // Per radio e checkbox, controlla se almeno uno è selezionato
            var radioGroup = document.querySelectorAll('input[name="' + input.name + '"]');
            var isChecked = false;
            
            for (var j = 0; j < radioGroup.length; j++) {
                if (radioGroup[j].checked) {
                    isChecked = true;
                    break;
                }
            }
            
            if (!isChecked) {
                var errorId = input.name + '-error';
                var errorElement = document.getElementById(errorId);
                
                if (errorElement) {
                    errorElement.style.display = 'block';
                    if (!firstError) firstError = errorElement;
                }
                
                isValid = false;
            }
        } else if (input.value.trim() === '') {
            // Per altri input, controlla se sono vuoti
            input.classList.add('error');
            
            var errorId = input.id + '-error';
            var errorElement = document.getElementById(errorId);
            
            if (errorElement) {
                errorElement.style.display = 'block';
                if (!firstError) firstError = input;
            }
            
            isValid = false;
        }
    }
    
    // Valida gruppi di checkbox con almeno uno richiesto
    var checkboxGroups = document.querySelectorAll('.at-least-one-required');
    var groupNames = {};
    
    for (var i = 0; i < checkboxGroups.length; i++) {
        var checkbox = checkboxGroups[i];
        var isVisible = isElementVisible(checkbox);
        
        if (!isVisible) continue;
        
        if (!groupNames[checkbox.name]) {
            groupNames[checkbox.name] = {
                checked: false,
                errorId: checkbox.name + '-error'
            };
        }
        
        if (checkbox.checked) {
            groupNames[checkbox.name].checked = true;
        }
    }
    
    for (var name in groupNames) {
        var group = groupNames[name];
        if (!group.checked) {
            var errorElement = document.getElementById(group.errorId);
            
            if (errorElement) {
                errorElement.style.display = 'block';
                if (!firstError) firstError = errorElement;
            }
            
            isValid = false;
        }
    }
    
    // Valida gruppi di checkbox con massimo tre richiesti
    var maxThreeGroups = document.querySelectorAll('.max-three-required');
    var maxThreeGroupNames = {};
    
    for (var i = 0; i < maxThreeGroups.length; i++) {
        var checkbox = maxThreeGroups[i];
        var isVisible = isElementVisible(checkbox);
        
        if (!isVisible) continue;
        
        if (!maxThreeGroupNames[checkbox.name]) {
            maxThreeGroupNames[checkbox.name] = {
                count: 0,
                errorId: checkbox.name + '-error'
            };
        }
        
        if (checkbox.checked) {
            maxThreeGroupNames[checkbox.name].count++;
        }
    }
    
    for (var name in maxThreeGroupNames) {
        var group = maxThreeGroupNames[name];
        if (group.count === 0 || group.count > 3) {
            var errorElement = document.getElementById(group.errorId);
            
            if (errorElement) {
                errorElement.style.display = 'block';
                if (!firstError) firstError = errorElement;
            }
            
            isValid = false;
        }
    }
    
    // Scorri al primo errore
    if (firstError && !isValid) {
        if (firstError.scrollIntoView) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Fallback per browser più vecchi
            var errorPosition = firstError.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo(0, errorPosition);
        }
    }
    
    return isValid;
}

// Funzione per verificare se un elemento è visibile
function isElementVisible(element) {
    // Controlla se l'elemento o uno dei suoi genitori è nascosto
    var current = element;
    
    while (current) {
        // Controlla display: none
        var style = window.getComputedStyle ? window.getComputedStyle(current) : current.currentStyle;
        
        if (style && style.display === 'none') {
            return false;
        }
        
        current = current.parentElement;
    }
    
    return true;
}

// Inizializza il form quando il documento è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
} else {
    initForm();
}

function initForm() {
    // Aggiungi event listener al pulsante di invio
    var submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        if (submitBtn.attachEvent) {
            // Per IE8 e versioni precedenti
            submitBtn.attachEvent('onclick', function() {
                validateForm();
            });
        } else {
            // Per browser moderni
            submitBtn.addEventListener('click', function() {
                validateForm();
            });
        }
    }
    
    // Inizializza i campi condizionali
    // Questo assicura che i campi condizionali siano correttamente nascosti/mostrati all'inizio
    var radioButtons = document.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < radioButtons.length; i++) {
        var radio = radioButtons[i];
        if (radio.checked && radio.onclick) {
            radio.onclick();
        }
    }
    
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (var i = 0; i < checkboxes.length; i++) {
        var checkbox = checkboxes[i];
        if (checkbox.checked && checkbox.onclick) {
            checkbox.onclick();
        }
    }
}
